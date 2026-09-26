import { NextResponse } from "next/server";

import { requestTypeById } from "@/lib/catalog";
import { takenSlotsByDay } from "@/lib/reservations";
import { buildAvailability } from "@/lib/slots";

export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 14;
const MAX_DAYS = 30;

/**
 * GET /api/availability?tip=<requestType>&sure=<dakika>&gun=<gün>
 * Katalogdaki geçerli bir süre için İstanbul saatine göre uygunluk üretir;
 * tutulmuş/onaylanmış slotlar düşülür. Süre kataloğa aykırıysa 400.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const type = url.searchParams.get("tip") ?? url.searchParams.get("type") ?? "";
  const minutesRaw = Number(url.searchParams.get("sure") ?? url.searchParams.get("minutes") ?? "");
  const daysRaw = Number(url.searchParams.get("gun") ?? url.searchParams.get("days") ?? DEFAULT_DAYS);

  const requestType = requestTypeById(type);
  if (!requestType) {
    return NextResponse.json({ error: "Bilinmeyen talep türü." }, { status: 400 });
  }
  if (!Number.isInteger(minutesRaw) || !requestType.durations.some((entry) => entry.minutes === minutesRaw)) {
    return NextResponse.json({ error: "Bu talep türü için geçerli bir süre değil." }, { status: 400 });
  }

  const days = Number.isInteger(daysRaw) ? Math.min(Math.max(daysRaw, 1), MAX_DAYS) : DEFAULT_DAYS;
  const skeleton = buildAvailability({ days, durationMinutes: minutesRaw });
  const taken = await takenSlotsByDay(skeleton.map((plan) => plan.date));

  /* Dolu saatler düşüldükten sonra boş kalan günün gerekçesi yeniden yazılır. */
  const plans = skeleton.map((plan) => {
    if (plan.closed) return { ...plan, taken: [] as string[] };
    const takenTimes = taken[plan.date] ?? new Set<string>();
    const openTimes = plan.openTimes.filter((time) => !takenTimes.has(time));
    return {
      ...plan,
      openTimes,
      reason: openTimes.length === 0 ? "Bu gün için uygun slot kalmadı" : plan.reason,
      taken: Array.from(takenTimes),
    };
  });

  return NextResponse.json({ tip: type, sure: minutesRaw, days: plans });
}
