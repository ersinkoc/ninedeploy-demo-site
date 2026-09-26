/**
 * "Ajan Sistemi Kurucusu" — sitenin merkezi etkileşimi.
 * Veri + saf hesaplama burada, render bileşende. Sunucu/istemci ortaksız kullanılabilir.
 *
 * Model adlarını kasıtlı olarak *kabiliyet katmanı* olarak tutuyorum (amiral/dengeli/hızlı…):
 * sağladığın ad bugünün doğrusu, yarının yanlış olur; katman doğru kalır.
 */

export interface ModelTier {
  id: string;
  name: string;
  strength: string;
  /** 1 düşük … 3 yüksek — etiket "maliyet endeksi" olarak gösterilir. */
  cost: 1 | 2 | 3;
  window: string;
  note: string;
}

export interface ProviderOption {
  id: string;
  name: string;
  kind: "bulut" | "yerel" | "karma";
  /** Sağlayıcı değişince ne kadar şey el yakar. */
  lockIn: string;
  note: string;
  models: readonly ModelTier[];
  checklist: readonly string[];
}

export interface ToolOption {
  id: string;
  code: string;
  name: string;
  risk: number;
  advice: string;
  checklist: readonly string[];
  /** Şemada hangi düğüm aktif olur. */
  node?: string;
}

export interface AutonomyOption {
  id: string;
  level: 0 | 1 | 2 | 3;
  name: string;
  description: string;
  risk: number;
  gates: readonly string[];
  extraMinutes: number;
  checklist: readonly string[];
}

export interface EvalOption {
  id: string;
  name: string;
  advice: string;
  risk: number;
  checklist: readonly string[];
}

export interface Spec {
  providerId: string;
  modelId: string;
  toolIds: readonly string[];
  autonomyId: string;
  evalId: string;
}

export interface Layer {
  name: string;
  owner: "içeride" | "kiralık";
  note: string;
}

export interface Composed {
  provider: ProviderOption;
  model: ModelTier;
  autonomy: AutonomyOption;
  evalOption: EvalOption;
  tools: readonly ToolOption[];
  risk: number;
  band: { label: "Düşük" | "Orta" | "Yüksek"; tone: "success" | "accent" | "danger" };
  layers: readonly Layer[];
  ownedShare: number;
  notes: readonly string[];
  checklist: readonly string[];
  estimateMinutes: number;
  estimateLabel: string;
  activeNodes: ReadonlySet<string>;
  costIndex: number;
}

/* ── Sağlayıcılar ─────────────────────────────────────────────────── */

const tiers = (notes: Partial<Record<string, string>>): readonly ModelTier[] =>
  modelTiers.map((tier) => ({ ...tier, note: notes[tier.id] ?? tier.note }));

const modelTiers: readonly ModelTier[] = [
  { id: "amiral", name: "Amiral gemisi", strength: "derin akıl yürütme", cost: 3, window: "büyük", note: "Pahalı ve yavaş; sadece kararı zor işler için." },
  { id: "dengeli", name: "Dengeli", strength: "günlük işler", cost: 2, window: "büyük", note: "Üretim iş yükünün çoğu burada durur." },
  { id: "hizli", name: "Hızlı", strength: "düşük maliyet", cost: 1, window: "orta", note: "Sınıflandırma, özetleme, ilk tur eleme." },
  { id: "uzun", name: "Uzun bağlam", strength: "doküman yığını", cost: 2, window: "çok büyük", note: "Bağlamı geri yükleme maliyetini düşürür, token maliyetini yükseltir." },
  { id: "kod", name: "Kod / ajan modu", strength: "çok adımlı araç kullanımı", cost: 2, window: "büyük", note: "Araç şemalarını en az bozan kategori." },
];

export const providers: readonly ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    kind: "bulut",
    lockIn: "Araç çağrı biçimi ve akış olayları kendi sözdizimine yaslanır.",
    note: "En kalabalık araç arayüzü; ama hata tiplerini kendi sözleşmenize indirgemeden çıkmayın.",
    models: tiers({
      amiral: "Zor kararlar için; her işe bunu bağlamayın.",
      kod: "Araç yoğun iş akışlarında en tutarlı tur davranışı.",
    }),
    checklist: [
      "Yapılandırılmış çıktı şemasını her araç çağrısında zorla",
      "Akış olaylarını tek bir tüketicide topla (her yerde ayrı parse etme)",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    kind: "bulut",
    lockIn: "Araç kullanımı ve sistem talimatı katı; taşırken bu iki sözleşme değişir.",
    note: "Uzun araç zincirlerinde ve talimat sadakatinde güçlü. Kontrol kapılarını prompt'ta değil kodda tutma alışkanlığına çok uygun.",
    models: tiers({
      dengeli: "Araç yoğun orta işler için güvenli varsayılan.",
      kod: "Çok adımlı düzeltme döngülerinde en az yeniden yazma.",
    }),
    checklist: [
      "Talimatı katmanla: sabit politika + işe özel ek, tek dev metin değil",
      "Araç başına timeout ve tur tavanı koy (zincir uzayınca maliyet sessiz artar)",
    ],
  },
  {
    id: "google",
    name: "Google",
    kind: "bulut",
    lockIn: "Çok modlu girdi ve devasa pencere kolay alıştırır; pencere bedava değildir.",
    note: "Geniş pencere, çok modlu girdi. Uzun doküman işlerinde RAG yerine ham sayfayı koymak cazip gelir — maliyeti ölçerek yapın.",
    models: tiers({
      uzun: "Yüzlerce sayfalık mevzuat/uygulama taraması için mantıklı.",
      hizli: "İlk tur eleme ve etiketleme işleri.",
    }),
    checklist: [
      "Pencereyi doldurmadan önce bütçe defteri tut (kaç token, nereye gidiyor)",
      "Çok modlu girdiyi yalnızca metinle çözülmüyorsa kullan",
    ],
  },
  {
    id: "local",
    name: "Yerel / açık ağırlık",
    kind: "yerel",
    lockIn: "Kilitlenmezsiniz; ama operasyon yükü sizin olur.",
    note: "Veri dışarı çıkmıyor, maliyet tahmin edilebilir. Bedeli: kalite boşluğunu ve donanımı siz yönetirsiniz.",
    models: tiers({
      dengeli: "Açık modellerde en iyi kalite/bedel noktası; araç kullanımı için eğitilmiş olanı seçin.",
      hizli: "Tek sunucuda bile rahat döner; ilk eleme katmanı olarak ideal.",
      kod: "Araç şeması desteği modelden modele çok değişir — ölçmeden geçmeyin.",
    }),
    checklist: [
      "Aynı altın örnek setini bulut modeliyle karşılaştırmalı koş (kabiliyet düşüşü rakamla görünsün)",
      "Çıktı şeması bozulduğunda yedek bulut sağlayıcıya devir planı yaz",
      "Sunucu tarafında istek kuyruğu ve azami eşzamanlılık sınırla",
    ],
  },
  {
    id: "blend",
    name: "Karma (görev başına seçim)",
    kind: "karma",
    lockIn: "Kilitlenme en düşük; soyutlama katmanı olmadan bakım yükü en yüksek.",
    note: "İş başına farklı model: ucuz eleme, pahalı karar. Bu sitenin vaadi tam olarak bu — seçimi tek dosyadan yönetmek.",
    models: tiers({
      dengeli: "Bu modda tek model seçmiyorsunuz; rotayı ayar dosyası seçiyor.",
    }),
    checklist: [
      "Rota tablosunu ayar dosyasına yaz: iş → sağlayıcı → model → tavan",
      "Sağlayıcılar arası kalite farkını aynı eval setiyle ölç",
    ],
  },
];

/* ── Araçlar ──────────────────────────────────────────────────────── */

export const tools: readonly ToolOption[] = [
  {
    id: "data",
    code: "A1",
    name: "Veriye erişim (SQL / RAG)",
    risk: 8,
    node: "veri",
    advice: "Ajanıza tablo değil, sorgu sözleşmesi verin. Serbest SQL yerine parametreli okuma araçları; RAG'i tek başına hafıza sanmayın.",
    checklist: ["Okuma araçlarına satır/limit zorunlu", "Şemayı araca değil ayara yaz", "Sonuç küçültülmüş mü (özet mi) — ikisini de etiketle"],
  },
  {
    id: "code",
    code: "A2",
    name: "Kod çalıştırma (sandbox)",
    risk: 14,
    node: "kumhavuzu",
    advice: "Çalıştırma yetkisi ajanın en büyük sıçrama tahtası ve en büyük deliği. Ağsız, dosyasız, süreli bir kum havuzu olmadan açmayın.",
    checklist: ["Kısa süre ve bellek sınırı olan kapalı ortam", "Rastgele çıkışı değil, yapılandırılmış sonucu geri ver", "Çalıştırma günlüğünü sakla (yeniden oynatma için)"],
  },
  {
    id: "web",
    code: "A3",
    name: "Web araması",
    risk: 6,
    node: "web",
    advice: "Arama çıktısı güvenilmez veridir: kaynak, tarih ve alıntı olmadan modele yedirme. Aksi halde ajanınız başkasının enjeksiyonunu tekrar eder.",
    checklist: ["Kaynak + erişim tarihi zorunlu alan", "İçerikteki talimatları veri say (komut enjeksiyonu testi yaz)"],
  },
  {
    id: "browser",
    code: "A4",
    name: "Tarayıcı otomasyonu",
    risk: 16,
    node: "tarayici",
    advice: "Kırılgan ve pahalı. Son çare olarak kullanın: önce API var mı diye sorun, yoksa ekran görüntüsü + erişilebilirlik ağacıyla sınırlayın.",
    checklist: ["Oturum kapsama alanını daralt (tek site, tek hedef)", "Yazma eylemlerini (gönder, öde) insan onayına bağla"],
  },
  {
    id: "api",
    code: "A5",
    name: "İç API çağrıları",
    risk: 12,
    node: "icapi",
    advice: "İç araçlar, dış araçlardan daha tehlikelidir: yetkiler sizin adınıza. Kullanıcı kimliğini ajana devretmeyin, kapsamı daraltılmış servis anahtarı verin.",
    checklist: ["Ajan başına ayrı, az yetkili kimlik", "Yan etkisi olan uçlarda idempotens anahtarı", "Hata sözlüğü: 4xx'te modeli tekrar denemeye zorlama"],
  },
  {
    id: "write",
    code: "A6",
    name: "Yazma işlemleri (commit, e-posta, fatura)",
    risk: 22,
    node: "yazma",
    advice: "Yazma yetkisi olan her ajan bir onay kapısı ister. Kapı prompt'ta değil, araç dağıtıcısında olur; “lütfen onay iste” bir kontrol değildir.",
    checklist: ["Kurulmuş insan onay kapısı (taslak → onay → uygula)", "Geri alma yolu olmayan işi ajana yaptırma", "Onay başına zaman aşımı ve otomatik iptal"],
  },
  {
    id: "flow",
    code: "A7",
    name: "İş akışı tetikleme (kuyruk / cron)",
    risk: 10,
    node: "kuyruk",
    advice: "Ajanı bir turda bitmeye zorlamak yerine kuyruğa iş bırakın: uzun işler böyle dayanır. Yalnız yeniden tetikleme tavanı koyun, yoksa sonsuz döngü sizin olur.",
    checklist: ["Tur/tekrar tavanı + tavan aşımında insana devir", "Kuyruk mesajı yalnızca kimlik taşısın, bağlam değil"],
  },
];

/* ── Otonomi ──────────────────────────────────────────────────────── */

export const autonomies: readonly AutonomyOption[] = [
  {
    id: "oneri",
    level: 0,
    name: "Öneri modu",
    description: "Ajan planı yazar, insan uygular. Araç çağrısı yok ya da salt okunur.",
    risk: 0,
    gates: ["Her adım insan onaylı"],
    extraMinutes: 0,
    checklist: ["Öneriyi tek ekranda göster (kopyala-uygula)", "Uygulama sonucunu geri besle (ajan öğrensin)"],
  },
  {
    id: "yari",
    level: 1,
    name: "Yarı-otonom",
    description: "Okuma ve hesaplama araçları serbest; yazma ve gönderme kapıda.",
    risk: 6,
    gates: ["Yazma araçları onay kapısında"],
    extraMinutes: 30,
    checklist: ["Kapı listesini kodda sabitle, modele bırakma", "Onay ekranında ne değişeceğini diff olarak göster"],
  },
  {
    id: "otonom",
    level: 2,
    name: "Otonom döngü + gözlemci",
    description: "Kendi turunu kurar; eşikte (tur, maliyet, güven) insana devreder.",
    risk: 16,
    gates: ["Tur ve maliyet tavanı", "Eşik aşımında insan devri"],
    extraMinutes: 60,
    checklist: ["Gözlemci ajanı: ayrı model, salt değerlendirme", "Devir anında bağlamı özetleyip bırak, çöpe atma"],
  },
  {
    id: "suru",
    level: 3,
    name: "Çok ajanlı (yönetici + uzmanlar)",
    description: "Bir yönetici işi böler, uzmanlar çalışır. Güçlüdür ama hata yüzeyi katlanarak artar.",
    risk: 26,
    gates: ["Ajanlar arası sözleşme", "Yönetici bütçe tavanı"],
    extraMinutes: 120,
    checklist: ["Alt ajanlara ortak araç seti yerine daraltılmış set ver", "Yöneticinin maliyetini işin maliyetinden ayrı ölç", "Bütün alt ajanları aynı eval setinden geçir"],
  },
];

/* ── Ölçme ────────────────────────────────────────────────────────── */

export const evalModes: readonly EvalOption[] = [
  {
    id: "yok",
    name: "Şimdilik ölçmeyeceğim",
    advice: "Bu bir tercih değil, erteleme. Prompt değiştirdiğinizde neyi bozduğunuzu bilemezsiniz — ki çoğu iş orada batar.",
    risk: 18,
    checklist: ["Bari 10 elle yazılmış girdi/beklenen çiftini dosyaya koyun"],
  },
  {
    id: "altin",
    name: "Altın örnek seti (25)",
    advice: "25 gerçek örnek + elle yazılmış beklenen sonuç. Değişiklik öncesi koşun; puan düşüşü yayına giriş demektir.",
    risk: 0,
    checklist: ["Örnekleri kenar durumlarla doldur (boş, çok uzun, çelişkili)", "Puanlayıcıyı koda yaz, modele değerlendirme yaptırma (başlangıçta)"],
  },
  {
    id: "ci",
    name: "CI kapısı + gözetleme",
    advice: "Eval seti her birleştirmede koşar; üretimde her karar satırı toplanır ve haftalık örnekleme geri beslenir.",
    risk: -6,
    checklist: ["Kapı kırmızıysa birleştirme yok — istisna akışı yaz", "Üretimden kaç örnek geri besliyorsunuz, sayıyı sabitleyin"],
  },
];

/* ── Sabitler ve yardımcı seçimler ───────────────────────────────── */

export const defaultSpec: Spec = {
  providerId: "anthropic",
  modelId: "dengeli",
  toolIds: ["data", "api"],
  autonomyId: "yari",
  evalId: "altin",
};

export const providerById = (id: string): ProviderOption =>
  providers.find((p) => p.id === id) ?? (providers[1] as ProviderOption);

export const toolById = (id: string): ToolOption | undefined => tools.find((t) => t.id === id);

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const estimateSteps = [60, 90, 120, 180, 240] as const;

function snapEstimate(minutes: number): (typeof estimateSteps)[number] {
  for (const step of estimateSteps) if (minutes <= step) return step;
  return estimateSteps[estimateSteps.length - 1] ?? 240;
}

/** Seçimlerden şema + not + kontrol listesi + tahmin üretir. Saf fonksiyon. */
export function compose(spec: Spec): Composed {
  const provider = providerById(spec.providerId);
  const model = provider.models.find((m) => m.id === spec.modelId) ?? (provider.models[1] as ModelTier);
  const autonomy = autonomies.find((a) => a.id === spec.autonomyId) ?? (autonomies[1] as AutonomyOption);
  const evalOption = evalModes.find((e) => e.id === spec.evalId) ?? (evalModes[1] as EvalOption);
  const chosen = spec.toolIds.map(toolById).filter((t): t is ToolOption => t !== undefined);

  const toolRisk = chosen.reduce((sum, tool) => sum + tool.risk, 0);
  const providerRisk = provider.kind === "yerel" ? -4 : provider.kind === "karma" ? -2 : 4;
  const risk = clamp(autonomy.risk + toolRisk + evalOption.risk + providerRisk, 0, 100);

  const band: Composed["band"] =
    risk <= 28 ? { label: "Düşük", tone: "success" } : risk <= 55 ? { label: "Orta", tone: "accent" } : { label: "Yüksek", tone: "danger" };

  const layers: Layer[] = [
    {
      name: "Model katmanı",
      owner: provider.kind === "yerel" ? "içeride" : "kiralık",
      note: provider.kind === "yerel" ? "Ağırlık sizde; soyutlamayı yine de yazın, yarın ikinci sağlayıcı gelir." : "Soyutlama katmanı olmadan her çağrı bu sağlayıcının sözdizimini taşır.",
    },
    { name: "Araç dağıtıcısı", owner: "içeride", note: "Şema, yetki, hata sözlüğü — hiçbir sağlayıcı bunu sizin adınıza tasarlamıyor." },
    { name: "Bağlam ve hafıza", owner: "içeride", note: "Ne kadarını geri yüklüyorsunuz, ne kadarını yeniden üretiyorsunuz." },
    {
      name: "Kontrol kapıları",
      owner: chosen.some((t) => t.risk >= 12) ? "içeride" : "kiralık",
      note: chosen.some((t) => t.risk >= 12) ? "Yan etkisi olan her araç burada durur; modele bırakılmaz." : "Şimdilik kapı gerekmiyor; riskli araç eklediğinizde bunu kodda açın.",
    },
    { name: "Gözetme ve iz", owner: "içeride", note: "Her karar bir satır: girdi, çıktı, araç, token, maliyet." },
    {
      name: "Değerlendirme",
      owner: spec.evalId === "yok" ? "kiralık" : "içeride",
      note: spec.evalId === "yok" ? "Ölçmediğiniz katman size değil, şansınıza aittir." : "Altın set ve kapı sizin; model değiştirdiğinizde kıyas sizde kalır.",
    },
  ];
  const owned = layers.filter((layer) => layer.owner === "içeride").length;
  const ownedShare = Math.round((owned / layers.length) * 100);

  const notes: string[] = [
    `${provider.name} · ${model.name} (${model.strength}): ${model.note}`,
    `${provider.name} için ${model.name} ile araçları birlikte düşün: ${provider.lockIn}`,
  ];
  for (const tool of chosen) notes.push(`${tool.code} ${tool.name}: ${tool.advice}`);
  notes.push(`Otonomi “${autonomy.name}”: ${autonomy.description} Kapılar: ${autonomy.gates.join(" · ")}.`);
  notes.push(`Ölçme: ${evalOption.advice}`);

  const checklist = Array.from(
    new Set([
      ...provider.checklist,
      ...chosen.flatMap((tool) => tool.checklist),
      ...autonomy.checklist,
      ...evalOption.checklist,
    ]),
  ).slice(0, 12);

  const rawMinutes = 60 + autonomy.extraMinutes + chosen.length * 15 + (provider.kind === "yerel" ? 30 : 0);
  const estimateMinutes = snapEstimate(rawMinutes);

  const activeNodes = new Set<string>(["girdi", "baglam", "model", "arac", "iz"]);
  for (const tool of chosen) if (tool.node) activeNodes.add(tool.node);
  if (autonomy.level >= 1 || chosen.some((t) => t.risk >= 12)) activeNodes.add("kapi");
  if (autonomy.level >= 2) activeNodes.add("gozlemci");
  if (autonomy.level >= 3) activeNodes.add("yonetici");
  if (spec.evalId !== "yok") activeNodes.add("eval");
  if (provider.kind === "yerel" || provider.kind === "karma") activeNodes.add("soyutlama");

  const costIndex = clamp(
    model.cost * 2 + chosen.length + autonomy.level * 2 + (provider.kind === "yerel" ? -1 : 0),
    1,
    14,
  );

  return {
    provider,
    model,
    autonomy,
    evalOption,
    tools: chosen,
    risk,
    band,
    layers,
    ownedShare,
    notes,
    checklist,
    estimateMinutes,
    estimateLabel: `${estimateMinutes} dk'lık tek oturum${estimateMinutes >= 180 ? " ya da ikiye böl" : ""}`,
    activeNodes,
    costIndex,
  };
}

/** Seçilen araç/otonomi kümesine göre en uygun eğitim modülü (CTA derin bağlantısı için). */
const TOPIC_BY_TOOL: Readonly<Record<string, string>> = {
  data: "m4-hafiza-baglam",
  code: "m3-arac-tasarimi",
  web: "m5-kontrol-guvenlik",
  browser: "m5-kontrol-guvenlik",
  api: "m3-arac-tasarimi",
  write: "m5-kontrol-guvenlik",
  flow: "m6-degerlendirme",
};

export function suggestTopicId(spec: Spec): string {
  if (spec.autonomyId === "suru") return "m6-degerlendirme";
  for (const id of spec.toolIds) {
    const mapped = TOPIC_BY_TOOL[id];
    if (mapped) return mapped;
  }
  return "m1-anatomi";
}

/** Kurucunun seçtiği mimariyi tek satırda özetler; rezervasyon not alanına taşınır. */
export function describeSpec(composed: Composed): string {
  const tools = composed.tools.length > 0 ? composed.tools.map((tool) => tool.name).join(", ") : "araçsız";
  return (
    `Kurucudan: ${composed.provider.name} / ${composed.model.name} · araçlar: ${tools} · ` +
    `otonomi: ${composed.autonomy.name} · ölçme: ${composed.evalOption.name}. ` +
    `Bunu kendi kod tabanımda kurmak istiyorum.`
  );
}

/** Kurucunun mono şeridi: sağlayıcı/model adı telif riski taşımasın diye metin. */
export const tickerWords: readonly string[] = [
  "SAĞLAYICI → MODEL → ARAÇ → KAPI → İZ",
  "%100 İÇERİDE",
  "SEÇİM AYAR DOSYASINDA",
  "25 ALTIN ÖRNEK",
  "TUR TAVANI",
  "IDEMPOTENS",
  "YAZMA ARACI = ONAY KAPISI",
  "KONTROLLÜ GERİ ALMA",
  "EVAL KIRMIZIYSA YAYIN YOK",
  "BAĞLAM BÜTÇESİ",
  "SOYUTLAMA SIZMAZ",
  "1:1 CANLI ÇALIŞTAY",
];
