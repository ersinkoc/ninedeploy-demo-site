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
import { notPromises, requireRequestType, sessionFlow } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * 1:1 canlı ajan eğitimi sayfası — T2 "destek-egitim".
 * Müfredat, akış, süre ve ücret dahil tüm veri `@/lib/catalog`'tan;
 * sayfada elle yazılmış fiyat/rakam yok.
 */

const edu = requireRequestType("destek-egitim");

const booking = `${site.bookingPath}?tip=destek-egitim`;
const modules = edu.topics.filter((topic) => !topic.custom);
const customTopic = edu.topics.find((topic) => topic.custom);
const entryPrice = formatPrice(Math.min(...edu.durations.map((entry) => entry.priceEUR)));
const minMinutes = Math.min(...edu.durations.map((entry) => entry.minutes));
const maxMinutes = Math.max(...edu.durations.map((entry) => entry.minutes));

export const metadata: Metadata = {
  title: "1:1 Ajan Eğitimi",
  description:
    "Kendi depon üzerinden 1:1 canlı çalıştay: altı modüllük müfredat, ekran paylaşımıyla kurulum, oturum sonrası karar notu ve 14 gün asenkron destek.",
  alternates: { canonical: "/egitim" },
};

export default function EgitimPage() {
  return (
    <>
      <Section grid>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker index={edu.code}>1:1 CANLI ÇALIŞTAY</Kicker>
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
              Eğitim, slayt değildir. <span className="text-fg-muted">Kodu sen yazarsın.</span>
            </h1>
            <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted">{edu.intro}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={booking}>Çalıştay rezerve et</ActionLink>
              <ActionLink href={`${site.bookingPath}?tip=gorusme`} variant="outline">
                Önce 30 dk görüşelim
              </ActionLink>
            </div>
          </div>

          <Reveal delay={1}>
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-fg-muted">
                Teknik şartname · {edu.code}
              </p>
              <dl>
                <DataRow label="Tür" value={edu.kicker} />
                <DataRow
                  label="Süre"
                  value={edu.durations.map((entry) => formatDuration(entry.minutes)).join(" / ")}
                />
                <DataRow label="Başlangıç" value={entryPrice} tone="accent" />
                <DataRow label="Ön koşul" value="Kendi depon + yazılı iş akışı" />
                <DataRow label="Müfredat" value={`${modules.length} modül + kendi konun`} />
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          id="mufredat"
          index="01"
          kicker="MÜFREDAT"
          title="Kurarak öğrenme sırası"
          lead="Altı modül birbirini besler: önce döngü, sonra sağlayıcı seçimi, sonra araç sözleşmeleri, hafıza, kapılar ve ölçme. Her modülün çıkışı kendi deponuzda çalışan koddur."
        />
        <ul className="mt-12 space-y-4">
          {modules.map((topic, index) => (
            <Reveal as="li" key={topic.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">{topic.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">modül</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{topic.title}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{topic.summary}</p>
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

        {customTopic ? (
          <Reveal delay={2} className="mt-4">
            <Panel className="grid gap-6 border-accent p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
              <div className="space-y-2">
                <p className="font-mono text-sm font-medium text-primary">{customTopic.code}</p>
                <Chip tone="accent">Müfredat dışı</Chip>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{customTopic.title}</h2>
                <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{customTopic.summary}</p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {customTopic.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm leading-snug">
                      <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-accent">
                        +
                      </span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <ActionLink href={booking}>Kendi konunu getir</ActionLink>
                </div>
              </div>
            </Panel>
          </Reveal>
        ) : null}
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="02"
          kicker="OTURUM AKIŞI"
          title="Bir oturum nasıl işler"
          lead="Çalıştay oturumla başlamaz: 48 saat önce gelen formla başlar, oturumdan sonra 14 gün boyunca asenkron destekle sürer."
        />
        <ul className="mt-12 space-y-4">
          {sessionFlow.map((step, index) => (
            <Reveal as="li" key={step.code} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">{step.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">{step.when}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{step.title}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          index="03"
          kicker="SÜRE VE ÜCRET"
          title="Tek oturumluk modüller"
          lead="Her modül tek oturumda kurulur; derinleşmek istediğinizde aynı hafta içinde ikinci oturum alabilirsiniz."
        />
        <div className="mt-10">
          <DimensionRule label={`${formatDuration(minMinutes)} → ${formatDuration(maxMinutes)}`} />
        </div>
        <ul className="mt-4 space-y-3">
          {edu.durations.map((duration) => (
            <li key={duration.minutes}>
              <Panel
                className={cn(
                  "grid gap-4 p-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-8",
                  duration.popular && "border-primary",
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-sm font-medium uppercase tracking-wide text-primary">
                    {formatDuration(duration.minutes)}
                  </p>
                  {duration.popular ? <Chip tone="accent">Popüler</Chip> : null}
                </div>
                <p className="text-sm leading-relaxed text-fg-muted">{duration.note}</p>
                <div className="sm:text-right">
                  <p className="text-2xl font-semibold tracking-tight">{formatPrice(duration.priceEUR)}</p>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex max-w-[62ch] items-start gap-3 text-sm leading-relaxed text-fg-muted">
          <span className="mt-0.5 shrink-0 font-mono text-xs uppercase tracking-wide">Slot</span>
          <span>{edu.slotHint}</span>
        </p>
        <div className="mt-8">
          <ActionLink href={booking}>Çalıştay rezerve et</ActionLink>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="04"
          kicker="KİMİN İÇİN"
          title="Demo ile üretim arası sıkışanlar"
          lead="Bu hattı, ajanı ilk kez kendi kod tabanına gerçekten gömmek isteyen geliştiriciler ve ekipler için tasarladım."
        />
        <ul className="mt-12">
          {edu.bestFor.map((item, index) => (
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
          <ActionLink href={booking}>Çalıştay rezerve et</ActionLink>
          <ActionLink href="/yontem" variant="outline">
            Önce mimariyi oku
          </ActionLink>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="05"
          kicker="ÇERÇEVELER"
          title="Vaat etmediklerimiz"
          lead="Bu sayfadaki her şey ölçülebilir çıkar birimlerine bağlı. Ölçülemeyen iddiaların burada yeri yok."
        />
        <Reveal delay={1}>
          <Panel className="p-6 sm:p-8">
            <ul>
              {notPromises.map((item) => (
                <li key={item} className="flex items-start gap-4 border-b border-border/60 py-5 last:border-b-0">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-sm text-accent">
                    ×
                  </span>
                  <p className="max-w-[62ch] leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Depoyu aç. Birlikte yazalım.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Rezervasyon akışında modülü, süreyi ve slot&apos;u seçiyorsunuz; oturum sonrası akış
            karar notu ve asenkron destekle devam eder.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Çalıştay rezerve et</ActionLink>
            <a
              href={`mailto:${site.email}?subject=1%3A1%20e%C4%9Fitim`}
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
