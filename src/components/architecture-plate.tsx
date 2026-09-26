import { cn } from "@/lib/cn";
import type { Composed } from "@/lib/blueprint";

/**
 * Ajan sisteminin şematik levhası — blueprint kuralı: ince çizgi, mono etiket,
 * köşeli kutular, dekoratif yuvarlatma yok. Aktif düğümler dolu, pasifler kesikli.
 */

type NodeId =
  | "girdi"
  | "baglam"
  | "model"
  | "arac"
  | "kapi"
  | "iz"
  | "eval"
  | "soyutlama"
  | "gozlemci"
  | "yonetici"
  | "kumhavuzu"
  | "veri";

type Box = { x: number; y: number; w: number; label: string; sub: string };

const H = 46;

const NODES: Record<NodeId, Box> = {
  girdi: { x: 16, y: 150, w: 92, label: "GİRDİ", sub: "iş / soru" },
  baglam: { x: 136, y: 150, w: 104, label: "BAĞLAM", sub: "hafıza + bağlam" },
  model: { x: 268, y: 150, w: 116, label: "MODEL", sub: "seçim burada" },
  arac: { x: 412, y: 150, w: 112, label: "ARAÇLAR", sub: "dispatcher" },
  kapi: { x: 552, y: 150, w: 104, label: "ONAY KAPISI", sub: "yan etki" },
  veri: { x: 136, y: 44, w: 104, label: "VERİ", sub: "SQL / RAG" },
  yonetici: { x: 268, y: 44, w: 116, label: "YÖNETİCİ", sub: "böl–topla" },
  gozlemci: { x: 412, y: 44, w: 112, label: "GÖZLEMCİ", sub: "ayrı model" },
  kumhavuzu: { x: 552, y: 44, w: 104, label: "KUM HAVUZU", sub: "izole koşum" },
  soyutlama: { x: 136, y: 272, w: 104, label: "SOYUTLAMA", sub: "tek arayüz" },
  eval: { x: 268, y: 272, w: 116, label: "ALTIN SET", sub: "ölç–kapıya al" },
  iz: { x: 412, y: 272, w: 112, label: "İZ", sub: "her karar 1 satır" },
};

const RAIL: readonly NodeId[] = ["girdi", "baglam", "model", "arac", "kapi"];

const SPINES: readonly [NodeId, NodeId][] = [
  ["veri", "baglam"],
  ["yonetici", "model"],
  ["gozlemci", "arac"],
  ["kumhavuzu", "arac"],
  ["soyutlama", "model"],
  ["eval", "iz"],
  ["kapi", "iz"],
];

function center(node: Box) {
  return { cx: node.x + node.w / 2, top: node.y, bottom: node.y + H, left: node.x, right: node.x + node.w };
}

function activeFor(composed: Composed): ReadonlySet<string> {
  const set = new Set<string>(composed.activeNodes);
  // Araç düğümleri Türkçe anahtarlarla geldi; şema anahtarlarına köprü.
  if (set.has("veri")) set.add("veri");
  if (set.has("kumhavuzu")) set.add("kumhavuzu");
  if (set.has("tarayici") || set.has("web")) set.add("kumhavuzu");
  return set;
}

export function ArchitecturePlate({
  composed,
  className,
}: {
  readonly composed: Composed;
  readonly className?: string;
}) {
  const active = activeFor(composed);
  const modelLabel = composed.provider.name;
  const modelSub = `${composed.model.name} · ${composed.model.strength}`;
  const gateOn = active.has("kapi");

  return (
    <figure className={cn("relative", className)}>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs tracking-wide text-muted uppercase">
        <span>LEVHA 01 · AJAN DÖNGÜSÜ</span>
        <span>
          ÖLÇEK 1:1 · {composed.tools.length} ARAÇ · OTONOMİ {composed.autonomy.level}
        </span>
      </figcaption>

      <svg
        viewBox="0 0 672 340"
        role="img"
        aria-label={`Seçtiğiniz mimarinin şeması: ${modelLabel}, ${composed.tools
          .map((tool) => tool.name)
          .join(", ")}, ${composed.autonomy.name}. Kontrol kapısı ${gateOn ? "var" : "yok"}.`}
        className="mt-3 w-full"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {/* ray (ana akış) */}
        <path
          d={`M ${NODES.girdi.x + NODES.girdi.w} 173 H ${NODES.kapi.x + NODES.kapi.w}`}
          className="bp-draw"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.9"
        />
        {/* döngü: araçlardan bağlama geri */}
        <path
          d={`M ${center(NODES.arac).cx} ${center(NODES.arac).bottom} V 232 H ${center(NODES.baglam).cx} V ${center(NODES.baglam).bottom}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="6 6"
          className="bp-flow"
        />
        <text x={center(NODES.baglam).cx + 8} y={226} fontSize="9" fill="var(--accent)">
          tur 2…{composed.autonomy.level === 0 ? "1" : composed.autonomy.level === 1 ? "3" : composed.autonomy.level === 2 ? "8" : "N"}
        </text>

        {/* uydu bağlantıları */}
        {SPINES.map(([from, to]) => {
          const a = center(NODES[from]);
          const b = center(NODES[to]);
          const on = active.has(from) && active.has(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={a.cx}
              y1={a.bottom}
              x2={b.cx}
              y2={b.top}
              stroke={on ? "var(--primary)" : "var(--grid-strong)"}
              strokeWidth="1"
              strokeDasharray={on ? undefined : "3 4"}
              opacity={on ? 0.75 : 0.35}
            />
          );
        })}

        {/* düğümler */}
        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const node = NODES[id];
          const on = active.has(id);
          const isRail = RAIL.includes(id);
          const showLabel = id === "model" ? modelLabel : node.label;
          const showSub = id === "model" ? modelSub : node.sub;
          return (
            <g key={id} opacity={on ? 1 : 0.42}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={H}
                fill={on ? "var(--surface)" : "transparent"}
                stroke={on ? (id === "kapi" && !gateOn ? "var(--danger)" : "var(--primary)") : "var(--grid-strong)"}
                strokeWidth="1"
                strokeDasharray={on ? undefined : "4 3"}
              />
              <text
                x={node.x + 10}
                y={node.y + 19}
                fontSize="10"
                fontWeight="600"
                fill={on ? "var(--fg)" : "var(--muted)"}
              >
                {showLabel.length > 13 ? `${showLabel.slice(0, 12)}…` : showLabel}
              </text>
              <text x={node.x + 10} y={node.y + 34} fontSize="8.5" fill="var(--muted)">
                {showSub.length > 17 ? `${showSub.slice(0, 16)}…` : showSub}
              </text>
              {isRail && on ? <rect x={node.x} y={node.y} width="3" height={H} fill="var(--primary)" /> : null}
            </g>
          );
        })}

        {/* ölçü işaretleri */}
        <g stroke="var(--grid-strong)" strokeWidth="1">
          <line x1="16" y1="330" x2="656" y2="330" />
          <line x1="16" y1="325" x2="16" y2="335" />
          <line x1="656" y1="325" x2="656" y2="335" />
        </g>
        <text x="320" y="325" fontSize="8.5" fill="var(--muted)" textAnchor="middle">
          {gateOn ? "YAZMA YETKİSİ KAPIDA" : "KAPI YOK — OKUMA AĞIRLIKLI"}
        </text>
      </svg>
    </figure>
  );
}
