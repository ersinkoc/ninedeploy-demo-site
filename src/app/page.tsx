import type { Metadata } from "next";

import { AgentComposer } from "@/components/agent-composer";
import { Reveal } from "@/components/reveal";
import { Ticker } from "@/components/ticker";
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
import {
  faq,
  inHouseChecklist,
  requestTypes,
  requireRequestType,
  sessionFlow,
} from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — ${site.tagline}` },
  description: site.claim,
  alternates: { canonical: "/" },
};

const training = requireRequestType("destek-egitim");
const consulting = requireRequestType("danismanlik");
const rent = requireRequestType("kiralama");
const call = requireRequestType("gorusme");

const modules = training.topics.filter((topic) => !topic.custom);
const previewFaq = faq.slice(0, 4);

export default function AnaSayfa() {
  return (
    <>
      {/* ── Başlık bloğu: çizim masasının sağ alt köşesindeki etiket tablosu gibi ── */}
      <Section grid className="overflow-hidden">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Kicker index="AA-01">AI ajanları · canlı 1:1 oturum</Kicker>
            <h1 className="max-w-[18ch] text-display font-semibold leading-tight">
              AI ajanını <span className="text-primary">kutudan çıkarma.</span> Kendi projende kur.
            </h1>
            <p className="max-w-[58ch] text-lg leading-relaxed text-fg-muted">
              Sağlayıcı ve model seçeneklerini seçmek işin kolay yarısı. Zor olan: hangi aracı
              kime veriyorsun, ne kadar hafıza taşıyorsun, nerede duruyorsun ve nasıl
              ölçüyorsun. Bunları kendi kod tabanın üzerinden, canlı çalıştaylarda kuruyoruz —
              agentic sistemin %100’ü içeride kalır.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <ActionLink href={`${site.bookingPath}?tip=gorusme&sure=30`}>
                30 dk görüşme planla
              </ActionLink>
              <ActionLink href="#kurucu" variant="outline">
                Önce ajan kurucuyu dene
              </ActionLink>
            </div>
            <ul className="flex flex-wrap gap-2 pt-2">
              <li><Chip tone="neutral">1:1 canlı oturum</Chip></li>
              <li><Chip tone="neutral">Kendi depon</Chip></li>
              <li><Chip tone="neutral">Sağlayıcı bağımsız katman</Chip></li>
              <li><Chip tone="success">Kod ve kararlar sizde kalır</Chip></li>
            </ul>
          </div>

          <Reveal delay={1}>
            <Panel className="p-5 sm:p-6">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-primary">
                Ölçü tablosu · AA-01
              </p>
              <dl>
                <DataRow label="Eğitim" value={`${modules.length} modül · ${formatDuration(90)} oturum`} />
                <DataRow label="Danışmanlık" value="Denetim → kurulum → devir" />
                <DataRow label="Saatlik" value={`${formatPrice(rent.durations[0]?.priceEUR ?? 0)} / saatten`} />
                <DataRow label="Görüşme" value={`${formatPrice(call.durations[0]?.priceEUR ?? 0)} / ${formatPrice(call.durations[1]?.priceEUR ?? 0)}`} />
                <DataRow label="Zaman dilimi" value="Europe/Istanbul" />
                <DataRow label="Ödeme" value="Stripe Checkout" tone="success" />
              </dl>
              <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-fg-muted">
                Fiyatlar tek seferlik oturum başınadır; kurumsal fatura kesilir.
                Slot seçimi ve ödeme siteden yapılır, e-posta trafiğiyle değil.
              </p>
              <div className="mt-4">
                <ActionLink href={site.bookingPath} variant="quiet">
                  Şartnameyi doldur
                </ActionLink>
              </div>
            </Panel>
          </Reveal>
        </div>
      </Section>

      <Ticker />

      {/* ── 01 · kurucu: eğitimin kendisinin çalışan demosu ── */}
      <Section id="kurucu" className="scroll-mt-24">
        <SectionHeading
          align="split"
          index="01"
          kicker="AJAN SİSTEMİ KURUCUSU"
          title="Beş karar, sonra şema değişir"
          lead="Sağlayıcı, model kademesi, araçlar, otonomi ve ölçme. Sağdaki levha her seçimde yeniden çizilir: risk bandı, içeride kurulan katmanlar, oturum tahmini ve kontrol listesi. Bu, eğitimde kurduğumuz şeyin küçültülmüş hâlidir — dekorasyon değil."
        />
        <div className="mt-10">
          <AgentComposer />
        </div>
      </Section>

      {/* ── 02 · iki hat ── */}
      <Section tone="paper">
        <div className="space-y-10">
          <div>
            <Kicker index="02">İKİ HAT</Kicker>
            <h2 className="mt-4 max-w-[24ch] text-3xl font-semibold leading-tight sm:text-4xl">
              Kendin kurmak mı, kurdurmak mı?
            </h2>
            <p className="mt-4 max-w-[62ch] leading-relaxed text-fg-muted">
              İkisi de aynı mimariyi üretir; farkı kimin klavyede olduğu. Eğitim hattında kodu sen
              yazarsın, ben köşeleri gösteririm. Danışmanlık hattında kurulumu biz yaparız ve
              çalışır hâlde, size öğreterek teslim ederiz.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <Panel className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-xs uppercase tracking-wide text-primary">
                  {training.code} · Eğitim
                </p>
                <Chip tone="primary">{formatDuration(60)}–{formatDuration(120)}</Chip>
              </div>
              <h3 className="text-2xl font-semibold leading-tight">{training.label}</h3>
              <p className="leading-relaxed text-fg-muted">{training.intro}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {training.bestFor.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug">
                    <span aria-hidden="true" className="font-mono text-primary">
                      +
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                <ActionLink href={`${site.bookingPath}?tip=destek-egitim`}>Oturum planla</ActionLink>
                <a href="/egitim" className="font-mono text-xs uppercase tracking-wide text-fg underline underline-offset-4">
                  Müfredatı gör
                </a>
              </div>
            </Panel>

            <Panel className="flex flex-col gap-4 p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-wide text-accent">
                {consulting.code} · Danışmanlık
              </p>
              <h3 className="text-2xl font-semibold leading-tight">{consulting.label}</h3>
              <p className="leading-relaxed text-fg-muted">{consulting.intro}</p>
              <ul className="grid gap-2">
                {consulting.bestFor.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug">
                    <span aria-hidden="true" className="font-mono text-accent">
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <ActionLink href={`${site.bookingPath}?tip=danismanlik`} variant="outline">
                  Kapsam atölyesi
                </ActionLink>
              </div>
            </Panel>
          </div>

          <Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-primary">
                {rent.code} · Saatlik kiralama
              </p>
              <p className="mt-2 max-w-[62ch] leading-relaxed text-fg-muted">
                {rent.intro}
              </p>
            </div>
            <ActionLink href={`${site.bookingPath}?tip=kiralama`} variant="outline">
              {formatPrice(rent.durations[2]?.priceEUR ?? 0)} / 5 saatlik kota
            </ActionLink>
          </Panel>
        </div>
      </Section>

      {/* ── 03 · müfredat ── */}
      <Section tone="surface">
        <SectionHeading
          align="split"
          index="03"
          kicker="MÜFREDAT"
          title="Altı modül, her biri çalışan bir çıktı"
          lead="Sıra şart değil: mevcut sıkıştığınız yerden başlarız. Her modül kendi deponuzda, oturum sonunda çalışan bir PR ile biter."
        />
        <ol className="mt-12">
          {modules.map((module, index) => (
            <Reveal as="li" key={module.id} delay={((index % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="grid gap-4 border-b border-border py-6 sm:grid-cols-[minmax(0,4rem)_minmax(0,1fr)] sm:gap-8">
                <p className="font-mono text-sm text-primary">{module.code}</p>
                <div>
                  <h3 className="text-xl font-semibold">{module.title}</h3>
                  <p className="mt-1 max-w-[62ch] leading-relaxed text-fg-muted">{module.summary}</p>
                  <p className="mt-3 font-mono text-xs text-success">
                    ÇIKTI → {module.outcomes[0] ?? ""}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink href={`${site.bookingPath}?tip=destek-egitim&konu=${modules[0]?.id ?? ""}`}>
            İlk modülle başla
          </ActionLink>
          <ActionLink href="/egitim" variant="outline">
            Tüm müfredat ve oturum formatı
          </ActionLink>
        </div>
      </Section>

      {/* ── 04 · içeride kalma gerekçesi ── */}
      <Section grid>
        <SectionHeading
          index="04"
          kicker="%100 İÇERİDE"
          title="Seçimi yönetebilmek, seçmekten önemlidir"
          lead="Oturumlarda kurduğumuz şey bir ajan değil, ajanı ayakta tutan altı katman. Hiçbiri bir ajansın kapalı kutusunda durmuyor."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inHouseChecklist.map((item, index) => (
            <Reveal as="li" key={item.title} delay={((index % 4) + 1) as 1 | 2 | 3 | 4}>
              <Panel className="h-full p-5" ticks={false}>
                <p className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</p>
              </Panel>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ── 05 · oturum akışı ── */}
      <Section>
        <SectionHeading
          index="05"
          kicker="OTURUM AKIŞI"
          title="Çalıştay, randevudan önce başlar"
          lead="Dört istasyon. Hazırlık formu gelmeden oturum açılmıyor; genel seminer yapmıyoruz."
        />
        <div className="mt-12">
          <DimensionRule label="48 SAAT ÖNCE → 14 GÜN SONRA" />
        </div>
        <ol className="mt-6 grid gap-4 lg:grid-cols-4">
          {sessionFlow.map((station, index) => (
            <Reveal as="li" key={station.code} delay={((index % 4) + 1) as 1 | 2 | 3 | 4}>
              <Panel className="h-full p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-sm text-primary">{station.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-accent">{station.when}</p>
                </div>
                <h3 className="mt-3 text-base font-semibold">{station.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{station.body}</p>
              </Panel>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ── 06 · tarife ── */}
      <Section tone="surface">
        <SectionHeading
          index="06"
          kicker="TARİFE"
          title="Dört hat, tek tarife cetveli"
          lead="Rakamlar katalogdan gelir; sitede indirim/kampanya tiyatrosu yok. Kurumsal fatura ve 24 saat önce ücretsiz iptal her hatta geçerli."
        />
        <ul className="mt-12 grid gap-4 lg:grid-cols-2">
          {requestTypes.map((type) => (
            <li key={type.id}>
              <Panel className="h-full p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-primary">{type.code}</p>
                  <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">{type.kicker}</p>
                </div>
                <h3 className="mt-2 text-xl font-semibold">{type.label}</h3>
                <dl className="mt-4">
                  {type.durations.map((entry) => (
                    <DataRow
                      key={entry.minutes}
                      label={entry.label ?? formatDuration(entry.minutes)}
                      value={formatPrice(entry.priceEUR)}
                      tone={entry.popular ? "accent" : "default"}
                    />
                  ))}
                </dl>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{type.slotHint}</p>
                <div className="mt-4">
                  <ActionLink href={`${site.bookingPath}?tip=${type.id}`} variant="quiet">
                    Slot seç
                  </ActionLink>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── 07 · SSS önizleme ── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <Kicker index="07">SIK SORULAN</Kicker>
            <h2 className="text-3xl font-semibold leading-tight">Cevabı net olan sorular</h2>
            <p className="max-w-[52ch] leading-relaxed text-fg-muted">
              Ödeme, iptal, dil, ekip katılımı ve ön koşul. Gerisini de sitede bulabilirsiniz;
              bulamazsanız e-posta yeterli.
            </p>
            <ActionLink href="/sikca-sorulanlar" variant="outline">
              Tüm sorular
            </ActionLink>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {previewFaq.map((entry) => (
              <li key={entry.q} className="py-5">
                <h3 className="font-mono text-xs uppercase tracking-wide text-primary">{entry.q}</h3>
                <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-fg-muted">{entry.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── kapanış ── */}
      <Section tone="paper" grid={false}>
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Bir slot seç, gerisini oturumda konuşalım.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Şartnameyi dolduruyorsunuz: tür, konu, süre, saat. Stripe ödeme sayfası açılır;
            onay sonrası takvim daveti ve hazırlık formu e-postaya düşer.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={`${site.bookingPath}?tip=gorusme&sure=30`}>30 dk görüşme · {formatPrice(call.durations[0]?.priceEUR ?? 0)}</ActionLink>
            <a
              href={`mailto:${site.email}`}
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
