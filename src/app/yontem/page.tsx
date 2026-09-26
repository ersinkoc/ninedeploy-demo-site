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
import { inHouseChecklist } from "@/lib/catalog";
import {
  autonomies,
  compose,
  defaultSpec,
  evalModes,
  providers,
  tools,
} from "@/lib/blueprint";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Yöntem sayfası — altı katmanlı ajan mimarisi.
 * Katman listesi, sağlayıcı/arac/otonomi verisi ve kontrol listesi
 * `@/lib/blueprint` + `@/lib/catalog`'tan; sayfa yalnızca düzenler.
 */

const method = compose(defaultSpec);

const booking = `${site.bookingPath}?tip=destek-egitim`;

export const metadata: Metadata = {
  title: "Yöntem: altı katmanlı ajan mimarisi",
  description:
    "Ajan mimarisi altı katmandır: model, araç dağıtıcısı, bağlam ve hafıza, kontrol kapıları, gözetleme, değerlendirme. Sağlayıcı seçimi tek katmanı doldurur; kalanı içeride kurulur.",
  alternates: { canonical: "/yontem" },
};

export default function YontemPage() {
  return (
    <>
      <Section grid>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker>AJAN MİMARİSİ NASIL TASARLANIR</Kicker>
            <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
              Altı katman. <span className="text-fg-muted">Sağlayıcı yalnızca biri.</span>
            </h1>
            <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted">
              {site.claim} Bu sayfa o iddianın planı: katman katman ne kurulur, her katmanın sahibi
              kim ve hangi karar nerede durur.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={booking}>Bu mimariyi birlikte kur</ActionLink>
              <ActionLink href="/egitim#mufredat" variant="outline">
                Müfredatı gör
              </ActionLink>
              <ActionLink href="/" variant="quiet">
                Kurucu demoyu ana sayfada çalıştır
              </ActionLink>
            </div>
          </div>

          <Reveal delay={1}>
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-fg-muted">
                Teknik şartname · YÖNTEM
              </p>
              <dl>
                <DataRow label="Katman" value={String(method.layers.length).padStart(2, "0")} />
                <DataRow label="İçeride kurulan" value={`%${method.ownedShare}`} tone="success" />
                <DataRow label="Sağlayıcı" value={`${providers.length} seçenek`} />
                <DataRow label="Araç" value={`${tools.length} kategori`} />
                <DataRow label="Otonomi" value="0–3 kademe" />
              </dl>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="01"
          kicker="KATMAN HARİTASI"
          title="Sahibi belli altı katman"
          lead="Kiraladığınız katman değişir; içeride kurduğunuz katmanlar sizde kalır. Ana sayfadaki kurucu aracı da bu aynı listeyi doldurur — sahiplik oranı seçimlerinizle değişir."
        />
        <ul className="mt-12 space-y-4">
          {method.layers.map((layer, index) => (
            <Reveal as="li" key={layer.name} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <Chip tone={layer.owner === "içeride" ? "success" : "accent"}>
                    {layer.owner === "içeride" ? "İçeride" : "Kiralık"}
                  </Chip>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{layer.name}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{layer.note}</p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="02"
          kicker="SEÇİM YÜZEYİ"
          title="Sağlayıcı: değişebilir katman"
          lead="Beş seçenek, üç tür. Hangisini seçerseniz seçin, kilitlenme yüzeyi farklıdır — o yüzeyi soyutlama katmanıyla köreltmek içerideki işiniz."
        />
        <ul className="mt-12 space-y-4">
          {providers.map((provider, index) => (
            <Reveal as="li" key={provider.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">{provider.name}</h2>
                  <div>
                    <Chip
                      tone={
                        provider.kind === "yerel" ? "success" : provider.kind === "karma" ? "accent" : "neutral"
                      }
                    >
                      {provider.kind}
                    </Chip>
                  </div>
                </div>
                <div>
                  <p className="max-w-[62ch] leading-relaxed text-fg-muted">{provider.note}</p>
                  <p className="mt-4 flex max-w-[62ch] items-start gap-3 text-sm leading-relaxed text-fg-muted">
                    <span className="mt-0.5 shrink-0 font-mono text-xs uppercase tracking-wide">
                      Kilitlenme
                    </span>
                    <span>{provider.lockIn}</span>
                  </p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          index="03"
          kicker="ARAÇLAR"
          title="Araçlar ve risk yüzeyi"
          lead="Her araç kategorisi ajanın gücünü ve hata yüzeyini birlikte büyütür. Aşağıdaki risk değerleri, kurucunun risk puanına giren aynı sayılardır."
        />
        <div className="mt-10">
          <DimensionRule label={`A1 → A${tools.length}`} />
        </div>
        <ul className="mt-4 space-y-4">
          {tools.map((tool, index) => (
            <Reveal as="li" key={tool.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">{tool.code}</p>
                  <Chip tone={tool.risk >= 14 ? "danger" : tool.risk >= 8 ? "accent" : "neutral"}>
                    Risk {tool.risk}
                  </Chip>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{tool.name}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">{tool.advice}</p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="04"
          kicker="OTONOMİ"
          title="Otonomi ikili değil, kademeli"
          lead="Ajan ya çalışır ya durmaz sanılır; doğrusu dört kademedir. Her kademe yeni kapı ister: kademeyi yükselttiğinizde kapıyı da yazmalısınız."
        />
        <ul className="mt-12 space-y-4">
          {autonomies.map((autonomy, index) => (
            <Reveal as="li" key={autonomy.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel className="grid gap-6 p-6 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-8 sm:p-8">
                <div className="space-y-2">
                  <p className="font-mono text-sm font-medium text-primary">L{autonomy.level}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">kademe</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{autonomy.name}</h2>
                  <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">
                    {autonomy.description}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {autonomy.gates.map((gate) => (
                      <li key={gate}>
                        <Chip tone="primary">{gate}</Chip>
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
          index="05"
          kicker="ÖLÇME"
          title="Ölçme disiplini"
          lead="Ölçmediğiniz katman size değil şansınıza aittir. Üç mod var; ilki ertelemedir ve adı üstünde bir tercih değildir."
        />
        <ul className="mt-12 space-y-4">
          {evalModes.map((mode, index) => (
            <Reveal as="li" key={mode.id} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <Panel
                className={cn(
                  "grid gap-6 p-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8 sm:p-8",
                  mode.id === "yok" && "border-danger",
                )}
              >
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">{mode.name}</h2>
                  <div>
                    <Chip tone={mode.id === "yok" ? "danger" : mode.id === "ci" ? "success" : "neutral"}>
                      {`Risk ${mode.risk > 0 ? "+" : mode.risk < 0 ? "−" : ""}${Math.abs(mode.risk)}`}
                    </Chip>
                  </div>
                </div>
                <div>
                  <p className="max-w-[62ch] leading-relaxed text-fg-muted">{mode.advice}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                    {mode.checklist.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm leading-snug">
                        <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-primary">
                          +
                        </span>
                        <span>{item}</span>
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
          index="06"
          kicker="KONTROL LİSTESİ"
          title="Kendi içinde kurma kontrol listesi"
          lead="Altı madde. Hepsi yeşilse sistem sizindir; biri kırmızıysa o satır, bir sonraki çalıştayın konusudur."
        />
        <ul className="mt-12">
          {inHouseChecklist.map((item, index) => (
            <li
              key={item.title}
              className="flex items-start gap-4 border-b border-border/60 py-5 last:border-b-0 sm:gap-6"
            >
              <span className="mt-1 shrink-0 font-mono text-sm text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-1 max-w-[62ch] leading-relaxed text-fg-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionLink href={booking}>Bu mimariyi birlikte kur</ActionLink>
          <ActionLink href="/egitim#mufredat" variant="outline">
            Müfredata geç
          </ActionLink>
        </div>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Mimariyi okumak yetmez. Kurmak gerekir.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Bu katmanların her biri bir eğitim modülüne karşılık gelir: 1:1 çalıştayda kendi kod
            tabanınız üzerinden, kodu siz yazarak kurulur.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Çalıştay rezerve et</ActionLink>
            <a
              href={`mailto:${site.email}?subject=Y%C3%B6ntem%20-%20mimari`}
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
