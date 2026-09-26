import { ActionLink, Kicker, Section } from "@/components/ui";

/**
 * 404 — kök layout içinde render edilir (header/footer dahil).
 * Tek h1, blueprint zemin, iki dönüş hattı.
 */
export default function NotFound() {
  return (
    <Section grid className="py-20 sm:py-24 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div className="space-y-6">
          <Kicker index="404">SAYFA BULUNAMADI</Kicker>
          <h1 className="max-w-[16ch] text-5xl font-semibold leading-tight tracking-tight">
            Bu sayfa çizim masasında yok.
          </h1>
          <p className="max-w-[62ch] text-lg leading-relaxed text-muted">
            Adres yanlış yazılmış ya da sayfa taşınmış olabilir. Aşağıdaki hatlardan devam
            edebilirsin.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <ActionLink href="/">Ana sayfaya dön</ActionLink>
            <ActionLink href="/sikca-sorulanlar" variant="outline">
              Sıkça sorulanlar
            </ActionLink>
          </div>
        </div>
        <p
          aria-hidden="true"
          className="select-none font-mono text-display font-semibold leading-none text-primary"
        >
          404
        </p>
      </div>
    </Section>
  );
}
