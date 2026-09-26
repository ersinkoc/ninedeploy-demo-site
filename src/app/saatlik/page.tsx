import type { Metadata } from "next";

import { Reveal } from "@/components/reveal";
import {
  ActionLink,
  Chip,
  DataRow,
  DimensionRule,
  Kicker,
  Panel,
  Section,
  SectionHeading,
} from "@/components/ui";
import { rentTerms, requireRequestType } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Saatlik kiralama sayfası — T3 "yanında bir kıdemli".
 * Saat başı düşen fiyat katalogdan türetilir; ayrı bir tablo tutulmaz.
 */

const rent = requireRequestType("kiralama");

const booking = `${site.bookingPath}?tip=kiralama`;
const singleHour = rent.durations.find((entry) => entry.minutes === 60);
const hourlyLabel = singleHour ? `${formatPrice(singleHour.priceEUR)} / saat` : "—";
const minMinutes = Math.min(...rent.durations.map((entry) => entry.minutes));
const maxMinutes = Math.max(...rent.durations.map((entry) => entry.minutes));

/** 120 dk ve üzeri kotalarda saat başına düşen fiyat. */
function perHour(minutes: number, priceEUR: number): string | null {
  if (minutes < 120) return null;
  return `≈ ${formatPrice(Math.round(priceEUR / (minutes / 60)))} / saat`;
}

export const metadata: Metadata = {
  title: "Saatlik kiralama",
  description:
    "Proje bazlı değil, saat bazlı: kotanı al, takıldığın hafta kullan. Tıkanma çözümü, kod incelemesi, ekip çalıştayı ve üretime alma gözlemi.",
  alternates: { canonical: "/saatlik" },
};

export default function SaatlikPage() {
  return (
    <>
      <Section grid>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker index={rent.code}>SAATLİK KİRALAMA</Kicker>
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
              Yanında bir kıdemli. <span className="text-muted">Saat bazlı.</span>
            </h1>
            <p className="max-w-[62ch] text-lg leading-relaxed text-muted">{rent.intro}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={booking}>Kota rezerve et</ActionLink>
              <ActionLink href={`${site.bookingPath}?tip=gorusme`} variant="outline">
                Önce 30 dk görüşelim
              </ActionLink>
            </div>
          </div>

          <Reveal delay={1}>
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-muted">
                Teknik şartname · {rent.code}
              </p>
              <dl>
                <DataRow label="Tür" value={rent.label} />
                <DataRow label="Saat" value={hourlyLabel} tone="accent" />
                <DataRow label="Yanıt" value="İş gününde 4 saat" />
                <DataRow label="Asgari" value="60 dakikalık slot" />
                <DataRow label="Devir" value="Kullanılmayan saat bir sonraki aya" />
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="01"
          kicker="KULLANIM"
          title="Kotanı neye harcarsın?"
          lead="Kota bölünerek kullanılır; her parça ayrı bir slot alır. Aşağıdaki dört kullanım biçimi bu sitede satın alınabilir hâlde tanımlıdır."
        />
        <ul className="mt-12 space-y-4">
          {rent.topics.map((topic, index) => (
            <Reveal as="li" key={topic.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">{topic.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-muted">kullanım</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{topic.title}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-muted">{topic.summary}</p>
                  <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                    {topic.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2 text-sm leading-snug">
                        <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-primary">
                          +
                        </span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="02"
          kicker="KOTALAR"
          title="Kota paketleri"
          lead="Tek saatle başlar, aya yayılan kotayla devam edersiniz. Saat başı maliyet kota büyüdükçe düşer."
        />
        <div className="mt-10">
          <DimensionRule label={`${formatDuration(minMinutes)} → ${formatDuration(maxMinutes)}`} />
        </div>
        <ul className="mt-4 space-y-3">
          {rent.durations.map((duration) => {
            const per = perHour(duration.minutes, duration.priceEUR);
            return (
              <li key={duration.minutes}>
                <Panel
                  className={cn(
                    "grid gap-4 p-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-8",
                    duration.popular && "border-primary",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-sm font-medium uppercase tracking-wide text-primary">
                      {duration.label ?? formatDuration(duration.minutes)}
                    </p>
                    {duration.popular ? <Chip tone="accent">Popüler</Chip> : null}
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{duration.note}</p>
                  <div className="sm:text-right">
                    <p className="text-2xl font-semibold tracking-tight">{formatPrice(duration.priceEUR)}</p>
                    {per ? <p className="mt-1 font-mono text-xs text-muted">{per}</p> : null}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 flex max-w-[62ch] items-start gap-3 text-sm leading-relaxed text-muted">
          <span className="mt-0.5 shrink-0 font-mono text-xs uppercase tracking-wide">Slot</span>
          <span>{rent.slotHint}</span>
        </p>
        <div className="mt-8">
          <ActionLink href={booking}>Kota rezerve et</ActionLink>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="03"
          kicker="ŞARTLAR"
          title="Kira şartları — sürpriz madde yok"
          lead="Sözleşme değil, tek tablo: ne alıyorsunuz, ne kapsam dışı. Kota almadan önce okuyun."
        />
        <Reveal delay={1}>
          <Panel className="p-6 sm:p-8">
            <dl>
              {rentTerms.map((term) => (
                <DataRow key={term.label} label={term.label} value={term.value} />
              ))}
            </dl>
          </Panel>
        </Reveal>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="04"
          kicker="KİMİN İÇİN"
          title="Kıdemli yok ama standart lazım"
          lead="Sürekli ama tam zamanlı olmayan teknik ihtiyaç: kotanız kadar kıdemli, kalan zamanda maliyet sıfır."
        />
        <ul className="mt-12">
          {rent.bestFor.map((item, index) => (
            <li
              key={item}
              className="flex items-start gap-4 border-b border-border/60 py-5 last:border-b-0 sm:gap-6"
            >
              <span className="mt-1 shrink-0 font-mono text-sm text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="max-w-[62ch] leading-relaxed">{item}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionLink href={booking}>Kota rezerve et</ActionLink>
          <ActionLink href="/egitim" variant="outline">
            1:1 eğitime bak
          </ActionLink>
        </div>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Kotanı al. Takıldığında kullan.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Rezervasyon akışında paketi ve slot'u seçiyorsunuz; kalan kota bir sonraki aya devreder.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Kota rezerve et</ActionLink>
            <a
              href={`mailto:${site.email}?subject=Saatlik%20kiralama`}
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
