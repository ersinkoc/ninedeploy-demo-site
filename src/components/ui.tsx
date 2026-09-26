import { cn } from "@/lib/cn";

/**
 * Sunucu tarafında render olan, hareketsiz arayüz primitifleri.
 * Kit: tech-blueprint — teknik çizim masası. Token dışı renk/yarıçap/boşluk yok.
 */

export function Kicker({
  index,
  children,
  className,
}: {
  readonly index?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-xs font-medium tracking-wide uppercase",
        className,
      )}
    >
      {index ? <span className="text-primary">{index}</span> : null}
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-40" />
      <span className="text-current opacity-80">{children}</span>
    </p>
  );
}

export function SectionHeading({
  id,
  index,
  kicker,
  title,
  lead,
  align = "start",
}: {
  readonly id?: string;
  readonly index?: string;
  readonly kicker: string;
  readonly title: React.ReactNode;
  readonly lead?: React.ReactNode;
  readonly align?: "start" | "split";
}) {
  return (
    <header
      id={id}
      className={cn(
        "scroll-mt-24",
        align === "split" && "grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-12",
      )}
    >
      <div className="space-y-4">
        {index ? <Kicker index={index}>{kicker}</Kicker> : <Kicker>{kicker}</Kicker>}
        <h2 className="max-w-[22ch] text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      </div>
      {lead ? <div className="max-w-[62ch] text-base text-muted leading-relaxed">{lead}</div> : null}
    </header>
  );
}

/**
 * Bölüm kabı. `tone="paper"` ters polariteli çizim kâğıdıdır (mürekkep zemini).
 */
export function Section({
  as: Tag = "section",
  tone = "default",
  grid = false,
  className,
  children,
  ...rest
}: {
  readonly as?: "section" | "div" | "footer" | "article";
  readonly tone?: "default" | "paper" | "surface";
  readonly grid?: boolean;
  readonly className?: string;
  readonly children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24",
        tone === "paper" && "bp-paper",
        tone === "surface" && "bg-surface",
        grid && "bp-grid",
        className,
      )}
      {...rest}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </Tag>
  );
}

/** Köşe çentikli teknik panel. İçerik rolü yoksa kullanmayın. */
export function Panel({
  as: Tag = "div",
  className,
  children,
  ticks = true,
}: {
  readonly as?: "div" | "li" | "article" | "aside";
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly ticks?: boolean;
}) {
  return (
    <Tag className={cn("relative rounded-lg border border-border bg-surface", className)}>
      {ticks ? <CornerTicks /> : null}
      {children}
    </Tag>
  );
}

/** Çizim masası köşe çentikleri — dekoratiftir, ekran okuyucuya görünmez. */
export function CornerTicks({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <span className="absolute -top-px -left-px size-2 border-t border-l border-primary" />
      <span className="absolute -top-px -right-px size-2 border-t border-r border-primary" />
      <span className="absolute -bottom-px -left-px size-2 border-b border-l border-primary" />
      <span className="absolute -right-px -bottom-px size-2 border-r border-b border-primary" />
    </span>
  );
}

/** Yatay ölçü çizgisi: "─────  ─────" yerine gerçek dimension line. */
export function DimensionRule({ label }: { readonly label?: string }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-border" />
      {label ? <span className="font-mono text-xs tracking-wide text-muted uppercase">{label}</span> : null}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const actionBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold tracking-wide transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

export const actionStyles = {
  primary: cn(actionBase, "border-primary bg-primary text-bg hover:bg-primary/85 hover:border-primary/85"),
  outline: cn(actionBase, "border-border bg-transparent text-fg hover:border-primary hover:text-primary"),
  quiet: cn(actionBase, "border-transparent bg-transparent text-muted hover:text-fg hover:border-border"),
} as const;

/** CTA bağlantısı — her zaman metin + ok, renk tek başına anlam taşımaz. */
export function ActionLink({
  href,
  variant = "primary",
  children,
  className,
  ...rest
}: {
  readonly href: string;
  readonly variant?: keyof typeof actionStyles;
  readonly children: React.ReactNode;
  readonly className?: string;
} & Omit<React.ComponentPropsWithoutRef<"a">, "className" | "href">) {
  return (
    <a href={href} className={cn(actionStyles[variant], className)} {...rest}>
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

/** Mono veri satırı: etiket ── değer. */
export function DataRow({
  label,
  value,
  tone = "default",
}: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly tone?: "default" | "success" | "accent";
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border/60 py-2 last:border-b-0">
      <dt className="font-mono text-xs tracking-wide text-muted uppercase">{label}</dt>
      <span aria-hidden="true" className="h-px flex-1 bg-border/70" />
      <dd
        className={cn(
          "font-mono text-sm font-medium",
          tone === "success" && "text-success",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Rozet: renk + metin + şekil birlikte. */
export function Chip({
  children,
  tone = "neutral",
}: {
  readonly children: React.ReactNode;
  readonly tone?: "neutral" | "primary" | "accent" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-xs tracking-wide uppercase",
        tone === "neutral" && "border-border text-muted",
        tone === "primary" && "border-primary text-primary",
        tone === "accent" && "border-accent text-accent",
        tone === "success" && "border-success text-success",
        tone === "danger" && "border-danger text-danger",
      )}
    >
      {children}
    </span>
  );
}
