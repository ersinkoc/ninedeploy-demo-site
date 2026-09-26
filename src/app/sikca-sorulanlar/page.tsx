import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import {
  ActionLink,
  DataRow,
  Kicker,
  Panel,
  Section,
  SectionHeading,
} from "@/components/ui";
import { faq, requireRequestType } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * SSS sayfası — `<details>/<summary>` ile JavaScript'siz açılır liste.
 * Tüm soru/cevap metni `@/lib/catalog`'taki `faq` dizisinden gelir; sayfada elle yazılmış rakam yok.
 */

const gorusme = requireRequestType("gorusme");
const shortestCall = formatDuration(Math.min(...gorusme.durations.map((entry) => entry.minutes)));
const entryPrice = formatPrice(Math.min(...gorusme.durations.map((entry) => entry.priceEUR)));
const booking = `${site.bookingPath}?tip=gorusme`;

export const metadata: Metadata = {
  title: "Sıkça sorulan sorular",
  description: `Ödeme, iptal, katılım, dil ve teknoloji seçimlerine dair net cevaplar. Cevabı burada olmayan soruyu ${shortestCall}'lık keşif görüşmesine getir.`,
  alternates: { canonical: "/sikca-sorulanlar" },
};

export default function SikcaSorulanlarPage() {
  return (
    <>
      <Section grid>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker index="SSS">NET CEVAPLAR</Kicker>
            <h1 className="max-w-[18ch] text-5xl font-semibold leading-tight tracking-tight">
              Kısa sorular, <span className="text-muted">net cevaplar.</span>
            </h1>
            <p className="max-w-[62ch] text-lg leading-relaxed text-muted">
              Ödemeden iptale, çalışma dilinden teknoloji seçimine kadar en çok sorulan maddeler —
              hepsi bu sayfada. Liste JavaScript kapalıyken de açılır; hiçbir cevap
              &ldquo;bize ulaşın&rdquo; ile bitmiyor.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={booking}>Keşif görüşmesi rezerve et</ActionLink>
              <ActionLink href="/kosullar" variant="outline">
                Koşulları oku
              </ActionLink>
            </div>
          </div>

          <Reveal delay={1}>
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-muted">
                Dizin · SSS
              </p>
              <dl>
                <DataRow label="Kayıt" value={`${faq.length} madde`} />
                <DataRow label="Giriş" value={shortestCall} />
                <DataRow label="Başlangıç" value={entryPrice} tone="accent" />
                <DataRow label="Açılış" value="JS gerektirmez" />
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="01"
          kicker="LİSTE"
          title="En çok sorulanlar, olduğu gibi"
          lead="Bir satıra dokun; cevap aynı satırın altında açılır. Ayrıntıya inmek gerekiyorsa o iş keşif görüşmesinin."
        />
        <ul className="mt-12 space-y-3">
          {faq.map((item, index) => (
            <Reveal as="li" key={item.q} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <details
                open={index === 0}
                className="group rounded-lg border border-border bg-bg transition-colors duration-(--duration-fast) focus-within:border-primary"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-4 text-base font-semibold sm:gap-6 sm:px-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 font-mono text-sm text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 leading-snug">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-mono text-lg leading-none text-muted transition-transform duration-(--duration-fast) group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] border-t border-border/60 px-4 py-5 text-base leading-relaxed text-muted sm:px-6">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Cevabı burada yok mu?
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Keşif görüşmesi {shortestCall} sürer ve satış konuşması değildir: durumunu dinleriz,
            uygun yolu birlikte seçeriz. Uygun bir hizmet değilse &ldquo;hayır&rdquo; cevabı da bu
            görüşmede gelir. Giriş fiyatı {entryPrice}.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Görüşme rezerve et</ActionLink>
            <a
              href={`mailto:${site.email}?subject=SSS`}
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
