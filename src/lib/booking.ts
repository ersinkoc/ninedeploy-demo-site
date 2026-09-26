/**
 * Rezervasyon kuralları — istemci ve sunucu ORTAK doğrulaması.
 * Sunucu fiyatı her zaman buradan hesaplar; istemciden gelen fiyatı asla kabul etmez.
 */

import { requestTypeById, topicById, type RequestType } from "@/lib/catalog";
import { dayKey, istanbulNow, slotToISO, timesForDay } from "@/lib/slots";

export const MIN_NAME = 2;
export const MAX_NAME = 80;
export const MAX_NOTES = 800;
export const MAX_COMPANY = 120;

export type BookingDraft = {
  requestType: string;
  topicId: string;
  minutes: number;
  date: string;
  time: string;
  name: string;
  email: string;
  company: string;
  notes: string;
};

export type FieldErrors = Partial<Record<keyof BookingDraft | "form", string>>;

export const emptyDraft: BookingDraft = {
  requestType: "",
  topicId: "",
  minutes: 0,
  date: "",
  time: "",
  name: "",
  email: "",
  company: "",
  notes: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function resolveTopic(type: RequestType, topicId: string) {
  return topicById(type, topicId);
}

/** Kataloğu doğrular ve fiyatı döner; geçersizse hata mesajı. */
export function priceOf(input: {
  requestType: string;
  topicId: string;
  minutes: number;
}): { type: RequestType; topicId: string; minutes: number; amountEUR: number } | { error: string } {
  const type = requestTypeById(input.requestType);
  if (!type) return { error: "Talep türü tanınmadı." };
  const topic = topicById(type, input.topicId);
  if (!topic) return { error: "Konu bu talep türünde bulunamadı." };
  const duration = type.durations.find((entry) => entry.minutes === input.minutes);
  if (!duration) return { error: "Seçilen süre bu talep türünde yok." };
  return { type, topicId: topic.id, minutes: duration.minutes, amountEUR: duration.priceEUR };
}

/** Slot kataloğa ve iş kurallarına uygun mu? (uygunluk verisiyle çakışma sunucuda ayrıca kontrol edilir) */
export function slotIsPlausible(date: string, time: string, minutes: number): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Tarih biçimi geçersiz.";
  if (!/^\d{2}:\d{2}$/.test(time)) return "Saat biçimi geçersiz.";
  if (date < dayKey(istanbulNow())) return "Geçmiş bir tarih seçilemez.";
  if (!timesForDay(minutes).includes(time)) return "Bu saat, seçilen süre için uygun değil.";
  return undefined;
}

/** Adım 1–3'ü doğrular (form adım ilerlemesi için). */
export function validateSelection(draft: BookingDraft): FieldErrors {
  const errors: FieldErrors = {};
  const priced = priceOf(draft);

  if ("error" in priced) {
    errors.requestType = priced.error;
  } else if (!draft.date) {
    errors.date = "Bir gün seçin.";
  } else if (!draft.time) {
    errors.time = "Bir saat seçin.";
  } else {
    const slotError = slotIsPlausible(draft.date, draft.time, priced.minutes);
    if (slotError) errors.time = slotError;
  }

  return errors;
}

/** Son gönderim doğrulaması — iletişim bilgileri dahil. */
export function validateBooking(draft: BookingDraft): FieldErrors {
  const errors = validateSelection(draft);
  const name = draft.name.trim();
  const email = draft.email.trim();

  if (name.length < MIN_NAME) errors.name = `Adınızı yazın (en az ${MIN_NAME} karakter).`;
  else if (name.length > MAX_NAME) errors.name = `Ad çok uzun (en fazla ${MAX_NAME} karakter).`;

  if (!EMAIL.test(email)) errors.email = "Geçerli bir e-posta adresi yazın.";
  if (draft.company.trim().length > MAX_COMPANY) errors.company = "Şirket adı çok uzun.";
  if (draft.notes.trim().length > MAX_NOTES) errors.notes = `Not en fazla ${MAX_NOTES} karakter olabilir.`;

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Stripe metadata'sa yazılan, insan okunur slot bilgisi. */
export function slotISO(draft: BookingDraft): string {
  return slotToISO(draft.date, draft.time);
}
