/** Koşullu class birleştirici — tek satır, bağımlılık yok. */
export function cn(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
