import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { markPaidBySession, markStatus } from "@/lib/reservations";
import { getStripe, isStripeLive } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Webhook imza anahtarı (panel → uç nokta → "Reveal"). */
function readSigningKey(): string {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  return typeof value === "string" ? value.trim() : "";
}

/**
 * POST /api/webhooks/stripe
 *
 * Yerel: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * Üretim: panelde uç nokta tanımlanır, imza anahtarı ortam değişkenine yazılır.
 *
 * - İmza doğrulanmadan hiçbir kayıt güncellenmez.
 * - Anahtarlar yoksa (demo kurulum) 503 döner; sahte "işlendi" yanıtı verilmez.
 * - İdempotens: aynı olay tekrar gelirse kayıt zaten `paid` olduğundan durum değişmez.
 */
export async function POST(request: Request): Promise<Response> {
  const signingKey = readSigningKey();

  if (!isStripeLive() || signingKey.length === 0) {
    return NextResponse.json(
      {
        received: false,
        error:
          "Webhook devre dışı: Stripe anahtarı ve webhook imza anahtarı tanımlı olmalı. Demo modda ödeme durumu zaten /api/checkout içinde işaretleniyor.",
      },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ received: false, error: "stripe-signature başlığı yok." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, signingKey);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "bilinmeyen";
    return NextResponse.json({ received: false, error: `İmza doğrulanamadı: ${reason}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bySession = await markPaidBySession(session.id);
      if (!bySession) {
        const ref = session.metadata?.reference ?? session.client_reference_id;
        if (ref) await markStatus(ref, "paid", session.id);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ref = session.metadata?.reference ?? session.client_reference_id;
      if (ref) await markStatus(ref, "failed", session.id);
      break;
    }
    default:
      /* Bu sitenin diğer olaylara ihtiyacı yok: 200 dön ve geç. */
      break;
  }

  return NextResponse.json({ received: true, type: event.type });
}
