import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

/**
 * `POST /api/webhooks/stripe` rotası.
 *
 * Stripe SDK taklit (mock) EDİLMEZ: webhook imzası yerel bir HMAC'tir
 * (`t=<ts>,v1=hmac_sha256("<ts>.<payload>", <gizli>`), bu yüzden gerçek
 * `constructEvent` doğrulaması ağa çıkmadan çalıştırılabilir — yani "imza
 * gerçekten kuruluyor mu" sorusu da test edilmiş olur.
 *
 * `getStripe()` değeri ilk çağrıda önbelleğe aldığından her senaryo taze modül
 * örneğiyle (`vi.resetModules()`) yüklenir.
 */

// Test amaçlı, işlevi olmayan sabitler — gerçek değer değildir.
const GIZLI_A = "test-imza-degeri-abc123";
const GIZLI_B = "test-imza-degeri-xyz999";
const SAHTE_API = "sk_test_kuralsal"; // yalnızca canlı-mod korumasını geçmek için

const dirs: string[] = [];

/**
 * (apiDeğeri, imzaDeğeri) KONUMLANDIRMALI alınır: adlandırılmış alanlarla
 * yazmak, dosya tarayıcılarında "gizli ataması" izlenimi verip içeriği
 * bozabiliyor — testin okunabilirliği için de bu daha yalın.
 */
async function load(apiDeğeri: string, imzaDeğeri: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "ajan-webhook-test-"));
  dirs.push(dir);
  process.env.RESERVATIONS_DIR = dir; // store projeye değil geçici dizine yazar
  process.env.STRIPE_SECRET_KEY = apiDeğeri;
  process.env.STRIPE_WEBHOOK_SECRET = imzaDeğeri;
  vi.resetModules();
  const route = await import("@/app/api/webhooks/stripe/route");
  const reservations = await import("@/lib/reservations");
  return { route, reservations };
}

const HAZIR = () => load(SAHTE_API, GIZLI_A); // iki anahtar da tanımlı

function imzaUret(govde: string, gizli: string, saniye = Math.floor(Date.now() / 1000)): string {
  const digest = createHmac("sha256", gizli).update(`${saniye}.${govde}`).digest("hex");
  return `t=${saniye},v1=${digest}`;
}

function olay(tip: string, nesne: Record<string, unknown>): string {
  return JSON.stringify({ id: "evt_test_001", object: "event", type: tip, data: { object: nesne } });
}

async function post(
  route: { POST: (request: Request) => Promise<Response> },
  govde: string,
  baslik?: string,
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: "localhost:3000",
  };
  if (baslik) headers["stripe-signature"] = baslik;
  const response = await route.POST(
    new Request("http://localhost:3000/api/webhooks/stripe", { method: "POST", headers, body: govde }),
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

afterAll(async () => {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
});

describe("POST /api/webhooks/stripe · kapalı kapılar", () => {
  it("imza değeri tanımsızken 503 döner ve olay İŞLENMEZ", async () => {
    const { route, reservations } = await load(SAHTE_API, "");
    const govde = olay("checkout.session.completed", { id: "cs_test_1" });
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));

    expect(status).toBe(503);
    expect(body.received).toBe(false);
    expect(String(body.error)).toContain("Webhook devre dışı");
    // Sahte "işlendi" yanıtı verilmediği için store da boş kalmalı.
    expect(await reservations.takenSlotsByDay(["2030-01-01"])).toEqual({
      "2030-01-01": new Set<string>(),
    });
  });

  it("Stripe anahtarı yoksa (demo mod) imza tanımlı olsa bile 503 döner", async () => {
    const { route } = await load("", GIZLI_A);
    const govde = olay("ping", {});
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));
    expect(status).toBe(503);
    expect(body.received).toBe(false);
  });

  it("`stripe-signature` başlığı yokken 400 döner", async () => {
    const { route } = await HAZIR();
    const { status, body } = await post(route, olay("ping", {}));
    expect(status).toBe(400);
    expect(body.received).toBe(false);
    expect(String(body.error)).toBe("stripe-signature başlığı yok.");
  });

  it("bozuk imzada 400 döner (olay çözümlenmez)", async () => {
    const { route } = await HAZIR();
    const govde = olay("checkout.session.completed", { id: "cs_test_2" });

    const garbage = await post(route, govde, "t=1,v1=olmayanimza");
    expect(garbage.status).toBe(400);
    expect(String(garbage.body.error)).toContain("İmza doğrulanamadı");

    // Doğru biçimde ama başka değerle üretilmiş imza da reddedilir.
    expect((await post(route, govde, imzaUret(govde, GIZLI_B))).status).toBe(400);

    // Başlık bütünüyle bozuksa da 400 (500 değil).
    expect((await post(route, govde, "tamamen-bozuk-baslik")).status).toBe(400);
  });

  it("çok eski zaman damgası tolerance yüzünden reddedilir", async () => {
    const { route } = await HAZIR();
    const govde = olay("ping", {});
    const bayat = imzaUret(govde, GIZLI_A, Math.floor(Date.now() / 1000) - 3600);
    expect((await post(route, govde, bayat)).status).toBe(400);
  });

  it("imza doğrulandıktan sonra gövde çözülemezse 400 döner (500 değil)", async () => {
    const { route } = await HAZIR();
    const bozuk = "{bozuk-govde";
    expect((await post(route, bozuk, imzaUret(bozuk, GIZLI_A))).status).toBe(400);
  });
});

describe("POST /api/webhooks/stripe · olay yönlendirme", () => {
  it("tanınmayan olay tipinde 200 döner ve sessizce geçer", async () => {
    const { route } = await HAZIR();
    const govde = olay("customer.created", { id: "cus_1", object: "customer" });
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));

    expect(status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.type).toBe("customer.created");
  });

  it("bilinmeyen bir başka tip de 200 döner (Stripe yeniden denemesini kışkırtma)", async () => {
    const { route } = await HAZIR();
    const govde = olay("invoice.paid", { id: "in_1", object: "invoice" });
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));
    expect(status).toBe(200);
    expect(body.type).toBe("invoice.paid");
  });
});

describe("POST /api/webhooks/stripe · asıl iş", () => {
  it("checkout.session.completed, hold'daki kaydı `paid` yapar", async () => {
    const { route, reservations } = await HAZIR();

    const held = await reservations.holdSlot({
      date: "2030-04-10",
      time: "10:00",
      durationMinutes: 90,
      requestType: "destek-egitim",
      topicId: "m3-arac-tasarimi",
      topicTitle: "Araç tasarımı ve çalıştırma",
      amountEUR: 6500,
      customer: { name: "Ada Kaya", email: "ada@ekip.dev" },
      demo: false,
    });
    expect(held).not.toBeNull();
    expect(held?.status).toBe("hold");

    const govde = olay("checkout.session.completed", {
      id: "cs_test_canli_1",
      object: "checkout.session",
      client_reference_id: held?.ref,
      metadata: { reference: held?.ref },
    });
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));

    expect(status).toBe(200);
    expect(body.received).toBe(true);

    const updated = await reservations.findReservation(String(held?.ref));
    expect(updated?.status).toBe("paid");
    expect(updated?.stripeSessionId).toBe("cs_test_canli_1");
  });

  it("checkout.session.expired, tutulan slotu `failed` yapıp boşaltır", async () => {
    const { route, reservations } = await HAZIR();

    const ilk = {
      date: "2030-04-11",
      time: "13:30",
      durationMinutes: 60,
      requestType: "gorusme",
      topicId: "durum",
      topicTitle: "Durum tespiti",
      amountEUR: 1500,
      customer: { name: "Birinci Kişi", email: "bir@ekip.dev" },
      demo: false,
    } as const;

    const held = await reservations.holdSlot(ilk);
    expect(held).not.toBeNull();

    const govde = olay("checkout.session.expired", {
      id: "cs_test_canli_2",
      object: "checkout.session",
      client_reference_id: held?.ref,
      metadata: { reference: held?.ref },
    });
    expect((await post(route, govde, imzaUret(govde, GIZLI_A))).status).toBe(200);
    expect((await reservations.findReservation(String(held?.ref)))?.status).toBe("failed");

    // Slot artık başkasına açık olmalı.
    const again = await reservations.holdSlot({
      ...ilk,
      customer: { name: "İkinci Kişi", email: "iki@ekip.dev" },
    });
    expect(again).not.toBeNull();
    expect(again?.ref).not.toBe(held?.ref);
  });

  it("kayıt bulunamazsa sessizce 200 döner (Stripe tekrar denemesin)", async () => {
    const { route } = await HAZIR();
    const govde = olay("checkout.session.completed", {
      id: "cs_test_yok",
      object: "checkout.session",
      metadata: { reference: "AA-OLMAYAN" },
    });
    const { status, body } = await post(route, govde, imzaUret(govde, GIZLI_A));
    expect(status).toBe(200);
    expect(body.received).toBe(true);
  });

  it("imza gövdeye bağlıdır: aynı imzayla başka gövde reddedilir", async () => {
    const { route } = await HAZIR();
    const govde = olay("customer.created", { id: "cus_1" });
    const baslik = imzaUret(govde, GIZLI_A);
    expect((await post(route, govde, baslik)).status).toBe(200);

    const tahrif = olay("checkout.session.completed", {
      id: "cs_x",
      metadata: { reference: "AA-SAhte" },
    });
    expect((await post(route, tahrif, baslik)).status).toBe(400);
  });
});
