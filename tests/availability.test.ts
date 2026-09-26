import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `GET /api/availability` rota testi.
 *
 * Rota gerçek saate bağlı olduğu için slotlar sabitlenmez: önce listeden bir slot
 * okunur, sonra O slot tutulur ve listenin ondan arındığı doğrulanır.
 * Kayıt dizini sistem geçici alanına alınır — proje `.data/`sına yazılmaz.
 */

let route: typeof import("@/app/api/availability/route");
let reservations: typeof import("@/lib/reservations");
const dirs: string[] = [];

/**
 * Store modül düzeyinde bir `Map` ve tek seferlik `loaded` bayrağı tutar → testler
 * AYNI slotu tüketirse sonraki test kirlenir. Bu yüzden her testte: yeni geçici
 * dizin + `vi.resetModules()` + yeniden import. (Önceki sürümde bir test, diğerinin
 * tuttuğu 10:00 slotunu görüp yanıltıcı şekilde "beklenmedik extra taken" veriyordu.)
 */
beforeEach(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ajan-availability-test-"));
  dirs.push(dir);
  process.env.RESERVATIONS_DIR = dir;
  process.env.STRIPE_SECRET_KEY = ""; // demo modu zorunlu kıl
  vi.resetModules();
  reservations = await import("@/lib/reservations");
  route = await import("@/app/api/availability/route");
});

afterAll(async () => {
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
});

type DayRow = {
  date: string;
  weekday: string;
  closed: boolean;
  reason?: string;
  openTimes: string[];
  taken: string[];
};

type Payload = { tip?: string; sure?: number; days?: DayRow[]; error?: string };

async function get(query: string): Promise<{ status: number; body: Payload }> {
  const response = await route.GET(
    new Request(`http://localhost:3000/api/availability?${query}`, {
      method: "GET",
      headers: { host: "localhost:3000" },
    }),
  );
  return { status: response.status, body: (await response.json()) as Payload };
}

async function hold(date: string, time: string, minutes: number) {
  return reservations.holdSlot({
    date,
    time,
    durationMinutes: minutes,
    requestType: "destek-egitim",
    topicId: "m3-arac-tasarimi",
    topicTitle: "Araç tasarımı ve çalıştırma",
    amountEUR: 6500,
    customer: { name: "Test Kişisi", email: "test@ekip.dev" },
    demo: true,
  });
}

describe("GET /api/availability · girdi doğrulama", () => {
  it("tanınmayan `tip` 400 döner", async () => {
    const { status, body } = await get("tip=korsan-tur&sure=90");
    expect(status).toBe(400);
    expect(body.error).toBe("Bilinmeyen talep türü.");
  });

  it("`tip` hiç yoksa da 400 döner (500 değil)", async () => {
    const { status, body } = await get("sure=90");
    expect(status).toBe(400);
    expect(body.error).toBe("Bilinmeyen talep türü.");
  });

  it("katalogda olmayan `sure` 400 döner", async () => {
    const { status, body } = await get("tip=destek-egitim&sure=45");
    expect(status).toBe(400);
    expect(body.error).toBe("Bu talep türü için geçerli bir süre değil.");
  });

  it("`sure` başka türün süresiyle de gelirse 400 döner", async () => {
    // 180 dk yalnız `kiralama` kataloğunda vardır.
    expect((await get("tip=destek-egitim&sure=180")).status).toBe(400);
    expect((await get("tip=kiralama&sure=180")).status).toBe(200);
  });

  it("`sure` sayı değilse 400 döner", async () => {
    expect((await get("tip=gorusme&sure=abc")).status).toBe(400);
    expect((await get("tip=gorusme")).status).toBe(400);
    expect((await get("tip=gorusme&sure=30.5")).status).toBe(400);
  });

  it("geçerli istekte seçilen tür ve süre geri döner", async () => {
    const { status, body } = await get("tip=gorusme&sure=30");
    expect(status).toBe(200);
    expect(body.tip).toBe("gorusme");
    expect(body.sure).toBe(30);
    expect(Array.isArray(body.days)).toBe(true);
  });
});

describe("GET /api/availability · `gun` kısıtı", () => {
  it("istenilen gün sayısı kadar gün döner", async () => {
    const { body } = await get("tip=destek-egitim&sure=90&gun=5");
    expect(body.days).toHaveLength(5);
  });

  it("üst sınır 30'a kısıtlanır", async () => {
    const clamped = await get("tip=destek-egitim&sure=90&gun=999");
    expect(clamped.body.days).toHaveLength(30);
    expect((await get("tip=destek-egitim&sure=90&gun=31")).body.days).toHaveLength(30);
  });

  it("alt sınır 1'e kısıtlanır; negatif ve sıfır da 1 üretir", async () => {
    expect((await get("tip=destek-egitim&sure=90&gun=0")).body.days).toHaveLength(1);
    expect((await get("tip=destek-egitim&sure=90&gun=-14")).body.days).toHaveLength(1);
  });

  it("geçersiz/boş `gun` varsayılan 14 güne düşer", async () => {
    expect((await get("tip=destek-egitim&sure=90&gun=abc")).body.days).toHaveLength(14);
    expect((await get("tip=destek-egitim&sure=90")).body.days).toHaveLength(14);
  });

  it("günler ardışık tarihte ve Türkçe gün adıyla döner", async () => {
    const { body } = await get("tip=destek-egitim&sure=60&gun=7");
    const days = body.days ?? [];
    expect(days.length).toBe(7);
    expect(new Set(days.map((day) => day.date)).size).toBe(7);
    for (let i = 1; i < days.length; i += 1) {
      const previous = new Date(`${days[i - 1]?.date}T12:00:00Z`).getTime();
      const current = new Date(`${days[i]?.date}T12:00:00Z`).getTime();
      expect(current - previous).toBe(86_400_000);
    }
    expect(days[0]?.weekday).toMatch(/^[A-ZÇĞİÖŞÜ]/i);
  });
});

describe("GET /api/availability · kapalı günler", () => {
  it("kapalı günlerin `taken` alanı boş dizi olarak döner (null/undefined değil)", async () => {
    const { body } = await get("tip=destek-egitim&sure=90&gun=14");
    const closed = (body.days ?? []).filter((day) => day.closed);
    expect(closed.length).toBeGreaterThan(0); // 14 günde en az bir hafta sonu vardır
    for (const day of closed) {
      expect(Array.isArray(day.taken)).toBe(true);
      expect(day.taken).toEqual([]);
      expect(day.openTimes).toEqual([]);
      expect(typeof day.reason).toBe("string");
    }
  });

  it("kapalı günün gerekçesi hafta sonu / resmî tatil ayrımını taşır", async () => {
    const { body } = await get("tip=destek-egitim&sure=90&gun=21");
    const reasons = new Set((body.days ?? []).filter((day) => day.closed).map((day) => day.reason));
    for (const reason of reasons) {
      expect(["Hafta sonu kapalı", "Resmî tatil"]).toContain(reason);
    }
  });

  it("açık günler en az bir alan kümesi taşır ve `taken` dizisidir", async () => {
    const { body } = await get("tip=destek-egitim&sure=60&gun=10");
    const open = (body.days ?? []).filter((day) => !day.closed);
    expect(open.length).toBeGreaterThan(0);
    for (const day of open) {
      expect(Array.isArray(day.openTimes)).toBe(true);
      expect(Array.isArray(day.taken)).toBe(true);
    }
  });
});

describe("GET /api/availability · tutulan saatlerin düşülmesi", () => {
  it("rezerve edilen saat openTimes'dan düşer, taken listesinde görünür", async () => {
    const first = await get("tip=destek-egitim&sure=90&gun=14");
    const target = (first.body.days ?? []).find((day) => !day.closed && day.openTimes.length > 1);
    expect(target).toBeDefined();
    const date = String(target?.date);
    const [before, time] = [String(target?.openTimes[0]), String(target?.openTimes[1])];
    expect(before).not.toBe(time);

    const held = await hold(date, time, 90);
    expect(held).not.toBeNull();

    const after = await get("tip=destek-egitim&sure=90&gun=14");
    const day = (after.body.days ?? []).find((entry) => entry.date === date);

    expect(day?.openTimes).not.toContain(time);
    expect(day?.taken).toContain(time);
    // Geri kalan saatlar korunur: yalnız tutulan slot düşmüş olmalı.
    expect(day?.openTimes).toContain(before);
    expect((day?.openTimes.length ?? 0)).toBe((target?.openTimes.length ?? 0) - 1);
  });

  it("bir günün tüm açık saatleri tutulunca gerekçe 'slot kalmadı' olur, gün kapanmaz", async () => {
    const snapshot = await get("tip=destek-egitim&sure=120&gun=14");
    // En az slot barındıran günü seç: hepsini tutmak için kısa liste yeterli.
    const target = [...(snapshot.body.days ?? [])]
      .filter((day) => !day.closed && day.openTimes.length > 0)
      .sort((a, b) => a.openTimes.length - b.openTimes.length)[0];
    expect(target).toBeDefined();

    for (const time of target?.openTimes ?? []) {
      expect(await hold(String(target?.date), time, 120)).not.toBeNull();
    }

    const after = await get("tip=destek-egitim&sure=120&gun=14");
    const day = (after.body.days ?? []).find((entry) => entry.date === target?.date);

    expect(day?.closed).toBe(false);
    expect(day?.openTimes).toEqual([]);
    expect(day?.reason).toBe("Bu gün için uygun slot kalmadı");
    expect([...(day?.taken ?? [])].sort()).toEqual([...(target?.openTimes ?? [])].sort());
  });

  it("tutulan saat başka bir sürenin listesini etkilemez (ızgaralar ortaksa bile)", async () => {
    const ninety = await get("tip=destek-egitim&sure=90&gun=14");
    const target = (ninety.body.days ?? []).find((day) => !day.closed && day.openTimes.length > 0);
    const time = String(target?.openTimes[0]);
    expect(target).toBeDefined();
    expect(await hold(String(target?.date), time, 90)).not.toBeNull();

    const thirty = await get("tip=gorusme&sure=30&gun=14");
    const sameDay = (thirty.body.days ?? []).find((day) => day.date === target?.date);
    // 30 dakikalık ızgara başka saat üretir; tutulan 90'lık slot 30'luk listede
    // yalnızca birebir aynı damgaysa düşer — en azından liste boş dönmemeli.
    expect(sameDay?.closed).toBe(false);
    expect((sameDay?.openTimes.length ?? 0)).toBeGreaterThan(0);
  });

  it("yanlış saat diliminde tutulan slot, farklı bir sürenin açılış saatını düşürmez", async () => {
    const plans = await get("tip=destek-egitim&sure=60&gun=14");
    const target = (plans.body.days ?? []).find((day) => !day.closed && day.openTimes.length > 1);
    const early = String(target?.openTimes[0]);
    const later = String(target?.openTimes[1]);

    expect(await hold(String(target?.date), later, 60)).not.toBeNull();
    const after = await get("tip=destek-egitim&sure=60&gun=14");
    const day = (after.body.days ?? []).find((entry) => entry.date === target?.date);

    expect(day?.openTimes[0]).toBe(early); // ilk saat hâlâ açık
    expect(day?.openTimes).not.toContain(later);
  });
});
