import { tickerWords } from "@/lib/blueprint";

/**
 * Mono ölçü şeridi. Dekoratif: ekran okuyucudan gizli, hover/odakta durur,
 * hareket azaltma açıksa kaymaz (CSS'te `prefers-reduced-motion` kapısı).
 */
export function Ticker() {
  const line = [...tickerWords, ...tickerWords];
  return (
    <div aria-hidden="true" className="bp-ticker overflow-hidden border-y border-border bg-surface py-2">
      <div className="bp-ticker-track flex w-max items-center gap-8 whitespace-nowrap pl-8">
        {line.map((word, index) => (
          <span key={`${word}-${index}`} className="flex items-center gap-8 font-mono text-xs tracking-wide text-muted uppercase">
            {word}
            <span className="inline-block size-1 shrink-0 rotate-45 bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}
