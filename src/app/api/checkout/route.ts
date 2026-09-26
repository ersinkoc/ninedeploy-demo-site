import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { topicById } from "@/lib/catalog";
import { priceOf, slotIsPlausible, validateBooking, type BookingDraft } from "@/lib/booking";
import { toCents } from "@/lib/format";
import { holdSlot, markStatus, takenSlotsByDay } from "@/lib/reservations";
import { buildAvailability, slotToISO, trWeekdayFull } from "@/lib/slots";
import { getStripe, isStripeLive, siteUrl } from "@/lib/stripe";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const MAX_BODY = 8_192;

function readDraft(raw: unknown): BookingDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
  return {
    requestType: text(body.requestType),
    topicId: text(body.topicId),
    minutes: Number(body.minutes),
    date: text(body.date),
    time: text(body.time),
    name: text(body.name),
    email: text(body.email),
    company: text(body.company),
    notes: text(body.notes),
  };
}

/**
 * POST /api/checkout
 * Fiyatı her zaman katalogdan hesaplar (istemci fiyatı yok sayılır), slot'u tutar,
 * ardından Stripe Checkout oluşturur. Anahtar yoksa DEMO mod: ödeme alınmaz.
 */
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: "İstek gövdesi çok büyük." }, { status: 413 });
  }

  let draft: BookingDraft | null = null;
  try {
    draft = readDraft(JSON.parse(raw) as unknown);
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  if (!draft) return NextResponse.json({ error: "Beklenmeyen istek biçimi." }, { status: 400 });

  const errors = validateBooking(draft);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Formda eksik veya hatalı alanlar var.", fields: errors }, { status: 422 });
  }

  const priced = priceOf(draft);
  if ("error" in priced) {
    return NextResponse.json({ error: priced.error }, { status: 422 });
  }
  const { type, topicId, minutes, amountEUR } = priced;
  const topic = topicById(type, topicId);
  if (!topic) return NextResponse.json({ error: "Konu bulunamadı." }, { status: 422 });

  const slotError = slotIsPlausible(draft.date, draft.time, minutes);
  if (slotError) return NextResponse.json({ error: slotError }, { status: 422 });

  // Slot gerçekten açık mı? (kataloğa ek: doluysa 409)
  const plans = buildAvailability({ days: 30, durationMinutes: minutes });
  const plan = plans.find((entry) => entry.date === draft?.date);
  if (!plan || plan.closed) {
    return NextResponse.json({ error: "Seçtiğiniz gün kapalı." }, { status: 409 });
  }
  const taken = await takenSlotsByDay([draft.date]);
  if ((taken[draft.date] ?? new Set<string>()).has(draft.time)) {
    return NextResponse.json({ error: "Bu slot az önce doldu, lütfen başka bir saat seçin." }, { status: 409 });
  }

  const demo = !isStripeLive();
  const reservation = await holdSlot({
    date: draft.date,
    time: draft.time,
    durationMinutes: minutes,
    requestType: type.id,
    topicId: topic.id,
    topicTitle: topic.title,
    amountEUR,
    customer: {
      name: draft.name,
      email: draft.email,
      ...(draft.company ? { company: draft.company } : {}),
      ...(draft.notes ? { notes: draft.notes } : {}),
    },
    demo,
  });
  if (!reservation) {
    return NextResponse.json({ error: "Slot rezerve edilemedi, birazdan tekrar deneyin." }, { status: 409 });
  }

  const base = siteUrl(request.headers.get("host"));
  const summaryLine = `${type.label} · ${topic.title} · ${minutes} dk · ${trWeekdayFull(draft.date)} ${draft.time}`;

  if (demo) {
    // Demo modunda ödeme akışı burada biter: onay sayfası durumu gösterir.
    await markStatus(reservation.ref, "paid");
    return NextResponse.json({
      mode: "demo",
      ref: reservation.ref,
      redirect: `${base}/tesekkur?ref=${encodeURIComponent(reservation.ref)}`,
    });
  }

  const stripe = getStripe();
  const slotISO = slotToISO(draft.date, draft.time);

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: site.currency,
      unit_amount: toCents(amountEUR),
      product_data: {
        name: `${topic.title} — ${type.label}`,
        description: `${minutes} dakikalık canlı oturum (${site.timeZone}). Konu kodu: ${topic.code}.`,
      },
    },
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [lineItem],
    customer_email: draft.email,
    client_reference_id: reservation.ref,
    metadata: {
      reference: reservation.ref,
      request_type: type.id,
      topic_id: topic.id,
      topic_code: topic.code,
      minutes: String(minutes),
      slot: slotISO,
      slot_label: summaryLine,
    },
    payment_intent_data: {
      metadata: { reference: reservation.ref, request_type: type.id, topic_id: topic.id, slot: slotISO },
    },
    success_url: `${base}/tesekkur?ref=${encodeURIComponent(reservation.ref)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/rezervasyon?tip=${type.id}&konu=${topic.id}&durum=iptal`,
  });

  await markStatus(reservation.ref, "hold", session.id);

  return NextResponse.json({ mode: "stripe", ref: reservation.ref, url: session.url });
}
