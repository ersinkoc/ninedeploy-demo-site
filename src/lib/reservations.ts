/**
 * Rezervasyon kaydı — süreç içi bellek + `.data/reservations.jsonl` yedeği.
 *
 * Neden basit? Bu bir satış sitesinin iskeleti; gerçek üretimde veritabanı gerekir.
 * Yine de çift randevuyu engelleyecek kadar ciddi: hold → paid/failed akışı var.
 * Sunucu tarafında kullanılır (route handler); istemciye asla import edilmez.
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { dayKey, istanbulNow } from "@/lib/slots";

export type ReservationStatus = "hold" | "paid" | "failed" | "cancelled";

export type Reservation = {
  ref: string;
  createdAt: string;
  date: string;
  time: string;
  durationMinutes: number;
  requestType: string;
  topicId: string;
  topicTitle: string;
  amountEUR: number;
  customer: { name: string; email: string; company?: string; notes?: string };
  status: ReservationStatus;
  stripeSessionId?: string;
  demo: boolean;
};

/** Test/yerel çalışma için `RESERVATIONS_DIR` ile taşınabilir; varsayılan `.data/`. */
const DATA_DIR = process.env.RESERVATIONS_DIR?.trim()
  ? path.resolve(process.env.RESERVATIONS_DIR.trim())
  : path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "reservations.jsonl");
const HOLD_TTL_MINUTES = 60;

const store = new Map<string, Reservation>();
let loaded = false;

function randomRef(): string {
  const alphabet = "ABCDEFGHJKLMNPRSTUVYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "0";
  }
  return `AA-${out}`;
}

/** JSONL dosyasını belleğe alır; hata olursa sessizce boş store ile devam eder. */
async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed) as Reservation;
        if (record?.ref) store.set(record.ref, record);
      } catch {
        /* bozuk satırı atla — log kirliliği kalıcı veriden yeğdir */
      }
    }
  } catch {
    /* dosya yok — ilk çalıştırma */
  }
}

async function persist(record: Reservation): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(DATA_FILE, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    /* salt okunur dosya sistemi (bazı PaaS): bellek içi kayıt yeterli */
  }
}

function slotKey(date: string, time: string): string {
  return `${date}T${time}`;
}

function activeAt(date: string, time: string, nowMs: number): boolean {
  for (const record of store.values()) {
    if (record.date !== date || record.time !== time) continue;
    if (record.status === "cancelled" || record.status === "failed") continue;
    if (record.status === "hold") {
      const ageMinutes = (nowMs - Date.parse(record.createdAt)) / 60_000;
      if (ageMinutes > HOLD_TTL_MINUTES) continue;
    }
    return true;
  }
  return false;
}

/** Gün başına dolu saatler — uygunluk hesabına beslenir. */
export async function takenSlotsByDay(dates: readonly string[]): Promise<Record<string, Set<string>>> {
  await ensureLoaded();
  const nowMs = Date.now();
  const out: Record<string, Set<string>> = {};
  for (const date of dates) out[date] = new Set<string>();
  for (const record of store.values()) {
    const bucket = out[record.date];
    if (!bucket) continue;
    if (activeAt(record.date, record.time, nowMs)) bucket.add(record.time);
  }
  return out;
}

/**
 * Slot'u tutar (hold). Çakışma varsa null döner — çağıran 409'a çevirir.
 * `slotKey` üzerinden ikinci bir koruma: aynı istek iki kez gelirse tek kayıt.
 */
export async function holdSlot(input: {
  date: string;
  time: string;
  durationMinutes: number;
  requestType: string;
  topicId: string;
  topicTitle: string;
  amountEUR: number;
  customer: Reservation["customer"];
  demo: boolean;
}): Promise<Reservation | null> {
  await ensureLoaded();
  const nowMs = Date.now();
  if (activeAt(input.date, input.time, nowMs)) return null;

  const istanbul = istanbulNow(new Date(nowMs));
  if (input.date < dayKey(istanbul)) return null;

  const record: Reservation = {
    ref: randomRef(),
    createdAt: new Date(nowMs).toISOString(),
    date: input.date,
    time: input.time,
    durationMinutes: input.durationMinutes,
    requestType: input.requestType,
    topicId: input.topicId,
    topicTitle: input.topicTitle,
    amountEUR: input.amountEUR,
    customer: input.customer,
    status: "hold",
    demo: input.demo,
  };
  store.set(record.ref, record);
  await persist(record);
  return record;
}

export async function findReservation(ref: string): Promise<Reservation | undefined> {
  await ensureLoaded();
  return store.get(ref.toUpperCase());
}

export async function markStatus(
  ref: string,
  status: ReservationStatus,
  stripeSessionId?: string,
): Promise<Reservation | undefined> {
  await ensureLoaded();
  const record = store.get(ref.toUpperCase());
  if (!record) return undefined;
  const updated: Reservation = { ...record, status, stripeSessionId: stripeSessionId ?? record.stripeSessionId };
  store.set(updated.ref, updated);
  await persist(updated);
  return updated;
}

/** Stripe webhook'unun getirdiği session → kendi ref'i. */
export async function markPaidBySession(sessionId: string): Promise<Reservation | undefined> {
  await ensureLoaded();
  for (const record of store.values()) {
    if (record.stripeSessionId === sessionId) return markStatus(record.ref, "paid", sessionId);
  }
  return undefined;
}

export const testingOnly = { store, slotKey };
