"use client";

import { useMemo, useState } from "react";

import { ArchitecturePlate } from "@/components/architecture-plate";
import { Chip, Panel } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  autonomies,
  compose,
  defaultSpec,
  describeSpec,
  evalModes,
  providerById,
  providers,
  suggestTopicId,
  tools,
  type Spec,
} from "@/lib/blueprint";
import { formatDuration } from "@/lib/format";

/**
 * "Ajan Sistemi Kurucusu" — sitenin kimliği.
 * Ziyaretçi sağlayıcı → model → araçlar → otonomi → ölçme seçer; şema, mimari not,
 * "kendi içinde kur" listesi, risk bandı ve oturum tahmini gerçek state'ten üretilir.
 * Amaç: eğitimin tezini (seçmek yetmez, seçimi yönetmek gerekir) çalışır halde göstermek.
 */

function OptionRow({
  legend,
  hint,
  children,
}: {
  readonly legend: string;
  readonly hint?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 pb-1">
        <span className="font-mono text-xs tracking-wide text-primary uppercase">{legend}</span>
        {hint ? <span className="font-mono text-xs text-muted">{hint}</span> : null}
      </legend>
      {children}
    </fieldset>
  );
}

function Segment({
  name,
  options,
  value,
  onChange,
}: {
  readonly name: string;
  readonly options: readonly { id: string; label: string; sub?: string }[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-h-11 flex-col items-start justify-center rounded-md border px-3 py-1 text-left transition-colors duration-(--duration-fast)",
              active
                ? "border-primary bg-primary/10 text-fg"
                : "border-border bg-transparent text-muted hover:border-primary hover:text-fg",
            )}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            {option.sub ? <span className="font-mono text-[0.625rem] text-muted">{option.sub}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function AgentComposer() {
  const [spec, setSpec] = useState<Spec>(defaultSpec);
  const composed = useMemo(() => compose(spec), [spec]);
  const provider = providerById(spec.providerId);

  function toggleTool(id: string) {
    setSpec((prev) => ({
      ...prev,
      toolIds: prev.toolIds.includes(id)
        ? prev.toolIds.filter((toolId) => toolId !== id)
        : [...prev.toolIds, id],
    }));
  }

  const toneClass = {
    success: "text-success",
    accent: "text-accent",
    danger: "text-danger",
  }[composed.band.tone];

  return (
    <Panel className="bg-surface p-4 sm:p-6 lg:p-8">
      {/* Taban izler de minmax(0,…) — aksi halde 320px'de plakanın min-content'i
          ızgarayı genişletip yatay taşma üretiyor (ölçülen: 383px). */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ── Seçim masası ── */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs tracking-wide text-muted uppercase">
              KURUCU · 05 KARAR
            </p>
            <p className="font-mono text-xs text-muted">her seçim şemayı değiştirir</p>
          </div>

          <OptionRow legend="01 · Sağlayıcı" hint="kilitlenme riski burada başlar">
            <Segment
              name="Sağlayıcı"
              value={spec.providerId}
              options={providers.map((entry) => ({ id: entry.id, label: entry.name, sub: entry.kind }))}
              onChange={(id) =>
                setSpec((prev) => {
                  const next = providerById(id);
                  const keep = next.models.some((model) => model.id === prev.modelId)
                    ? prev.modelId
                    : (next.models[1]?.id ?? next.models[0]?.id ?? "dengeli");
                  return { ...prev, providerId: id, modelId: keep };
                })
              }
            />
          </OptionRow>

          <OptionRow legend="02 · Model kademesi" hint={`${provider.models.length} seçenek`}>
            <Segment
              name="Model kademesi"
              value={spec.modelId}
              options={provider.models.map((model) => ({
                id: model.id,
                label: model.name,
                sub: `${model.strength} · maliyet ${model.cost}/3 · ${model.window}`,
              }))}
              onChange={(id) => setSpec((prev) => ({ ...prev, modelId: id }))}
            />
          </OptionRow>

          <OptionRow legend="03 · Araçlar" hint={`${composed.tools.length} seçili`}>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool) => {
                const on = spec.toolIds.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-md border px-3 py-1 text-left text-sm transition-colors duration-(--duration-fast)",
                      on
                        ? "border-accent bg-accent/10 text-fg"
                        : "border-border text-muted hover:border-accent hover:text-fg",
                    )}
                  >
                    <span className="font-mono text-xs text-muted">{tool.code}</span>
                    {tool.name}
                    <span aria-hidden="true" className="font-mono text-xs text-muted">
                      {on ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          </OptionRow>

          <OptionRow legend="04 · Otonomi" hint={`${composed.autonomy.level}/3 · ${composed.autonomy.name}`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {autonomies.map((option) => {
                const active = option.id === spec.autonomyId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSpec((prev) => ({ ...prev, autonomyId: option.id }))}
                    className={cn(
                      "flex min-h-11 flex-col justify-center rounded-md border px-3 py-1 text-left transition-colors duration-(--duration-fast)",
                      active ? "border-primary bg-primary/10" : "border-border text-muted hover:border-primary hover:text-fg",
                    )}
                  >
                    <span className="font-mono text-xs text-primary">0{option.level}</span>
                    <span className="text-sm font-semibold">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </OptionRow>

          <OptionRow legend="05 · Ölçme" hint="eval yoksa karar yok, umut var">
            <Segment
              name="Ölçme"
              value={spec.evalId}
              options={evalModes.map((mode) => ({ id: mode.id, label: mode.name }))}
              onChange={(id) => setSpec((prev) => ({ ...prev, evalId: id }))}
            />
          </OptionRow>
        </div>

        {/* ── Çıktı levhası ── */}
        <div className="space-y-5">
          <ArchitecturePlate composed={composed} />

          <dl className="grid grid-cols-2 gap-3 border-y border-border py-3 sm:grid-cols-4">
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-fg-muted">Risk bandı</dt>
              <dd className={cn("text-lg font-semibold", toneClass)}>
                {composed.band.label}
                <span className="ml-1 font-mono text-xs text-muted">{composed.risk}</span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-fg-muted">İçeride kurulan</dt>
              <dd className="text-lg font-semibold">
                {composed.ownedShare}%
                <span className="ml-1 font-mono text-xs text-muted">{composed.layers.filter((layer) => layer.owner === "içeride").length}/6 katman</span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-fg-muted">Maliyet endeksi</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {composed.costIndex}
                <span className="ml-1 font-mono text-xs text-muted">/14</span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-wide text-fg-muted">Oturum tahmini</dt>
              <dd className="text-lg font-semibold">{formatDuration(composed.estimateMinutes)}</dd>
            </div>
          </dl>

          <section aria-labelledby="mimari-not" className="space-y-2">
            <h3 id="mimari-not" className="font-mono text-xs tracking-wide text-primary uppercase">
              MİMARİ NOT · otomatik üretim
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed">
              {composed.notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 block size-1 shrink-0 bg-primary" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="kur-listesi" className="space-y-2">
            <h3 id="kur-listesi" className="font-mono text-xs tracking-wide text-accent uppercase">
              KENDİ İÇİNDE KUR · kontrol listesi
            </h3>
            <ul className="grid gap-1 sm:grid-cols-2">
              {composed.checklist.map((item) => (
                <li key={item} className="flex gap-2 border-b border-border/50 py-1 text-sm last:border-0">
                  <span aria-hidden="true" className="font-mono text-xs text-accent">[ ]</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="katmanlar" className="space-y-2">
            <h3 id="katmanlar" className="font-mono text-xs tracking-wide text-muted uppercase">
              KATMAN SAHİPLİĞİ
            </h3>
            <ul className="divide-y divide-border/60 border border-border rounded-md">
              {composed.layers.map((layer) => (
                <li key={layer.name} className="flex items-start gap-3 px-3 py-2">
                  <span className="min-w-16 font-mono text-xs uppercase tracking-wide">{layer.name}</span>
                  <Chip tone={layer.owner === "içeride" ? "success" : "accent"}>{layer.owner}</Chip>
                  <span className="flex-1 text-sm text-muted">{layer.note}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <a
              href={`/rezervasyon?tip=destek-egitim&konu=${suggestTopicId(spec)}&sure=${composed.estimateMinutes}&not=${encodeURIComponent(describeSpec(composed))}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-bg transition-colors duration-(--duration-fast) hover:bg-primary/85"
            >
              Bu mimariyi birlikte kuralım <span aria-hidden="true">→</span>
            </a>
            <p className="font-mono text-xs text-muted">
              Seçtiğiniz kademe: {composed.provider.name} / {composed.model.name} ·{" "}
              {composed.tools.length} araç · otonomi {composed.autonomy.level}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
