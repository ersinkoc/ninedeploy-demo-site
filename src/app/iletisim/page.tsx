import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import {
  ActionLink,
  Chip,
  DataRow,
  Kicker,
  Panel,
  Section,
  SectionHeading,
} from "@/components/ui";
import { requireRequestType } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * İletişim sayfası — form YOK (backend yok).
 * İki yol: rezervasyon akışı (gorusme / kendi konun) ve doğrudan e-posta.
 * Kapı kartları ve fiyatlar `@/lib/catalog`'tan türetilir; rakam elle yazılmaz.
 */

const gorusme = requireRequestType("gorusme");
const destekEgitim = requireRequestType("destek-egitim");
const customTopic = destekEgitim.topics.find((topic) => topic.id === "kendi-konu");

const callBooking = `${site.bookingPath}?tip=gorusme`;
const customBooking = `${site.bookingPath}?tip=destek-egitim&konu=kendi-konu`;
const mailto = `mailto:${site.email}?subject=%C3%96zel%20kapsam`;
const shortestCall = formatDuration(Math.min(...gorusme.durations.map((entry) => entry.minutes)));
const entryPrice = formatPrice(Math.min(...gorusme.durations.map((entry) => entry.priceEUR)));

export const metadata: Metadata = {
  title: "İletişim",
  description: `Form yok: ${shortestCall}'lık keşif görüşmesini rezervasyon akışından al ya da doğrudan e-posta yaz. Özel kapsam ve kurumsal teklifler için aynı adres.`,
  alternates: { canonical: "/iletisim" },
};

export default function IletisimPage() {
  return (
    <>
      <Section grid>
        <div className="space-y-6">
          <Kicker>İLETİŞİM</Kicker>
          <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
            İki kapı var, <span className="text-muted">form yok.</span>
          </h1>
          <p className="max-w-[62ch] text-lg leading-relaxed text-muted">
            Bu sayfada form beklemeyin: cevaplayan bir tarafı olmayan formlar yalnızca bekletir.
            Ya rezervasyon akışından geç ya da doğrudan e-posta yaz — ikisi de aynı kişiye çıkar.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <ActionLink href={callBooking}>Keşif görüşmesi rezerve et</ActionLink>
            <ActionLink href={mailto} variant="outline">
              E-posta yaz
            </ActionLink>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="01"
          kicker="REZERVASYON"
          title="Sistemden geçen iki yol"
          lead="Takvim, konu seçimi ve ödeme rezervasyon akışının işi; bu sayfa yalnızca yön gösterir. İki yolun da giriş kapısı aynı akıştır."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          <Reveal as="li" delay={1}>
            <Panel className="flex h-full flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-sm font-medium text-primary">{gorusme.code}</p>
                <Chip tone="neutral">{shortestCall}</Chip>
              </div>
              <h2 className="text-xl font-semibold">{gorusme.label}</h2>
              <p className="max-w-[52ch] leading-relaxed text-muted">{gorusme.intro}</p>
              <dl>
                <DataRow label="Giriş" value={shortestCall} />
                <DataRow label="Başlangıç" value={entryPrice} tone="accent" />
              </dl>
              <div className="mt-auto pt-2">
                <ActionLink href={callBooking}>Görüşme rezerve et</ActionLink>
              </div>
            </Panel>
          </Reveal>
          <Reveal as="li" delay={2}>
            <Panel className="flex h-full flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-sm font-medium text-primary">
                  {customTopic?.code ?? destekEgitim.code}
                </p>
                <Chip tone="accent">konu seçili gelir</Chip>
              </div>
              <h2 className="text-xl font-semibold">
                {customTopic?.title ?? "Kendi konunu getir"}
              </h2>
              <p className="max-w-[52ch] leading-relaxed text-muted">
                {customTopic?.summary ?? destekEgitim.intro}
              </p>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
                Bağlantı konuyu önceden seçili getirir; rezervasyon akışında sadece saat ve ödeme
                kalır.
              </p>
              <div className="mt-auto pt-2">
                <ActionLink href={customBooking} variant="outline">
                  Bu konuyla rezerve et
                </ActionLink>
              </div>
            </Panel>
          </Reveal>
        </ul>
      </Section>

      <Section>
        <SectionHeading
          index="02"
          kicker="DOĞRUDAN"
          title="E-posta: tek kanal, tek adres"
          lead="Özel kapsam, kurumsal toplu kota ya da rezervasyon öncesi tek soru — hepsi aynı adrese. Konu satırına bağlamı yazmak cevabı hızlandırır."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <Reveal>
            <Panel className="h-full p-6 sm:p-8">
              <dl>
                <DataRow label="Adres" value={site.email} />
                <DataRow label="Konu" value="Özel kapsam / teklif" />
                <DataRow label="Saat dilimi" value={site.timeZone} />
                <DataRow label="Para birimi" value={site.currency.toUpperCase()} />
              </dl>
            </Panel>
          </Reveal>
          <Reveal delay={1}>
            <ul className="space-y-3">
              {[
                "Kurum adına toplu kota ve teklif talebi",
                "Rezervasyon öncesi kapsam netleştirme",
                "Fatura bilgisi düzeltmesi",
              ].map((line, index) => (
                <li key={line} className="flex items-start gap-3 text-sm leading-snug">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="mt-8">
          <ActionLink href={mailto} variant="outline">
            E-posta yaz
          </ActionLink>
        </div>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Satış baskısı yok.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Önce durumun anlaşılır, sonra yol. Keşif görüşmesi de e-posta da aynı ölçüde ciddiye
            alınır; uygun olmayan iş, uygun olmayan fiyatla satılmaz.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={callBooking}>Görüşme rezerve et</ActionLink>
            <a
              href={mailto}
              className="inline-flex min-h-11 items-center font-mono text-sm text-fg underline underline-offset-4"
            >
              {site.email}
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
