/**
 * Stripe sunucu tarafı kurulumu.
 * `STRIPE_SECRET_KEY` yoksa site DEMO modda çalışır: akışın tamamı işler, ödeme alınmaz.
 * Yalnızca route handler / server component tarafında import edin.
 */

import Stripe from "stripe";

export function stripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function isStripeLive(): boolean {
  const key = stripeSecretKey();
  return key.length > 0 && (key.startsWith("sk_test_") || key.startsWith("sk_live_"));
}

/** Demo moddayken bile arayüzde gösterilen gerekçe (üretimde kullanıcıya görünmez). */
export function stripeModeLabel(): { live: boolean; label: string } {
  if (isStripeLive()) {
    return {
      live: true,
      label: stripeSecretKey().startsWith("sk_live_")
        ? "Stripe: canlı mod"
        : "Stripe: test anahtarı (sk_test_)",
    };
  }
  return { live: false, label: "Stripe: demo mod (STRIPE_SECRET_KEY tanımsız)" };
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = stripeSecretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY tanımlı değil — checkout demo moda düşmeli.");
  client ??= new Stripe(key);
  return client;
}

export function siteUrl(host: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `http://${host ?? "localhost:3000"}`;
}
