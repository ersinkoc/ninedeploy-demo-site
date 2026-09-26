import { site } from "@/lib/site";
import { primaryNav } from "@/lib/site";
import { isStripeLive } from "@/lib/stripe";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

/**
 * Üst şerit: mono etiketler, tek CTA, mobilde açılır menü.
 * `details/summary` ile JS'siz de çalışır; görsel durum metin + simge ile verilir.
 */
export function SiteHeader() {
  const live = isStripeLive();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" className="flex min-h-11 items-center gap-2" aria-label={`${site.name} ana sayfa`}>
          <span aria-hidden="true" className="grid size-7 place-items-center border border-primary text-primary">
            <span className="block size-1.5 bg-current" />
          </span>
          <span className="text-base font-semibold tracking-tight">{site.name}</span>
        </a>

        <nav aria-label="Ana menü" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center px-3 font-mono text-xs uppercase tracking-wide text-fg-muted transition-colors duration-(--duration-fast) hover:text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <ThemeToggle />
          <a
            href={site.bookingPath}
            className={cn(
              "hidden min-h-11 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-bg",
              "transition-colors duration-(--duration-fast) hover:bg-fg sm:inline-flex",
            )}
          >
            Slot seç
          </a>
          <details className="relative lg:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-md border border-border text-fg-muted hover:text-primary">
              <span className="sr-only">Menüyü aç</span>
              <span aria-hidden="true" className="font-mono text-sm">
                ≡
              </span>
            </summary>
            <nav
              aria-label="Mobil menü"
              className="absolute right-0 top-12 z-50 w-64 border border-border bg-surface p-2"
            >
              <ul className="space-y-1">
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-bg">
                      {item.label}
                      <span className="block font-mono text-xs text-fg-muted">{item.note}</span>
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={site.bookingPath}
                    className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-bg"
                  >
                    Slot seç
                  </a>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>

      {!live ? (
        <p className="border-t border-border bg-accent/12 px-4 py-1.5 text-center font-mono text-xs text-fg-muted">
          <span className="text-accent">DEMO MOD</span> — Stripe anahtarı tanımlı değil; ödeme
          alınmadan akışın tamamı sınanabilir.
        </p>
      ) : null}
    </header>
  );
}
