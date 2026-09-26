"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Çizim zeminini çevirir: "mavi masa" (koyu blueprint) ↔ "beyaz kâğıt" (açık whiteprint).
 * Anlam yalnız renkle değil etiketle de verilir; klavye ile erişilebilir.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("aa.theme", next ? "dark" : "light");
    } catch {
      /* özel gezinme: sessiz geç */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      title={dark ? "Beyaz kâğıda geç" : "Mavi masaya geç"}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3",
        "font-mono text-xs uppercase tracking-wide text-fg-muted",
        "transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary",
      )}
    >
      <span aria-hidden="true" className={cn("block size-2", dark ? "bg-primary" : "border border-primary")} />
      {dark ? "Mavi masa" : "Beyaz kâğıt"}
    </button>
  );
}
