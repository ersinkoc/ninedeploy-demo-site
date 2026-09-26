import { describe, expect, it } from "vitest";

import {
  MAX_NOTES,
  emptyDraft,
  hasErrors,
  priceOf,
  slotISO,
  slotIsPlausible,
  validateBooking,
  validateSelection,
  type BookingDraft,
} from "@/lib/booking";
import { requestTypes } from "@/lib/catalog";

/**
 * Fiyatlama ve form kuralları. Asıl korunan şey: fiyatın ISTISASIZ katalogdan
 * gelmesi ve çakışan/uygunsuz slotun reddedilmesi.
 */

const MONDAY = "2026-09-28"; // Pazartesi
const SATURDAY = "2026-10-03"; // Cumartesi

const draft = (over: Partial<BookingDraft> = {}): BookingDraft => ({
  ...emptyDraft,
  requestType: "destek-egitim",
  topicId: "m3-arac-tasarimi",
  minutes: 90,
  date: MONDAY,
  time: "10:30",
  name: "Deniz Yılmaz",
  email: "deniz@ekip.dev",
  company: "",
  notes: "TypeScript + Postgres, araç çağrıları üretime geçemiyor.",
  ...over,
});

describe("priceOf · fiyat her zaman katalogdan", () => {
  it("geçerli seçim, katalogdaki `priceEUR` değerinin aynısını döner", () => {
    for (const type of requestTypes) {
      const topic = type.topics[0];
      for (const duration of type.durations) {
        if (!topic) continue;
        const priced = priceOf({ requestType: type.id, topicId: topic.id, minutes: duration.minutes });
        expect("error" in priced).toBe(false);
        if (!("error" in priced)) {
          expect(priced.amountEUR).toBe(duration.priceEUR);
          expect(priced.minutes).toBe(duration.minutes);
          expect(priced.type.id).toBe(type.id);
        }
      }
    }
  });

  it("istemcinin gönderdiği sahte alanlar fiyatı değiştirmez", () => {
    const priced = priceOf({
      requestType: "kiralama",
      topicId: "r-review",
      minutes: 300,
      // istemciden gelebilecek saldırı/zenginleştirme alanları:
      amountEUR: 1,
      priceEUR: 1,
      currency: "usd",
      discount: "ÇEK-1000",
    } as Parameters<typeof priceOf>[0] & Record<string, unknown>);

    expect("error" in priced).toBe(false);
    if (!("error" in priced)) {
      const rent = requestTypes.find((type) => type.id === "kiralama");
      expect(priced.amountEUR).toBe(rent?.durations.find((entry) => entry.minutes === 300)?.priceEUR);
      expect(priced.amountEUR).not.toBe(1);
    }
  });

  it("bilinmeyen talep türü reddedilir", () => {
    const priced = priceOf({ requestType: "bedava-her-sey", topicId: "durum", minutes: 30 });
    expect(priced).toEqual({ error: "Talep türü tanınmadı." });
  });

  it("konu başka türden sızdırılamaz", () => {
    const priced = priceOf({ requestType: "gorusme", topicId: "m3-arac-tasarimi", minutes: 60 });
    expect(priced).toEqual({ error: "Konu bu talep türünde bulunamadı." });
  });

  it("katalogda olmayan süre reddedilir", () => {
    const priced = priceOf({ requestType: "destek-egitim", topicId: "m3-arac-tasarimi", minutes: 45 });
    expect(priced).toEqual({ error: "Seçilen süre bu talep türünde yok." });
  });
});

describe("slotIsPlausible · öğle arası, hafta sonu, geçmiş tarih", () => {
  it("öğle arasına taşan saat reddedilir", () => {
    expect(slotIsPlausible(MONDAY, "12:00", 60)).toBe("Bu saat, seçilen süre için uygun değil.");
    expect(slotIsPlausible(MONDAY, "11:30", 60)).toBe("Bu saat, seçilen süre için uygun değil.");
    expect(slotIsPlausible(MONDAY, "13:00", 60)).toBeUndefined();
  });

  it("kapanıştan sonra bitecek slot reddedilir", () => {
    expect(slotIsPlausible(MONDAY, "18:30", 60)).toBeDefined(); // 19:30 taşar
    expect(slotIsPlausible(MONDAY, "09:30", 60)).toBeUndefined();
  });

  it("geçmiş tarih reddedilir, biçimsiz girdi reddedilir", () => {
    expect(slotIsPlausible("2020-01-02", "10:00", 60)).toBe("Geçmiş bir tarih seçilemez.");
    expect(slotIsPlausible("28.09.2026", "10:00", 60)).toBe("Tarih biçimi geçersiz.");
    expect(slotIsPlausible(MONDAY, "10.00", 60)).toBe("Saat biçimi geçersiz.");
  });

  it("hafta sonu bu katmanda geçebilir; kapama işi uygunluk API'sinindir", () => {
    // Bilinçli ayrım: slotIsPlausible yalnız ızgaraya bakar, günü bilmez.
    expect(slotIsPlausible(SATURDAY, "10:00", 60)).toBeUndefined();
  });
});

describe("validateSelection · adım ilerletme", () => {
  it("gün/saat eksikse doğru alanı işaretler", () => {
    expect(validateSelection(draft({ date: "" }))).toEqual({ date: "Bir gün seçin." });
    expect(validateSelection(draft({ time: "" }))).toEqual({ time: "Bir saat seçin." });
    expect(validateSelection(draft({ topicId: "olmayan-konu" })).requestType).toBeTruthy();
    expect(validateSelection(draft())).toEqual({});
  });
});

describe("validateBooking · son gönderim", () => {
  it("geçerli bir şartname hiç hata vermez", () => {
    const errors = validateBooking(draft());
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it("ad ve e-posta zorunlu, e-posta biçimi aranır", () => {
    const errors = validateBooking(draft({ name: "  ", email: "olmayan" }));
    expect(errors.name).toContain("Adınızı yazın");
    expect(errors.email).toContain("Geçerli bir e-posta");
    expect(hasErrors(errors)).toBe(true);
  });

  it("çakışan (uygunsuz) slot, saat alanında hata olarak döner", () => {
    const errors = validateBooking(draft({ time: "12:00" }));
    expect(errors.time).toBe("Bu saat, seçilen süre için uygun değil.");
  });

  it("uzun not ve uzun şirket adı reddedilir", () => {
    expect(validateBooking(draft({ notes: "x".repeat(MAX_NOTES + 1) })).notes).toContain("800");
    expect(validateBooking(draft({ company: "x".repeat(121) })).company).toBeTruthy();
    expect(validateBooking(draft({ notes: "x".repeat(MAX_NOTES) })).notes).toBeUndefined();
  });

  it("boş şartname tüm kritik alanları işaretler", () => {
    const errors = validateBooking(emptyDraft);
    expect(Object.keys(errors).sort()).toEqual(["email", "name", "requestType"]);
  });
});

describe("slotISO · Stripe metadata girdisi", () => {
  it("seçilen slotu +03:00 ofsetiyle mutlak zamana çevirir", () => {
    expect(slotISO(draft({ date: MONDAY, time: "10:30" }))).toBe(`${MONDAY}T10:30:00+03:00`);
  });
});
