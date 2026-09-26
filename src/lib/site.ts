/**
 * Site kimliği, yasal satıcı ve navigasyon — tek kaynak.
 * Marka "Ajan Atölyesi"; fatura/ödeme tarafındaki yasal gerçek kişi ise
 * aşağıdaki şirkettir. Değiştirmek için tek dosya.
 */

export const site = {
  name: "Ajan Atölyesi",
  tagline: "AI ajanını kutudan çıkarma. Kendi projende, içeride kur.",
  claim:
    "1:1 canlı çalıştaylarla, kendi kod tabanın üzerinden: sağlayıcı ve model seçeneklerini seçip gerisini %100 içeride kurduğun agentic sistemler.",

  /** Fatura ve ödemenin ait olduğu yasal varlık (Stripe hesabı da bu). */
  company: {
    legalName: "Ecostack Technology OÜ",
    role: "Hizmet sağlayıcı / satıcı",
    email: "info@ecostack.ee",
    phone: "+372 5855 7221",
    registryCode: "16935780",
    vat: "EE102714663",
    address: "Pallasti tn 50-18, 11413 Tallinn, Harju maakond, Estonya",
    country: "Estonya (EE)",
    web: "https://ecostack.ee",
  },
  email: "info@ecostack.ee",

  /** Sabit Calendly/Zoom bağlantısı yok; rezervasyon `/rezervasyon` üzerinden. */
  bookingPath: "/rezervasyon",

  locale: "tr-TR",
  /** Fiyatlar EURO; gösterim `tr-TR`, Stripe para birimi `eur`. */
  currency: "eur",
  timeZone: "Europe/Istanbul",
} as const;

export type NavItem = { href: string; label: string; note: string };

export const primaryNav: readonly NavItem[] = [
  { href: "/egitim", label: "Eğitim", note: "1:1 canlı çalıştaylar" },
  { href: "/danismanlik", label: "Danışmanlık", note: "bırak profesyoneller yapsın" },
  { href: "/saatlik", label: "Saatlik", note: "yanında bir kıdemli" },
  { href: "/yontem", label: "Yöntem", note: "ajan mimarisi nasıl tasarlanır" },
  { href: "/sikca-sorulanlar", label: "SSS", note: "net cevaplar" },
];

/** Alt bilgi bağlantıları — `SiteFooter` bu listeyi sütun sütun basar. */
export const footerLinks: readonly NavItem[] = [
  { href: "/egitim", label: "1:1 Ajan Eğitimi", note: "canlı çalıştay" },
  { href: "/danismanlik", label: "Yazılım Süreci Danışmanlığı", note: "uçtan uca" },
  { href: "/saatlik", label: "Saatlik Kiralama", note: "paketler" },
  { href: "/yontem", label: "Yöntem: 6 katman", note: "mimari kalıplar" },
  { href: "/sikca-sorulanlar", label: "Sıkça sorulanlar", note: "ödeme / iade" },
  { href: "/iletisim", label: "Özel kapsam", note: "kendi konunu getir" },
  { href: "/kosullar", label: "Koşul ve politikalar", note: "fatura, iptal" },
];
