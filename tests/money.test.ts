import { describe, expect, it } from "vitest";

import { priceOf } from "@/lib/booking";
import { requestTypes } from "@/lib/catalog";
import { formatDuration, formatPrice, toCents } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * Para katmanı — Stripe `unit_amount` buradan doğuyor, yani buradaki bir kayma
 * müşteriden yanlış tutar tahsil edilmesi demektir.
 * EUR fiyatları tam sayı; sent dönüşümü floating-point artefaktı üretmemeli.
 */

const allDurations = requestTypes.flatMap((type) =>
  type.durations.map((duration) => ({
    typeId: type.id,
    topicId: type.topics[0]?.id ?? "",
    minutes: duration.minutes,
    priceEUR: duration.priceEUR,
  })),
);

describe("katalog fiyat verisi", () => {
  it("her süre tam sayı, pozitif bir EUR bedeli taşır", () => {
    expect(allDurations.length).toBeGreaterThan(8);
    for (const entry of allDurations) {
      expect(Number.isInteger(entry.priceEUR)).toBe(true);
      expect(entry.priceEUR).toBeGreaterThan(0);
      expect(Number.isInteger(entry.minutes)).toBe(true);
      expect(entry.minutes).toBeGreaterThanOrEqual(30);
    }
  });

  it("para birimi site genelinde tektir ve Intl için geçerlidir", () => {
    expect(site.currency).toBe("eur");
    const plain = new Intl.NumberFormat(site.locale, { style: "currency", currency: "EUR" });
    expect(plain.format(1)).toContain("€"); // tr-TR + EUR → €1,00 (simge önde)
    expect(plain.format(1000)).toMatch(/1.000/); // tr-TR binlik ayracı "."
  });
});

describe("toCents · Stripe unit_amount", () => {
  it("katalogdaki HER bedeli santim cinsinden tam sayıya çevirir", () => {
    for (const entry of allDurations) {
      const amount = toCents(entry.priceEUR);
      expect(Number.isInteger(amount)).toBe(true);
      expect(amount).toBe(entry.priceEUR * 100);
    }
  });

  it("bilinen bedeller tam beklenen değeri verir", () => {
    expect(toCents(1500)).toBe(150000);
    expect(toCents(2750)).toBe(275000);
    expect(toCents(6500)).toBe(650000);
    expect(toCents(27500)).toBe(2750000);
    expect(toCents(0)).toBe(0);
  });

  it("floating-point artefaktını deterministik yuvarlar (0.1 + 0.2 ≠ 0.3 tuzağı)", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
    expect(Number.isInteger(toCents(4.2))).toBe(true);
    // IEEE-754 farkı: 1.005 tam temsil edilemez → 1.005*100 = 100.49999999999999 → 100.
    // 2.675*100 ise tam olarak 267.5'e düşer → Math.round yukarı yuvarlar → 268.
    // Katalog TL'yi TAM SAYI tuttuğu için bu dallar pratikte hiç çalışmaz; buraya
    // sabitlememin nedeni, biri kataloga ondalık bedel yazarsa sonucun BELİRLİ ve
    // tahmin edilebilir kalması (sessiz "bir kuruş eksik/fazla" sürprizi olmaması).
    expect(toCents(1.005)).toBe(100);
    expect(toCents(2.675)).toBe(268);
  });

  it("negatif bedel üretilmez (indirim alanı olsaydı işaret korunurdu)", () => {
    for (const entry of allDurations) {
      expect(toCents(entry.priceEUR)).toBeGreaterThan(0);
    }
    expect(toCents(-100)).toBe(-10000); // helper işaretleri korur; kapı validatördedir
  });
});

describe("priceOf → toCents zinciri (uçtan uca tutar)", () => {
  it("her tür×süre için sunucunun hesapladığı bedel katalogdaki ile birebir aynıdır", () => {
    for (const type of requestTypes) {
      const topic = type.topics[0];
      expect(topic).toBeDefined();
      for (const duration of type.durations) {
        const priced = priceOf({ requestType: type.id, topicId: String(topic?.id), minutes: duration.minutes });
        expect("error" in priced).toBe(false);
        if (!("error" in priced)) {
          expect(priced.amountEUR).toBe(duration.priceEUR);
          expect(toCents(priced.amountEUR)).toBe(duration.priceEUR * 100);
        }
      }
    }
  });

  it("katalogda olmayan dakika, bedel üretemez (sessizce ucuzlamaz)", () => {
    const type = requestTypes[0];
    expect(type).toBeDefined();
    const priced = priceOf({
      requestType: String(type?.id),
      topicId: String(type?.topics[0]?.id),
      minutes: 1, // katalogda olmayan bir dakika ile fiyat düşürme denemesi
    });
    expect(priced).toEqual({ error: "Seçilen süre bu talep türünde yok." });
  });
});

describe("görünen para ve süre metni", () => {
  it("formatPrice ondalık göstermez ve binlik ayracı kullanır", () => {
    const text = formatPrice(6500);
    expect(text).toContain("6");
    expect(text).toContain("500");
    expect(text).toMatch(/€/);
    expect(/[,.]\d{1,2}$/.test(text)).toBe(false); // sent ondalığı basılmamalı
    for (const entry of allDurations) {
      expect(formatPrice(entry.priceEUR)).toMatch(/€/);
    }
  });

  it("formatDuration saat/dakika sınırlarını Türkçe yazar", () => {
    expect(formatDuration(30)).toBe("30 dk");
    expect(formatDuration(60)).toBe("1 saat");
    expect(formatDuration(90)).toBe("1 sa 30 dk");
    expect(formatDuration(120)).toBe("2 saat");
    expect(formatDuration(300)).toBe("5 saat");
    expect(formatDuration(600)).toBe("10 saat");
  });
});
