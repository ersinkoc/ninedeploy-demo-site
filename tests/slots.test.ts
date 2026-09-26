import { describe, expect, it } from "vitest";

import {
  CLOSE_MINUTES,
  LUNCH_END,
  LUNCH_START,
  MIN_LEAD_MINUTES,
  OPEN_MINUTES,
  buildAvailability,
  dayKey,
  istanbulMinutes,
  istanbulNow,
  slotLabel,
  slotToISO,
  timesForDay,
  trWeekdayFull,
} from "@/lib/slots";

/**
 * `buildAvailability()` — İstanbul takvim kuralları.
 * Testler gerçek saate bağlı KALMASIN diye `today` + `nowMinutes` sabit verilir.
 * Sabitler: 2026-09-26 Cumartesi → 2026-09-28 Pazartesi, 2026-10-03 Cumartesi,
 * 2026-10-29 Perşembe = resmî tatil (Cumhuriyet Bayramı).
 */

const MONDAY = "2026-09-28";
const SATURDAY = "2026-10-03";
const HOLIDAY_EVE = "2026-10-27"; // Salı
const HOLIDAY = "2026-10-29"; // Perşembe, resmî tatil

const minutes = (hhmm: string): number => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

describe("İstanbul saat kayması", () => {
  it("UTC girdisini UTC+3'e çevirir ve gün sınırını doğru taşır", () => {
    expect(istanbulMinutes(new Date("2026-09-28T09:00:00Z"))).toBe(12 * 60);
    expect(dayKey(istanbulNow(new Date("2026-09-28T23:00:00Z")))).toBe("2026-09-29");
  });
});

describe("timesForDay · öğle arası ve çalışma saatleri", () => {
  it("09:30'da açılır, süre bitiminden önce kapanır", () => {
    const times = timesForDay(60);
    expect(times[0]).toBe("09:30");
    expect(times.at(-1)).toBe("18:00"); // 18:00 + 60 = 19:00 (CLOSE_MINUTES)
    expect(minutes(times.at(-1) ?? "") + 60).toBe(CLOSE_MINUTES);
  });

  it("öğle arasına taşan saatler üretilmez (12:00–13:00)", () => {
    for (const time of timesForDay(60)) {
      const start = minutes(time);
      const overlaps = start < LUNCH_END && start + 60 > LUNCH_START;
      expect(overlaps).toBe(false);
    }
    expect(timesForDay(60)).not.toContain("11:30"); // 11:30–12:30 taşar
    expect(timesForDay(60)).not.toContain("12:00");
    expect(timesForDay(60)).not.toContain("12:30");
    expect(timesForDay(60)).toContain("11:00"); // 11:00–12:00 tam öğle öncesi biter
    expect(timesForDay(60)).toContain("13:00");
  });

  it("uzun oturumlar yalnızca öğleden sonra bloğuna sığar", () => {
    // 5 saatlik kota: 09:30+300 öğleye taşar → tek pencere 13:00–14:00 başlangıçları.
    expect(timesForDay(300)).toEqual(["13:00", "13:30", "14:00"]);
  });

  it("90 dakikada 11:00 elenir, 10:30 kalır", () => {
    expect(timesForDay(90)).not.toContain("11:00");
    expect(timesForDay(90)).toContain("10:30");
  });

  it("30 dakikalık görüşme öğleden önce yoğunlaşır, boşlukta slot yoktur", () => {
    const times = timesForDay(30);
    expect(times.length).toBeGreaterThan(10);
    expect(times.every((time) => !time.startsWith("12:"))).toBe(true);
    expect(minutes(times[0] ?? "")).toBe(OPEN_MINUTES);
  });
});

describe("buildAvailability · hafta sonu ve resmî tatil", () => {
  it("Pazartesi açıktır, hafta sonu kapalıdır ve gerekçesi yazar", () => {
    const plans = buildAvailability({ today: MONDAY, nowMinutes: 0, days: 7, durationMinutes: 60 });
    expect(plans).toHaveLength(7);

    const monday = plans.find((plan) => plan.date === MONDAY);
    expect(monday?.closed).toBe(false);
    expect(monday?.openTimes.length).toBeGreaterThan(0);
    expect(monday?.weekday).toBe("Pazartesi");

    const saturday = plans.find((plan) => plan.date === SATURDAY);
    expect(saturday?.closed).toBe(true);
    expect(saturday?.reason).toBe("Hafta sonu kapalı");
    expect(saturday?.openTimes).toEqual([]);

    const days = new Set(plans.map((plan) => plan.weekday));
    expect(days.has("Pazar")).toBe(true);
    expect(plans.filter((plan) => plan.closed).every((plan) => plan.openTimes.length === 0)).toBe(true);
  });

  it("hafta içi resmî tatil de kapalıdır (tarih gününe bakmaz, tatile bakar)", () => {
    const plans = buildAvailability({
      today: HOLIDAY_EVE,
      nowMinutes: 0,
      days: 5,
      durationMinutes: 60,
    });
    const holiday = plans.find((plan) => plan.date === HOLIDAY);
    expect(holiday?.weekday).toBe("Perşembe");
    expect(holiday?.closed).toBe(true);
    expect(holiday?.reason).toBe("Resmî tatil");
    expect(holiday?.openTimes).toEqual([]);
  });

  it("tüm günler kapalıysa hiçbir planda slot yoktur", () => {
    const plans = buildAvailability({ today: SATURDAY, nowMinutes: 0, days: 2, durationMinutes: 60 });
    expect(plans.every((plan) => plan.closed && plan.openTimes.length === 0)).toBe(true);
  });
});

describe("buildAvailability · lead time (önceden haber)", () => {
  it("bugünün slotları en az 6 saat sonradan başlar", () => {
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 10 * 60, // 10:00
      days: 2,
      durationMinutes: 60,
    });
    const today = plans[0];
    expect(today?.date).toBe(MONDAY);
    expect(today?.openTimes[0]).toBe("16:00"); // 10:00 + 6 saat
    expect(
      (today?.openTimes ?? []).every((time) => minutes(time) >= 10 * 60 + MIN_LEAD_MINUTES),
    ).toBe(true);
  });

  it("ertesi gün lead time'dan etkilenmez, sabah 09:30 açılır", () => {
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 10 * 60,
      days: 2,
      durationMinutes: 60,
    });
    expect(plans[1]?.openTimes[0]).toBe("09:30");
  });

  it("gün geç biterse bugün boşalır ama kapalı sayılmaz (gerekçesi farklıdır)", () => {
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 18 * 60, // 18:00 → lead time 00:00'ı aşar
      days: 1,
      durationMinutes: 60,
    });
    const today = plans[0];
    expect(today?.closed).toBe(false);
    expect(today?.openTimes).toEqual([]);
    expect(today?.reason).toBe("Bu gün için uygun slot kalmadı");
  });
});

describe("buildAvailability · çakışan slot", () => {
  it("alınmış saatler açık listeden düşer", () => {
    const all = timesForDay(60);
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 0,
      days: 1,
      durationMinutes: 60,
      takenByDay: { [MONDAY]: new Set<string>([all[0] ?? "09:30", "10:00"]) },
    });
    const today = plans[0];
    expect(today?.openTimes).not.toContain(all[0]);
    expect(today?.openTimes).not.toContain("10:00");
    expect(today?.openTimes ?? []).toHaveLength(all.length - 2);
  });

  it("bir günün tüm slotları dolunca gerekçe 'slot kalmadı' olur, gün kapanmaz", () => {
    const all = timesForDay(90);
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 0,
      days: 1,
      durationMinutes: 90,
      takenByDay: { [MONDAY]: new Set<string>(all) },
    });
    expect(plans[0]?.closed).toBe(false);
    expect(plans[0]?.openTimes).toEqual([]);
    expect(plans[0]?.reason).toBe("Bu gün için uygun slot kalmadı");
  });

  it("verilmeyen günler dolu sayılmaz", () => {
    const plans = buildAvailability({
      today: MONDAY,
      nowMinutes: 0,
      days: 3,
      durationMinutes: 60,
      takenByDay: { [MONDAY]: new Set<string>(["09:30"]) },
    });
    expect((plans[1]?.openTimes.length ?? 0) > 0).toBe(true);
  });
});

describe("ufuk ve biçimlendirme", () => {
  it("gün sayısı 1–45 arasına kısıtlanır", () => {
    expect(buildAvailability({ today: MONDAY, nowMinutes: 0, days: 999, durationMinutes: 60 })).toHaveLength(45);
    expect(buildAvailability({ today: MONDAY, nowMinutes: 0, days: 0, durationMinutes: 60 })).toHaveLength(1);
  });

  it("slot damgası her zaman +03:00 ofsetiyle basılır", () => {
    expect(slotToISO(MONDAY, "09:30")).toBe(`${MONDAY}T09:30:00+03:00`);
    expect(new Date(slotToISO(MONDAY, "09:30")).getTime()).toBe(
      new Date(`${MONDAY}T06:30:00Z`).getTime(),
    );
  });

  it("slot etiketi bitiş saatini Türkçe gösterimle taşır", () => {
    expect(slotLabel("09:30", 60)).toBe("09.30–10.30");
    expect(slotLabel("17:30", 90)).toBe("17.30–19.00");
  });

  it("gün adları Türkçe ve tam yazar", () => {
    expect(trWeekdayFull(MONDAY)).toBe("Pazartesi");
    expect(trWeekdayFull(SATURDAY)).toBe("Cumartesi");
  });
});
