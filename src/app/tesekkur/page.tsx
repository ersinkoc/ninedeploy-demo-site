import type { Metadata } from "next";
import Link from "next/link";

import { ActionLink, Chip, DataRow, Kicker, Panel, Section } from "@/components/ui";
import { findReservation } from "@/lib/reservations";
import { requestTypeById } from "@/lib/catalog";
import { formatDuration, formatPrice, trDateTime, trMonthDay } from "@/lib/format";
import { slotToISO } from "@/lib/slots";
import { site } from "@/lib/site";
import { isStripeLive } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Talep alındı",
  description: "Rezervasyon onayı ve sonraki adımlar.",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { text: string; tone: "success" | "accent" | "danger" }> = {
  paid: { text: "Ödendi", tone: "success" },
  hold: { text: "Slot tutuluyor — ödeme bekliyor", tone: "accent" },
  failed: { text: "Ödeme tamamlanmadı", tone: "danger" },
  cancelled: { text: "İptal edildi", tone: "danger" },
};

export default async function TesekkurSayfa({
  searchParams,
}: {
  readonly searchParams: Promise<{ ref?: string | string[]; session_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.toUpperCase() : undefined;
  const record = ref ? await findReservation(ref) : undefined;
  const type = record ? requestTypeById(record.requestType) : undefined;
  const status = record ? (STATUS_LABEL[record.status] ?? STATUS_LABEL.hold) : undefined;
  const demo = record?.demo ?? !isStripeLive();

  return (
    <>
      <Section grid className="pb-6">
        <div className="max-w-[68ch] space-y-4">
          <Kicker index="AA-OK">{record ? "ŞARTNAME · ONAY" : "TALEP"}</Kicker>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {record ? "Yeriniz ayrıldı." : "Bu bağlantı bir kayıt taşımıyor."}
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            {record
              ? "Ödeme alındı; takvim daveti ve hazırlık formu e-postanıza gönderilecek."
              : "Rezervasyon numarası görünmüyor. Ödeme yaptıysanız e-postadaki bağlantıyı kullanın, olmadı bize yazın."}
          </p>
          {status ? <Chip tone={status.tone}>{status.text}</Chip> : null}
          {demo ? (
            <Chip tone="accent">Demo mod — gerçek ödeme alınmadı</Chip>
          ) : null}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {record ? (
            <Panel className="p-6 sm:p-8">
              <p className="mb-4 font-mono text-xs uppercase tracking-wide text-primary">
                Kayıt {record.ref}
              </p>
              <dl>
                <DataRow label="Tür" value={type?.label ?? record.requestType} />
                <DataRow label="Konu" value={`${record.topicTitle}`} />
                <DataRow label="Süre" value={formatDuration(record.durationMinutes)} />
                <DataRow
                  label="Slot"
                  value={`${trMonthDay(record.date)} · ${record.time.replace(":", ".")} (${site.timeZone})`}
                />
                <DataRow
                  label="Başlangıç"
                  value={trDateTime(slotToISO(record.date, record.time))}
                />
                <DataRow label="Tutar" value={formatPrice(record.amountEUR)} tone="accent" />
                <DataRow label="Katılımcı" value={record.customer.name} />
              </dl>
            </Panel>
          ) : (
            <Panel className="p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-fg-muted">
                Yardım:{" "}
                <a className="text-primary underline underline-offset-4" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </p>
            </Panel>
          )}

          <Panel ticks={false} className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Sonraki üç adım</h2>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="font-mono text-sm text-primary">01</span>
                <span className="text-sm leading-relaxed text-fg-muted">
                  Hazırlık formunu doldurun (7 soru, ~6 dakika). Depo yapısı, veri kaynağı ve hedef
                  iş akışı olmadan oturum açılmıyor.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-primary">02</span>
                <span className="text-sm leading-relaxed text-fg-muted">
                  Takvim davetini ve ekran paylaşımı bağlantısını e-postada bekleyin — iş gününde en
                  geç 4 saat içinde ilk yanıt.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-primary">03</span>
                <span className="text-sm leading-relaxed text-fg-muted">
                  Oturumdan 24 saat sonra karar notları ve PR geri gelir; 14 gün asenkron destek
                  başlar.
                </span>
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href={site.bookingPath} variant="outline">
                Başka slot ekle
              </ActionLink>
              <Link
                href="/sikca-sorulanlar"
                className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-wide text-fg-muted hover:text-primary"
              >
                iptal / iade nasıl işler?
              </Link>
            </div>
          </Panel>
        </div>
      </Section>
    </>
  );
}
