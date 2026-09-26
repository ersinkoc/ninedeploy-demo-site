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
import { consultingTracks, requireRequestType } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Danışmanlık sayfası — T4 "bırak profesyoneller yapsın".
 * Tüm veri `@/lib/catalog`'tan; sayfada elle yazılmış fiyat yok.
 */

const consulting = requireRequestType("danismanlik");

const booking = `${site.bookingPath}?tip=danismanlik`;
const entryPrice = formatPrice(Math.min(...consulting.durations.map((entry) => entry.priceEUR)));
const firstTrackDays = consultingTracks[0]?.days ?? "—";
const lastTrackDays = consultingTracks[consultingTracks.length - 1]?.days ?? "—";

export const metadata: Metadata = {
  title: "Yazılım süreci danışmanlığı",
  description:
    "Ekibiniz kurmak istemiyorsa: süreci denetler, ajan sistemini sizin deponuzda kurar, çalışır halde ve size öğreterek teslim ederiz. Giriş noktası: kapsam atölyesi.",
  alternates: { canonical: "/danismanlik" },
};

export default function DanismanlikPage() {
  return (
    <>
      <Section grid>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker index={consulting.code}>DANIŞMANLIK</Kicker>
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
              Bırak profesyoneller yapsın. <span className="text-muted">Sistem sizde kalır.</span>
            </h1>
            <p className="max-w-[62ch] text-lg leading-relaxed text-muted">{consulting.intro}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={booking}>Kapsam atölyesi rezerve et</ActionLink>
              <ActionLink href="/egitim" variant="outline">
                Kendi kurmak istersen: Eğitim
              </ActionLink>
            </div>
          </div>

          <Reveal delay={1}>
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-muted">
                Teknik şartname · {consulting.code}
              </p>
              <dl>
                <DataRow label="Tür" value={consulting.label} />
                <DataRow
                  label="Giriş"
                  value={consulting.durations.map((entry) => formatDuration(entry.minutes)).join(" / ")}
                />
                <DataRow label="Başlangıç" value={entryPrice} tone="accent" />
                <DataRow label="Paketler" value={`${firstTrackDays} — ${lastTrackDays}`} />
                <DataRow label="Teslim" value="Çalışır iş akışı + ekip devri" />
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="01"
          kicker="KAPSAM"
          title="Denetimden devre: tek muhatap, dört iş"
          lead="Kurulum bizde, kod sizde: her adımın çıktısı kendi deponuza, dokümanınıza ve ekibinize yazılır. İçeri taşınamayan çözüm bağımlılıktır — o yüzden son adım hep devirdir."
        />
        <ul className="mt-12 space-y-4">
          {consulting.topics.map((topic, index) => (
            <Reveal as="li" key={topic.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">{topic.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-muted">iş paketi</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{topic.title}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-muted">{topic.summary}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-3">
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
          kicker="PAKETLER"
          title="Müdahale derinliğine göre üç paket"
          lead="Atölye çıkışında hangi derinlikte devam edileceğine birlikte karar veriyorsunuz. Her paketin çıktısı ölçülebilir; sürpriz madde yok."
        />
        <div className="mt-10">
          <DimensionRule label={`${firstTrackDays} → ${lastTrackDays}`} />
        </div>
        <ul className="mt-4 space-y-4">
          {consultingTracks.map((track, index) => (
            <Reveal as="li" key={track.code} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-10">
                <div className="space-y-3">
                  <p className="font-mono text-sm font-medium text-primary">İZ-{track.code}</p>
                  <h2 className="text-xl font-semibold">{track.title}</h2>
                  <div>
                    <Chip tone="neutral">{track.days}</Chip>
                  </div>
                </div>
                <div>
                  <p className="max-w-[62ch] leading-relaxed text-muted">{track.body}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {track.deliverables.map((deliverable) => (
                      <li key={deliverable} className="flex items-start gap-2 text-sm leading-snug">
                        <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-success">
                          →
                        </span>
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          index="03"
          kicker="GİRİŞ NOKTASI"
          title="Kapsam atölyesi ile başla"
          lead="Paket seçmeden önce: sürecinizi masaya yatırıp ne kurulacağına karar veriyorsunuz. Uygulama sözü değil — net tespit ve teklif çıkışı."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {consulting.durations.map((duration) => (
            <Panel
              key={duration.minutes}
              className={cn("flex flex-col gap-4 p-6 sm:p-8", duration.popular && "border-primary")}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-sm uppercase tracking-wide text-muted">
                  {formatDuration(duration.minutes)}
                </p>
                {duration.popular ? <Chip tone="accent">Popüler</Chip> : null}
              </div>
              <p className="text-3xl font-semibold tracking-tight">{formatPrice(duration.priceEUR)}</p>
              <p className="text-sm leading-relaxed text-muted">{duration.note}</p>
              <div className="mt-auto pt-2">
                <ActionLink href={booking} variant={duration.popular ? "primary" : "outline"}>
                  Bu atölyeyi rezerve et
                </ActionLink>
              </div>
            </Panel>
          ))}
        </div>
        <p className="mt-6 flex max-w-[62ch] items-start gap-3 text-sm leading-relaxed text-muted">
          <span className="mt-0.5 shrink-0 font-mono text-xs uppercase tracking-wide">Slot</span>
          <span>{consulting.slotHint}</span>
        </p>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="04"
          kicker="KİMİN İÇİN"
          title="Doğru fit, dürüst sınır"
          lead="Bu hat, kurmak isteyen değil kurdurmak isteyen ekipler içindir. Kendi kurmak istersen eğitim hattı daha kısa ve daha hafif bir yol."
        />
        <ul className="mt-12">
          {consulting.bestFor.map((item, index) => (
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
          <ActionLink href={booking}>Kapsam atölyesi rezerve et</ActionLink>
          <ActionLink href="/egitim" variant="outline">
            Eğitim hattına bak
          </ActionLink>
        </div>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Kapsam netleşmeden teklif yok.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Atölye iki saat sürer, çıktı tek sayfadır: ne kurulacak, hangi sırada, kim neyi yapacak.
            O sayfaya ikna olmadan paket yoktur.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Atölye rezerve et</ActionLink>
            <a
              href={`mailto:${site.email}?subject=Dan%C4%9Fmanl%C4%B1k%20kapsam%C4%B1`}
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
