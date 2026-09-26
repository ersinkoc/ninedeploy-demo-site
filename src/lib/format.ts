/**
 * Biçimlendirme yardımcıları — hepsi saf, sunucu ve istemcide kullanılabilir.
 */

import { site } from "@/lib/site";

const tl = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** 4500 → "₺4.500" */
export function formatPrice(amountEUR: number): string {
  return tl.format(amountEUR);
}

/** Kuruş: Stripe `unit_amount` tam sayı ister (₺1 = 100 kuruş). */
export function toCents(amountEUR: number): number {
  return Math.round(amountEUR * 100);
}

const weekday = new Intl.DateTimeFormat(site.locale, {
  weekday: "long",
  timeZone: site.timeZone,
});
const shortDay = new Intl.DateTimeFormat(site.locale, {
  day: "2-digit",
  timeZone: site.timeZone,
});
const monthDay = new Intl.DateTimeFormat(site.locale, {
  month: "long",
  day: "numeric",
  timeZone: site.timeZone,
});

/** "2026-09-30" → "Çarşamba" */
export function trWeekday(dateISO: string): string {
  return weekday.format(new Date(`${dateISO}T12:00:00Z`));
}

/** "2026-09-30" → "30" */
export function trDayNumber(dateISO: string): string {
  return shortDay.format(new Date(`${dateISO}T12:00:00Z`));
}

/** "2026-09-30" → "30 Eylül" */
export function trMonthDay(dateISO: string): string {
  return monthDay.format(new Date(`${dateISO}T12:00:00Z`));
}

/** "2026-09-30T14:30:00+03:00" → "30 Eylül 2026, 14:30" (her zaman TR saatiyle) */
export function trDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(site.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: site.timeZone,
  }).format(date);
}

/** 90 → "1 sa 30 dk", 60 → "1 saat", 45 → "45 dk" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk`;
  if (rest === 0) return hours === 1 ? "1 saat" : `${hours} saat`;
  return `${hours} sa ${rest} dk`;
}

/** "14:30" → "14.30" — Türkçe okuma, mono etiket için. */
export function clockLabel(hhmm: string): string {
  return hhmm.replace(":", ".");
}

export function plural(n: number, one: string, many?: string): string {
  return n === 1 ? one : (many ?? `${one}lar`);
}
