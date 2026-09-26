import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/checkout` sözleşme testleri: çakışan slot 409, istemci fiyatı YOK SAYILIR,
 * geçersiz alan 422, demo mod onay sayfasına yönlendirir.
 * Kayıt dosyası sistemin geçici dizinine yazılır; proje `.data/`sına dokunulmaz.
 */

type RouteModule = typeof import("@/app/api/checkout/route");

let route: RouteModule;
let reservations: typeof import("@/lib/reservations");
let slots: typeof import("@/lib/slots");
const dirs: string[] = [];

/**
 * Her teste taze store + taze modül örnekleri: `reservations.ts` modül düzeyinde bir
 * Map ve tek seferlik `loaded` bayrağı tuttuğu için, paylaşılan store'da biriken
 * hold'lar sonraki testin "boş slot" varsayımını sessizce bozuyordu.
 * RESERVATIONS_DIR, modüller yüklenmeden ÖNCE ayarlanmalı → reset + dinamik import.
 */
beforeEach(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ajan-checkout-test-"));
  dirs.push(dir);
  process.env.RESERVATIONS_DIR = dir;
  process.env.STRIPE_SECRET_KEY = ""; // demo modu zorunlu kıl
  vi.resetModules();
  reservations = await import("@/lib/reservations");
  slots = await import("@/lib/slots");
  route = await import("@/app/api/checkout/route");
});

afterAll(async () => {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
});

/**
 * Her teste AYNI slotu iki kez vermemek için benzersiz tahsis:
 * çakışma testi hariç, hiçbir test başkasının rezerve ettiği saati kullanmasın.
 */
const allocated = new Set<string>();

function takeSlot(durationMinutes: number): { date: string; time: string } {
  const plans = slots.buildAvailability({ days: 30, durationMinutes });
  for (const plan of plans) {
    if (plan.closed) continue;
    for (const time of plan.openTimes) {
      const key = `${plan.date} ${time}`;
      if (allocated.has(key)) continue;
      allocated.add(key);
      return { date: plan.date, time };
    }
  }
  throw new Error("Test için boş slot kalmadı.");
}

async function post(body: unknown) {
  const response = await route.POST(
    new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

const baseBooking = () => {
  const slot = takeSlot(90);
  return {
    requestType: "destek-egitim",
    topicId: "m3-arac-tasarimi",
    minutes: 90,
    date: slot.date,
    time: slot.time,
    name: "Deniz Yılmaz",
    email: "deniz@ekip.dev",
    company: "",
    notes: "Araç sözleşmelerini birlikte kurmak istiyoruz.",
  };
};

describe("POST /api/checkout", () => {
  it("demo modda ödeme almadan kayıt üretir ve onay sayfasına yönlendirir", async () => {
    const { status, body } = await post(baseBooking());
    expect(status).toBe(200);
    expect(body.mode).toBe("demo");
    expect(String(body.ref)).toMatch(/^AA-[A-Z0-9]{6}$/);
    expect(String(body.redirect)).toContain("/tesekkur?ref=");

    const stored = await reservations.findReservation(String(body.ref));
    expect(stored?.status).toBe("paid");
    expect(stored?.demo).toBe(true);
    expect(stored?.customer.email).toBe("deniz@ekip.dev");
  });

  it("istemcinin gönderdiği fiyat DEĞİL katalog fiyatı yazılır", async () => {
    const booking = { ...baseBooking(), amountEUR: 1, priceEUR: 1, currency: "usd", discount: "%99" };
    const { status, body } = await post(booking);
    expect(status).toBe(200);

    const stored = await reservations.findReservation(String(body.ref));
    const training = slots.buildAvailability; // referans: modül yüklendi
    expect(typeof training).toBe("function");
    expect(stored?.amountEUR).toBe(170); // katalog: destek-egitim · 90 dk (EUR)
    expect(stored?.amountEUR).not.toBe(1);
    expect(stored?.durationMinutes).toBe(90);
  });

  it("çakışan slot: aynı saat ikinci kez rezerve edilemez (409)", async () => {
    const booking = baseBooking();
    const first = await post(booking);
    expect(first.status).toBe(200);

    const second = await post(booking);
    expect(second.status).toBe(409);
    expect(String(second.body.error)).toContain("doldu");

    const taken = await reservations.takenSlotsByDay([booking.date]);
    expect(Array.from(taken[booking.date] ?? [])).toContain(booking.time);

    // Çakışma UI'a da yansır: uygunluk listesi o saati artık içermez.
    const plans = slots.buildAvailability({
      days: 30,
      durationMinutes: 90,
      takenByDay: taken,
    });
    const day = plans.find((plan) => plan.date === booking.date);
    expect(day?.openTimes).not.toContain(booking.time);
  });

  it("holdSlot katmanı da çakışmayı reddeder; iptal edilince slot geri açılır", async () => {
    const { date, time } = takeSlot(60);
    const input = {
      date,
      time,
      durationMinutes: 60,
      requestType: "gorusme" as const,
      topicId: "durum",
      topicTitle: "Durum tespiti",
      amountEUR: 1500,
      customer: { name: "Ada Kaya", email: "ada@ekip.dev" },
      demo: true,
    };

    const held = await reservations.holdSlot(input);
    expect(held).not.toBeNull();
    expect(await reservations.holdSlot(input)).toBeNull();

    await reservations.markStatus(String(held?.ref), "cancelled");
    const again = await reservations.holdSlot(input);
    expect(again?.ref).toBeTruthy();
    expect(again?.ref).not.toBe(held?.ref);
  });

  it("geçmiş tarih ve kapalı gün reddedilir", async () => {
    expect((await post({ ...baseBooking(), date: "2020-01-15" })).status).toBe(422);

    const weekend = slots
      .buildAvailability({ days: 30, durationMinutes: 60 })
      .find((plan) => plan.closed && plan.reason === "Hafta sonu kapalı");
    expect(weekend).toBeDefined();

    const closed = await post({ ...baseBooking(), minutes: 60, date: weekend?.date, time: "10:00" });
    expect(closed.status).toBe(409);
    expect(String(closed.body.error)).toBe("Seçtiğiniz gün kapalı.");
  });

  it("öğle arasına taşan saat sunucuda da reddedilir", async () => {
    const { date } = takeSlot(60);
    const lunch = await post({ ...baseBooking(), minutes: 60, date, time: "12:00" });
    expect(lunch.status).toBe(422);
    // Gerekçe üst mesajda değil, alan düzeyinde döner: form o satırı işaretleyebilir.
    const fields = lunch.body.fields as Record<string, string>;
    expect(String(fields.time)).toContain("uygun değil");
  });

  it("eksik/hatalı alan 422 + alan bazlı hata döner", async () => {
    const { status, body } = await post({ ...baseBooking(), email: "olmayan", name: "" });
    expect(status).toBe(422);
    expect(String(body.error)).toContain("eksik");
    const fields = body.fields as Record<string, string>;
    expect(fields.email).toBeTruthy();
    expect(fields.name).toBeTruthy();
  });

  it("katalogda olmayan süre ve tür reddedilir", async () => {
    expect((await post({ ...baseBooking(), minutes: 45 })).status).toBe(422);
    expect((await post({ ...baseBooking(), requestType: "korsan" })).status).toBe(422);
    // Konu başka talep türünden sızamaz.
    expect((await post({ ...baseBooking(), requestType: "gorusme", topicId: "m3-arac-tasarimi" })).status).toBe(
      422,
    );
  });

  it("bozuk JSON 400 döner (500 değil)", async () => {
    expect((await post("{bu-json-degil")).status).toBe(400);
  });
});
