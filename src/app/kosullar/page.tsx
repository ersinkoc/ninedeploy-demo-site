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
import { rentTerms } from "@/lib/catalog";
import { site } from "@/lib/site";

/**
 * Koşullar sayfası — vaat listesi değil, işleyişin özeti.
 * Madde metinleri `@/lib/catalog`'taki politika metinleriyle (faq, rentTerms) uyumlu;
 * uydurma tarih, adres veya kurumsal kayıt bilgisi içermez.
 */

const booking = `${site.bookingPath}?tip=gorusme`;
const mailto = `mailto:${site.email}?subject=Ko%C5%9Fullar`;

const sessionTerms: readonly string[] = [
  "Her oturum uzaktan ve ekran paylaşımıyla işler; görüntülü bağlantı rezervasyon sonrası e-postayla gelir.",
  "Varsayılan dil Türkçedir; teknik terimler İngilizce karşılıklarıyla geçer. Kodun ve dokümanların diline karar veren sizsiniz.",
  "Destek ve eğitim oturumlarına ekibinizden 2 kişi aynı ücretle katılabilir; daha kalabalık gruplar için saatlik kiralama içindeki mini çalıştay seçeneği vardır.",
  "Yüz yüze çalışma yalnızca İstanbul içi danışmanlık paketlerinde ve ayrıca planlanır.",
  "Ön koşul: kendi deponuzda çalışabiliyor olmak ve bir iş akışını yazılı olarak tarif edebilmek.",
];

export const metadata: Metadata = {
  title: "Koşullar",
  description:
    "Ödeme, iptal, katılım, saatlik kiralama ve fatura koşulları — rezervasyon adımından önce okunabilecek kadar kısa. Burada yazmayan hiçbir şey vaat edilmez.",
  alternates: { canonical: "/kosullar" },
};

export default function KosullarPage() {
  return (
    <>
      <Section grid>
        <div className="space-y-6">
          <Kicker>KOŞULLAR</Kicker>
          <h1 className="max-w-[18ch] text-5xl font-semibold leading-tight tracking-tight">
            Koşullar ve sınırlar. <span className="text-muted">Vaat listesi değil.</span>
          </h1>
          <p className="max-w-[62ch] text-lg leading-relaxed text-muted">
            Bu sayfa, ödeme adımından önce okunabilecek kadar kısa tutuldu. Burada yazmayan hiçbir
            şey vaat edilmiyor; yazanlar da hizmet kataloğunun kapsamını aşmıyor.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <ActionLink href={booking}>Keşif görüşmesi rezerve et</ActionLink>
            <ActionLink href="/sikca-sorulanlar" variant="outline">
              Sıkça sorulanlar
            </ActionLink>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="01"
          kicker="ÖDEME"
          title="Stripe üzerinden, tek seferlik"
          lead="Kart bilgileri bu sunucuya hiç uğramaz; işlem Stripe'ın güvenli ödeme sayfasında tamamlanır."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <Reveal>
            <Panel className="h-full p-6 sm:p-8">
              <dl>
                <DataRow label="Ödeme" value="Stripe Checkout · tek seferlik" />
                <DataRow label="Kart verisi" value="Sunucuya uğramaz" />
                <DataRow label="Fiyat" value="Rezervasyon anındaki liste" />
                <DataRow label="Demo mod" value="Anahtar yoksa ödeme alınmaz" tone="accent" />
              </dl>
            </Panel>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-[62ch] leading-relaxed text-muted">
              Ödeme, slot ve konu seçiminden sonra Stripe&rsquo;a yönlendirme ile alınır. Sitede
              görünen fiyatlar örnektir; bağlayıcı olan, rezervasyon ekranında ödeme öncesi
              listelenen tutardır. Ödeme anahtarı tanımlı değilse site demo modunda çalışır: akışın
              tamamı işler, ödeme alınmaz.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          index="02"
          kicker="İPTAL / ERTELEME"
          title="Pencere net, sürpriz yok"
          lead="Oturumdan 24 saat öncesine kadar iptal veya erteleme ücretsizdir; ücret iadesi Stripe üzerinden aynı karta yapılır."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <Reveal>
            <Panel className="h-full p-6 sm:p-8">
              <dl>
                <DataRow label="Ücretsiz pencere" value="Oturuma 24 saat kalaya dek" />
                <DataRow label="İade" value="Stripe üzerinden, aynı karta" />
                <DataRow label="Son 24 saat" value="Kota yanmaz, devreder" tone="success" />
              </dl>
            </Panel>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-[62ch] leading-relaxed text-muted">
              24 saat içinde yapılan iptallerde saat kotası yanmaz; bir sonraki oturuma sayılır.
              İptal ya da erteleme için e-posta yeterlidir — ayrı bir süreç, ayrı bir form yok.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          index="03"
          kicker="OTURUM"
          title="Uzaktan, Türkçe, ekran başında"
          lead="Oturumların nasıl işlediğine dair beş madde."
        />
        <ul className="mt-12">
          {sessionTerms.map((term, index) => (
            <Reveal as="li" key={term} delay={((index % 3) + 1) as 1 | 2 | 3}>
              <div className="flex items-start gap-4 border-b border-border/60 py-5 last:border-b-0 sm:gap-6">
                <span className="mt-1 shrink-0 font-mono text-sm text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="max-w-[62ch] leading-relaxed">{term}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          index="04"
          kicker="SAATLİK KİRALAMA"
          title="Kira şartları"
          lead="Saatlik kiralama paketlerini farklı işleten şartlar katalogda tek yerde durur; aşağıdaki tablo oradan gelir."
        />
        <Reveal className="mt-12">
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
          index="05"
          kicker="FATURA & DEĞİŞİKLİK"
          title="Fatura ve bu sayfanın hali"
          lead="Kurum adına fatura kesilir; ödeme sırasında şirket bilgilerinizi belirtebilirsiniz."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <Reveal>
            <Panel className="h-full p-6 sm:p-8">
              <dl>
                <DataRow label="Fatura" value="Türkçe · e-posta ile" />
                <DataRow label="Kurumsal" value="Vergi no / veri dairesi ödeme adımında" />
                <DataRow label="Toplu kota" value="Kurumsal alımlarda daha verimli" tone="accent" />
              </dl>
            </Panel>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-[62ch] leading-relaxed text-muted">
              Bu sayfa, hizmet kataloğu değiştikçe güncellenir; bağlayıcı olan rezervasyon anında
              yürürlükte olan sürümdür. Katalogdaki süre, konu ve fiyat listeleri rezervasyon
              ekranında ödeme öncesi eksiksiz gösterilir.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="paper">
        <div className="max-w-[62ch] space-y-6">
          <Kicker>Sonraki adım</Kicker>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Anlaşılmayan madde varsa, sormadan ilerleme.
          </h2>
          <p className="leading-relaxed text-fg-muted">
            Bir madde belirsizse keşif görüşmesinde netleştirilir; görüşmede söylenen, burada
            yazmayanın yerine geçmez. Yazılı netleştirme istiyorsan e-posta da çalışır.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href={booking}>Görüşme rezerve et</ActionLink>
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
