"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Chip, DataRow, Panel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { requestTypes, requireRequestType, type RequestType } from "@/lib/catalog";
import { formatDuration, formatPrice, trMonthDay } from "@/lib/format";
import {
  emptyDraft,
  validateBooking,
  type BookingDraft,
  type FieldErrors,
} from "@/lib/booking";

/**
 * Şartname akışı: tür → konu → süre+slot → iletişim → Stripe.
 * Fiyat ve uygunluk sunucudan gelir; burada yalnızca seçim tutulur.
 */

type SlotDay = {
  date: string;
  weekday: string;
  closed: boolean;
  reason?: string;
  openTimes: string[];
  taken: string[];
};

type AvailabilityResponse = { tip: string; sure: number; days: SlotDay[] };

const STEPS = [
  { id: 1, code: "01", label: "Talep türü" },
  { id: 2, code: "02", label: "Konu" },
  { id: 3, code: "03", label: "Süre ve slot" },
  { id: 4, code: "04", label: "İletişim ve ödeme" },
] as const;

function StepRail({
  step,
  onJump,
  maxReached,
}: {
  readonly step: number;
  readonly onJump: (next: number) => void;
  readonly maxReached: number;
}) {
  return (
    <nav aria-label="Şartname istasyonları">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((entry) => {
          const current = entry.id === step;
          const done = entry.id < maxReached;
          const reachable = entry.id <= maxReached;
          return (
            <li key={entry.id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump(entry.id)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-md border px-3 font-mono text-xs uppercase tracking-wide transition-colors duration-(--duration-fast)",
                  current && "border-primary bg-primary/10 text-fg",
                  !current && done && "border-success text-success",
                  !current && !done && reachable && "border-border text-fg-muted hover:border-primary",
                  !reachable && "border-border text-fg-muted opacity-50",
                )}
              >
                <span aria-hidden="true">{done && !current ? "✓" : entry.code}</span>
                {entry.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-2 font-mono text-xs uppercase tracking-wide">
        {label}
        {required ? <span className="text-accent">zorunlu</span> : <span className="text-fg-muted">opsiyonel</span>}
        {hint ? <span className="text-fg-muted normal-case">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-2 text-sm text-danger">
          <span aria-hidden="true">✕</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg placeholder:text-fg-muted " +
  "transition-colors duration-(--duration-fast) hover:border-primary " +
  "focus-visible:border-primary";

export function BookingWizard({
  initialType,
  initialTopic,
  initialMinutes,
  cancelled,
  composerNote,
}: {
  readonly initialType?: string;
  readonly initialTopic?: string;
  readonly initialMinutes?: number;
  readonly cancelled?: boolean;
  readonly composerNote?: string;
}) {
  const preflight = useMemo<BookingDraft>(() => {
    const base: BookingDraft = { ...emptyDraft };
    const type = initialType ? requireRequestType(initialType as RequestType["id"]) : undefined;
    if (type) {
      base.requestType = type.id;
      const topic = type.topics.find((entry) => entry.id === initialTopic);
      base.topicId = topic ? topic.id : "";
      const duration =
        type.durations.find((entry) => entry.minutes === initialMinutes) ?? type.durations[0];
      base.minutes = duration?.minutes ?? 0;
    }
    return base;
  }, [initialType, initialTopic, initialMinutes]);

  const [draft, setDraft] = useState<BookingDraft>(preflight);
  const [step, setStep] = useState<number>(preflight.requestType ? 2 : 1);
  const [maxReached, setMaxReached] = useState<number>(preflight.requestType ? 2 : 1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(cancelled ? "Ödeme tamamlanmadı. İstediğiniz an bu şartnameyi yeniden başlatabilirsiniz." : null);
  const [days, setDays] = useState<SlotDay[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const headRef = useRef<HTMLHeadingElement | null>(null);

  const type = draft.requestType ? requireRequestType(draft.requestType as RequestType["id"]) : undefined;
  const topic = type?.topics.find((entry) => entry.id === draft.topicId);
  const duration = type?.durations.find((entry) => entry.minutes === draft.minutes);

  const patch = useCallback((next: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  }, []);

  /* Süre/tür değişince uygunluğu yeniden çek. */
  const load = useCallback(async () => {
    if (!type || !draft.minutes) return;
    setStatus("loading");
    setFormError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(
        `/api/availability?tip=${encodeURIComponent(type.id)}&sure=${draft.minutes}&gun=16`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error(`${response.status}`);
      const data = (await response.json()) as AvailabilityResponse;
      setDays(data.days);
      setStatus("ready");
    } catch {
      setDays([]);
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }, [type, draft.minutes]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (step === 3) headRef.current?.focus();
  }, [step]);

  function go(next: number) {
    setStep(next);
    setMaxReached((prev) => Math.max(prev, next));
  }

  function chooseType(id: string) {
    const next = requireRequestType(id as RequestType["id"]);
    setDraft({ ...emptyDraft, requestType: next.id, minutes: next.durations[0]?.minutes ?? 0 });
    setErrors({});
    patch({ requestType: next.id, minutes: next.durations[0]?.minutes ?? 0 });
    go(2);
  }

  function chooseTopic(id: string) {
    patch({ topicId: id });
    setErrors({});
    go(3);
  }

  function chooseDuration(minutes: number) {
    patch({ minutes, date: "", time: "" });
  }

  const visibleDays = days.filter((day) => !day.closed);
  const activeDay = days.find((day) => day.date === draft.date);

  function summaryPrice(): string {
    return duration ? formatPrice(duration.priceEUR) : "—";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateBooking(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Eksik alanlar var; kırmızı uyarılan yerleri düzeltin.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as {
        error?: string;
        url?: string;
        redirect?: string;
        fields?: FieldErrors;
      };
      if (!response.ok) {
        setFormError(data.error ?? "Ödeme başlatılamadı. Birazdan tekrar deneyin.");
        if (data.fields) setErrors(data.fields);
        if (response.status === 409) void load();
        setSubmitting(false);
        return;
      }
      const target = data.url ?? data.redirect;
      if (target) {
        window.location.assign(target);
        return;
      }
      setFormError("Sunucu ödeme bağlantısı vermedi.");
      setSubmitting(false);
    } catch {
      setFormError("Bağlantı kurulamadı. İnterneti kontrol edip tekrar deneyin.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <form onSubmit={submit} noValidate className="space-y-8">
        <StepRail step={step} maxReached={maxReached} onJump={setStep} />

        {formError ? (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-danger px-4 py-3 text-sm text-danger">
            <span aria-hidden="true">✕</span>
            <span>{formError}</span>
          </p>
        ) : null}

        {step === 1 ? (
          <fieldset className="space-y-4">
            <legend>
              <h2 ref={headRef} tabIndex={-1} className="text-2xl font-semibold">
                Ne tür bir talep açıyorsunuz?
              </h2>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {requestTypes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => chooseType(entry.id)}
                  className={cn(
                    "flex min-h-11 flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors duration-(--duration-fast)",
                    draft.requestType === entry.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary",
                  )}
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-primary">{entry.code}</span>
                  <span className="text-lg font-semibold">{entry.label}</span>
                  <span className="text-sm text-fg-muted">{entry.kicker}</span>
                  <span className="mt-1 font-mono text-xs text-fg-muted">
                    {formatPrice(Math.min(...entry.durations.map((item) => item.priceEUR)))}’den başlayan
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 2 && type ? (
          <fieldset className="space-y-4">
            <legend>
              <h2 ref={headRef} tabIndex={-1} className="text-2xl font-semibold">
                {type.label} için konu seçin
              </h2>
            </legend>
            <div className="grid gap-3">
              {type.topics.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => chooseTopic(entry.id)}
                  aria-pressed={draft.topicId === entry.id}
                  className={cn(
                    "flex min-h-11 items-start gap-4 rounded-lg border p-4 text-left transition-colors duration-(--duration-fast)",
                    draft.topicId === entry.id ? "border-primary bg-primary/10" : "border-border hover:border-primary",
                  )}
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-primary">{entry.code}</span>
                  <span className="flex-1">
                    <span className="block text-lg font-semibold">{entry.title}</span>
                    <span className="block text-sm text-fg-muted">{entry.summary}</span>
                    <span className="mt-2 block font-mono text-xs text-success">
                      → {entry.outcomes[0] ?? ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 3 && type ? (
          <fieldset className="space-y-6">
            <legend>
              <h2 ref={headRef} tabIndex={-1} className="text-2xl font-semibold">
                Süre ve slot
              </h2>
            </legend>

            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Süre">
              {type.durations.map((entry) => (
                <button
                  key={entry.minutes}
                  type="button"
                  role="radio"
                  aria-checked={draft.minutes === entry.minutes}
                  onClick={() => chooseDuration(entry.minutes)}
                  className={cn(
                    "flex min-h-11 flex-col items-start justify-center rounded-md border px-4 py-1 text-left transition-colors duration-(--duration-fast)",
                    draft.minutes === entry.minutes ? "border-primary bg-primary/10" : "border-border hover:border-primary",
                  )}
                >
                  <span className="text-sm font-semibold">
                    {entry.label ?? formatDuration(entry.minutes)} · {formatPrice(entry.priceEUR)}
                  </span>
                  <span className="font-mono text-xs text-fg-muted">{entry.note}</span>
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-fg-muted">
                Gün · Europe/Istanbul
              </p>
              {status === "loading" ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8" aria-hidden="true">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-14 animate-pulse rounded-md bg-surface" />
                  ))}
                </div>
              ) : null}
              {status === "error" ? (
                <div className="rounded-md border border-danger p-4 text-sm text-danger">
                  Uygunluk alınamadı.{" "}
                  <button type="button" onClick={() => void load()} className="underline underline-offset-4">
                    Yeniden dene
                  </button>
                </div>
              ) : null}
              {status === "ready" && visibleDays.length === 0 ? (
                <p className="rounded-md border border-border p-4 text-sm text-fg-muted">
                  Önümüzdeki 16 günde açık gün kalmadı. 30 dk’lık bir görüşme türüyle daha fazla slot
                  görebilirsiniz.
                </p>
              ) : null}
              {status === "ready" && visibleDays.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {visibleDays.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      aria-pressed={draft.date === day.date}
                      onClick={() => patch({ date: day.date, time: "" })}
                      className={cn(
                        "flex min-h-14 min-w-20 shrink-0 flex-col items-center justify-center rounded-md border px-3 font-mono text-xs uppercase transition-colors duration-(--duration-fast)",
                        draft.date === day.date ? "border-primary bg-primary/10 text-fg" : "border-border text-fg-muted hover:border-primary",
                      )}
                    >
                      <span>{day.weekday.slice(0, 3)}</span>
                      <span className="text-sm font-semibold normal-case">{trMonthDay(day.date)}</span>
                      <span>{day.openTimes.length} slot</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {activeDay ? (
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-wide text-fg-muted">Saat</p>
                {activeDay.openTimes.length === 0 ? (
                  <p className="rounded-md border border-border p-4 text-sm text-fg-muted">
                    Bu gün için uygun slot kalmadı.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {activeDay.openTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        aria-pressed={draft.time === time}
                        onClick={() => patch({ time })}
                        className={cn(
                          "min-h-11 rounded-md border font-mono text-sm transition-colors duration-(--duration-fast)",
                          draft.time === time
                            ? "border-primary bg-primary text-bg"
                            : "border-border text-fg-muted hover:border-primary hover:text-fg",
                        )}
                      >
                        {time.replace(":", ".")}
                      </button>
                    ))}
                    {/* Tutulan saatler ızgarada çapraz taramayla görünür kalır:
                        "kimse açmamış" değil "dolu" olduğu belli olsun. */}
                    {activeDay.taken.map((time) => (
                      <span
                        key={`taken-${time}`}
                        title="Bu saat dolu"
                        className="bp-hatch grid min-h-11 place-items-center rounded-md border border-border font-mono text-sm text-fg-muted line-through"
                      >
                        <span className="sr-only">Dolu saat: </span>
                        {time.replace(":", ".")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <p className="font-mono text-xs text-fg-muted">{type.slotHint}</p>
          </fieldset>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <h2 ref={headRef} tabIndex={-1} className="text-2xl font-semibold">
              İletişim bilgileri
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="name" label="Ad soyad" required error={errors.name}>
                <input
                  id="name"
                  name="name"
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={cn(inputClass, errors.name && "border-danger")}
                  placeholder="Örn. Deniz Yılmaz"
                />
              </Field>
              <Field id="email" label="E-posta" required error={errors.email} hint="takvim daveti buraya gelir">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={draft.email}
                  onChange={(event) => patch({ email: event.target.value })}
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(inputClass, errors.email && "border-danger")}
                  placeholder="siz@ekip.dev"
                />
              </Field>
              <Field id="company" label="Şirket / ekip" error={errors.company}>
                <input
                  id="company"
                  name="company"
                  value={draft.company}
                  onChange={(event) => patch({ company: event.target.value })}
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.company)}
                  className={cn(inputClass, errors.company && "border-danger")}
                  placeholder="opsiyonel"
                />
              </Field>
              <Field
                id="notes"
                label="Projeniz ve hedefiniz"
                error={errors.notes}
                hint="depo dili, veri kaynağı, takıldığınız yer"
              >
                <textarea
                  id="notes"
                  name="notes"
                  rows={5}
                  value={draft.notes}
                  onChange={(event) => patch({ notes: event.target.value })}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "notes-error" : undefined}
                  className={cn(inputClass, "min-h-28 py-2", errors.notes && "border-danger")}
                  placeholder={
                    composerNote ??
                    "Örn. TypeScript + Postgres; destek e-postalarını sınıflandıran bir ajan kurduk, araç çağrıları üretime geçemiyor."
                  }
                />
              </Field>
            </div>
            <p className="text-sm text-fg-muted">
              Bu bilgiler yalnızca oturum planlaması ve fatura için kullanılır; üçüncü taraflarla
              paylaşılmaz. Detaylar:{" "}
              <a href="/kosullar" className="text-primary underline underline-offset-4">
                koşul ve politikalar
              </a>
              .
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-fg-muted transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
            >
              ← Geri
            </button>
          ) : null}

          {step < 4 ? (
            <button
              type="button"
              disabled={
                (step === 1 && !draft.requestType) ||
                (step === 2 && !draft.topicId) ||
                (step === 3 && (!draft.date || !draft.time))
              }
              onClick={() => go(step + 1)}
              className="min-h-11 rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-bg transition-colors duration-(--duration-fast) hover:bg-fg disabled:pointer-events-none disabled:opacity-50"
            >
              Devam et →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-bg transition-colors duration-(--duration-fast) hover:bg-fg disabled:pointer-events-none disabled:opacity-60"
            >
              {submitting ? "Ödeme sayfası hazırlanıyor…" : `Stripe ile öde · ${summaryPrice()}`}
            </button>
          )}

          {step === 4 && !submitting ? (
            <button type="button" onClick={() => go(3)} className="font-mono text-xs uppercase tracking-wide text-fg-muted hover:text-primary">
              slotu değiştir
            </button>
          ) : null}
        </div>
      </form>

      <Panel as="aside" className="lg:sticky lg:top-24 p-5">
        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-primary">Şartname</p>
        <dl>
          <DataRow label="Tür" value={type?.label ?? "—"} />
          <DataRow label="Konu" value={topic ? `${topic.code} · ${topic.title}` : "—"} />
          <DataRow label="Süre" value={duration ? formatDuration(duration.minutes) : "—"} />
          <DataRow
            label="Slot"
            value={draft.date && draft.time ? `${trMonthDay(draft.date)} ${draft.time.replace(":", ".")}` : "—"}
          />
          <DataRow label="Zaman" value="Europe/Istanbul" />
          <DataRow label="Tutar" value={summaryPrice()} tone="accent" />
        </dl>
        {topic ? (
          <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
            {topic.outcomes.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-fg-muted">
                <span aria-hidden="true" className="font-mono text-xs text-success">
                  +
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Chip tone="neutral">Stripe</Chip>
          <Chip tone="neutral">24 saat önce ücretsiz iptal</Chip>
        </div>
      </Panel>
    </div>
  );
}
