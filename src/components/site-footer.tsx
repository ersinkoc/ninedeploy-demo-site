import { Chip } from "@/components/ui";
import { footerLinks, site } from "@/lib/site";
import { stripeModeLabel } from "@/lib/stripe";

/**
 * Alt bilgi. Bağlantılar `site.ts > footerLinks`'ten basılır (tek kaynak).
 * Stripe modunu da gösterir: anahtarsız kurulumda ziyaretçi ve site sahibi,
 * sitenin demo modda olduğunu bilmeli — bkz. .design/brief.md kabul maddesi.
 */
export function SiteFooter() {
  const mode = stripeModeLabel();
  const year = new Date().getFullYear();
  const columns = [footerLinks.slice(0, 4), footerLinks.slice(4)];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_minmax(0,1fr)] lg:px-8">
        <div className="space-y-3">
          <p className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center border border-primary text-primary"
            >
              <span className="block size-2 bg-primary" />
            </span>
            <span className="text-base font-semibold tracking-tight">{site.name}</span>
          </p>
          <p className="max-w-[38ch] text-sm leading-relaxed text-fg-muted">
            AI ajanlarını başkasının kutusundan çıkarmak yerine kendi projenizin içinde kurmayı
            öğretiyoruz. Sağlayıcı ve model seçimi serbest; mimari, araçlar, hafıza ve kontrol
            kapıları sizde kalır.
          </p>
          <p className="font-mono text-xs text-fg-muted">
            <a
              className="underline decoration-border underline-offset-4 hover:text-primary"
              href={`mailto:${site.email}`}
            >
              {site.email}
            </a>
            {" · "}
            {site.timeZone}
          </p>
        </div>

        {columns.map((links, index) => (
          <nav key={index} aria-label={index === 0 ? "Hizmetler" : "Öğren ve politika"} className="space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-wide text-primary">
              {index === 0 ? "Hizmetler" : "Rehber"}
            </h2>
            <ul className="space-y-1 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a className="inline-flex min-h-8 items-center hover:text-primary" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-wide text-primary">Ödeme</h2>
          <p className="text-sm leading-relaxed text-fg-muted">
            Stripe ile tek seferlik ödeme; kart bilgileri bu sunucuya gelmez. 24 saat öncesine
            kadar ücretsiz iptal, kurumsal fatura.
          </p>
          <Chip tone={mode.live ? "success" : "accent"}>{mode.live ? "Stripe hazır" : "Demo mod"}</Chip>
          <p className="pt-1">
            <a
              href="/#kurucu"
              className="font-mono text-xs uppercase tracking-wide text-fg-muted underline decoration-border underline-offset-4 hover:text-primary"
            >
              Ajan kurucuyu dene
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-xs text-fg-muted sm:px-6 lg:px-8">
          <p>
            © {year} {site.name}
          </p>
          <p>{mode.label}</p>
        </div>
      </div>
    </footer>
  );
}
