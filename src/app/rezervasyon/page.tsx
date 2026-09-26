import type { Metadata } from "next";

import { BookingWizard } from "@/components/booking-wizard";
import { Chip, Kicker, Section } from "@/components/ui";
import { requestTypeById } from "@/lib/catalog";
import { site } from "@/lib/site";
import { stripeModeLabel } from "@/lib/stripe";

type SearchParams = Record<string, string | string[] | undefined>;

const pick = (value: SearchParams[string]): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const metadata: Metadata = {
  title: "Rezervasyon",
  description:
    "Talep türünü, konuyu, süreyi ve saati seçin; ödeme Stripe üzerinden tek adımda tamamlanır.",
  alternates: { canonical: "/rezervasyon" },
  robots: { index: false, follow: true },
};

export default function RezervasyonSayfa({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  return <WizardLoader searchParamsPromise={searchParams} />;
}

async function WizardLoader({
  searchParamsPromise,
}: {
  readonly searchParamsPromise: Promise<SearchParams>;
}) {
  const params = await searchParamsPromise;
  const tip = pick(params.tip) ?? pick(params.type);
  const konu = pick(params.konu) ?? pick(params.topic);
  /* Kurucudan taşınan mimari özeti: not alanının varsayılan metni olur. */
  const not = pick(params.not);
  const sureRaw = pick(params.sure) ?? pick(params.minutes);
  const sure = sureRaw ? Number.parseInt(sureRaw, 10) : undefined;
  const requestType = tip ? requestTypeById(tip) : undefined;
  const minutes = requestType?.durations.find((entry) => entry.minutes === sure)?.minutes;
  const mode = stripeModeLabel();

  return (
    <>
      <Section grid className="pb-6 sm:pb-8">
        <div className="max-w-[68ch] space-y-4">
          <Kicker index="AA-R">ŞARTNAME · REZERVASYON</Kicker>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Dört adım: tür, konu, saat, ödeme.
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            Slot&apos;lar {site.timeZone} saatine göre üretilir. Ödeme Stripe&apos;ın kendi
            sayfasında alınır; kart bilgisi bu sunucuya gelmez. 24 saat öncesine kadar ücretsiz
            iptal.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip tone={mode.live ? "success" : "accent"}>{mode.live ? "Stripe bağlı" : "Demo mod"}</Chip>
            <Chip tone="neutral">24 saat önce ücretsiz iptal</Chip>
            <Chip tone="neutral">Kurumsal fatura</Chip>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <BookingWizard
          initialType={requestType?.id}
          initialTopic={konu}
          initialMinutes={minutes}
          composerNote={not}
          cancelled={pick(params.durum) === "iptal"}
        />
      </Section>
    </>
  );
}
