/**
 * Uygunluk üretimi — deterministik, bağımlılıksız, saf.
 *
 * Üretimde burası bir takvim entegrasyonunun (Cal.com / DB) yerini tutmaz:
 * burada kural seti sabit (hafta içi, 09.30–19.00, öğle aralığı, resmî tatil),
 * dolu slotlar `reservations.ts`'ten gelir. Backend'e geçerken tek dosya değişir.
 */

import { site } from "@/lib/site";

/** Türkiye kalıcı olarak UTC+3 — yaz/kış saati uygulaması yok. */
const ISTANBUL_UTC_OFFSET_MINUTES = 180;

export const OPEN_MINUTES = 9 * 60 + 30; // 09:30
export const CLOSE_MINUTES = 19 * 60; // 19:00
export const LUNCH_START = 12 * 60;
export const LUNCH_END = 13 * 60;
export const SLOT_STEP = 30;

/** En az bu kadar önceden rezervasyon gerekir. */
export const MIN_LEAD_MINUTES = 6 * 60;

/** Sabit tarihli resmî tatiller (dini bayramlar modellenmedi — bkz. .design/brief.md). */
const FIXED_HOLIDAYS: ReadonlySet<string> = new Set([
  "01-01",
  "04-23",
  "05-01",
  "05-19",
  "07-15",
  "08-30",
  "10-29",
]);

export type DayPlan = {
  /** YYYY-MM-DD */
  date: string;
  /** Pazartesi…Pazar, Türkçe. */
  weekday: string;
  closed: boolean;
  reason?: string;
  /** "09:30" biçiminde açılış saatleri. */
  openTimes: string[];
};

/** ISO "YYYY-MM-DD" → gün başlangıcı (UTC gün ortası, saat dilimi kaymasını önler). */
export function dayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** UTC + 3'e göre "şimdi" — sunucu saati ne olursa olsun İstanbul'da hesaplarız. */
export function istanbulNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + ISTANBUL_UTC_OFFSET_MINUTES * 60_000);
}

/** O anın İstanbul dakika sayısı (0–1439). */
export function istanbulMinutes(now: Date = new Date()): number {
  const shifted = istanbulNow(now);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

function addDays(date: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return dayKey(base);
}

const weekdayFmt = new Intl.DateTimeFormat(site.locale, { weekday: "long", timeZone: site.timeZone });

export function trWeekdayFull(date: string): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return weekdayFmt.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function isHoliday(date: string): boolean {
  return FIXED_HOLIDAYS.has(date.slice(5));
}

/** Bir günün ham açılış saatleri — oturum süresine göre sıkıştırılır. */
export function timesForDay(durationMinutes: number): string[] {
  const out: string[] = [];
  for (let m = OPEN_MINUTES; m + durationMinutes <= CLOSE_MINUTES; m += SLOT_STEP) {
    const end = m + durationMinutes;
    const overlapsLunch = m < LUNCH_END && end > LUNCH_START;
    if (overlapsLunch) continue;
    const h = `${Math.floor(m / 60)}`.padStart(2, "0");
    const mm = `${m % 60}`.padStart(2, "0");
    out.push(`${h}:${mm}`);
  }
  return out;
}

/**
 * `days` günlük plan üretir. `takenByDay` dolu saatleri taşır (booking hold + onaylı).
 * Bugünün geçmiş saatleri ve ön koşul süresi (6 saat) otomatik elenir.
 */
export function buildAvailability(input: {
  today?: string;
  nowMinutes?: number;
  days: number;
  durationMinutes: number;
  takenByDay?: Readonly<Record<string, ReadonlySet<string>>>;
}): DayPlan[] {
  const today = input.today ?? dayKey(istanbulNow());
  const nowMinutes = input.nowMinutes ?? istanbulMinutes();
  const horizon = Math.min(Math.max(input.days, 1), 45);

  const plans: DayPlan[] = [];
  for (let i = 0; i < horizon; i += 1) {
    const date = addDays(today, i);
    const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const taken = input.takenByDay?.[date];

    if (dow === 0 || dow === 6) {
      plans.push({ date, weekday: trWeekdayFull(date), closed: true, reason: "Hafta sonu kapalı", openTimes: [] });
      continue;
    }
    if (isHoliday(date)) {
      plans.push({ date, weekday: trWeekdayFull(date), closed: true, reason: "Resmî tatil", openTimes: [] });
      continue;
    }

    let open = timesForDay(input.durationMinutes);
    if (i === 0) {
      // Bugün: lead time'dan önceki saatler kalkar.
      const floor = nowMinutes + MIN_LEAD_MINUTES;
      open = open.filter((time) => {
        const [h = 0, mm = 0] = time.split(":").map(Number);
        return h * 60 + mm >= floor;
      });
    }
    if (taken?.size) {
      open = open.filter((time) => !taken.has(time));
    }

    plans.push({
      date,
      weekday: trWeekdayFull(date),
      closed: false,
      reason: open.length === 0 ? "Bu gün için uygun slot kalmadı" : undefined,
      openTimes: open,
    });
  }
  return plans;
}

/** Slot'un tam ISO zaman damgası (Stripe metadata + e-posta özeti için). */
export function slotToISO(date: string, time: string): string {
  const [h = "00", mm = "00"] = time.split(":");
  return `${date}T${h}:${mm}:00+03:00`;
}

/** Slot bittiği dakika — "14:30–15:30" etiketi için. */
export function slotLabel(time: string, durationMinutes: number): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const end = h * 60 + m + durationMinutes;
  const eh = `${Math.floor(end / 60)}`.padStart(2, "0");
  const em = `${end % 60}`.padStart(2, "0");
  return `${time.replace(":", ".")}–${eh}.${em}`;
}
