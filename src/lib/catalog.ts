/**
 * Satış kataloğu — talep türleri, konular, süreler, fiyatlar, müfredat, SSS.
 * Fiyatlar ÖRNEKTİR: gerçek tarifelerle buradan (tek yerden) değiştir.
 * Stripe `unit_amount` kuruş cinsinden gönderilir: see `toCents`.
 */

export type RequestTypeId = "gorusme" | "destek-egitim" | "kiralama" | "danismanlik";

export interface DurationOption {
  minutes: number;
  priceEUR: number;
  /** Kira paketlerinde görünen etiket, örn. "5 saatlik kota". */
  label?: string;
  note: string;
  popular?: boolean;
}

export interface Topic {
  id: string;
  code: string;
  title: string;
  summary: string;
  /** Rezervasyon özetine ve Stripe metadata'sına yazılan madde listesi. */
  outcomes: readonly string[];
  custom?: boolean;
}

export interface RequestType {
  id: RequestTypeId;
  code: string;
  label: string;
  kicker: string;
  intro: string;
  bestFor: readonly string[];
  durations: readonly DurationOption[];
  topics: readonly Topic[];
  /** Slot adımında gösterilen gerçek kısıt. */
  slotHint: string;
}

/* ── Konular ──────────────────────────────────────────────────────── */

const callTopics: readonly Topic[] = [
  {
    id: "durum",
    code: "K1",
    title: "Durum tespiti",
    summary:
      "Nerede olduğunuzu ve nerede sıkıştığınızı bir sayfalık net bir envantere çeviriyoruz: veri, araç, risk, maliyet.",
    outcomes: [
      "Ajan için uygun/için uygun olmayan işlerin ayrımı",
      "Kod tabanında temas noktaları listesi",
      "Tek sayfalık bulgu notu (oturumdan sonra 24 saat içinde)",
    ],
  },
  {
    id: "mimari-kritik",
    code: "K2",
    title: "Mimari kritik",
    summary:
      "Tasarladığınız (ya da yarıda bıraktığınız) ajan mimarisini birlikte masaya yatırıyoruz: döngü, araç arayüzü, hafıza, kontrol kapıları.",
    outcomes: [
      "Döngü ve durma koşulunda somut hatalar",
      "Araç şemalarında yeniden tasarım önerisi",
      "Ölçek ve maliyet tahmini",
    ],
  },
  {
    id: "yol-haritasi",
    code: "K3",
    title: "Yol haritası",
    summary:
      "Bir çeyreği hedefleyen sıralı plan: hangi ajan önce üretime çıkar, hangi ekip neyi öğrenmeli, neyi satın almalı, neyi içeride kurmalı.",
    outcomes: [
      "Önceliklendirilmiş 3 iş akışı",
      "Kişi/maliyet/kablolama bazında faz planı",
      "Ölçülebilir çıkış kriterleri (eval eşiği)",
    ],
  },
  {
    id: "yonetim-sunumu",
    code: "K4",
    title: "Yönetimi ikna",
    summary:
      "Teknik olmayan paydaşlar için AI süreç faydasını anlatan bir sunum iskeleti: risk, maliyet, kazanım, zaman çizelgesi.",
    outcomes: [
      "10 slaytlık anlatı iskeleti",
      "Yatırım geri dönüşü için dürüst hesaplama",
      "Sıkılan itirazlara hazırlıklı cevaplar",
    ],
  },
];

const trainingTopics: readonly Topic[] = [
  {
    id: "m1-anatomi",
    code: "M1",
    title: "Ajan anatomisi",
    summary:
      "Bir ajanı ajan yapan şey: model değil, döngü. Durum, araç arayüzü, durma koşulu ve yeniden deneme stratejisini sıfırdan kuruyoruz.",
    outcomes: [
      "Kendi kod tabanınızda çalışan tek araçlı bir döngü",
      "Durma/tavan koşullarının yazılması",
      "Ajan vs. iş akışı ayrımı (hangisi ne zaman)",
    ],
  },
  {
    id: "m2-saglayici-katmani",
    code: "M2",
    title: "Sağlayıcı ve model katmanı",
    summary:
      "Sağlayıcı seçeneklerini seçmek işin kolay kısmı — ama o seçimi tek bir dosyadan yönetebiliyorsanız. Soyutlama katmanı, yedek model, kotalar ve fiyat/kapasite kıyası.",
    outcomes: [
      "Tek arayüzlü sağlayıcı soyutlaması (2 sağlayıcıya çalışan)",
      "Ayar dosyası tabanlı model seçimi (kod değişikliği yok)",
      "Yerel model çıkışı ve kabiliyet düşüş testleri",
    ],
  },
  {
    id: "m3-arac-tasarimi",
    code: "M3",
    title: "Araç tasarımı ve çalıştırma",
    summary:
      "Araç, fonksiyon çağırma değil, sözleşmedir. Şema, hataların dili, yan etkiler, kum havuzu ve tekrar edilebilirlik.",
    outcomes: [
      "İsim alanı olan bir araç dağıtıcısı (dispatcher)",
      "Yazma işlemleri için onay kapısı",
      "Araç başarısızlığında izlenen net hata yolu",
    ],
  },
  {
    id: "m4-hafiza-baglam",
    code: "M4",
    title: "Hafıza ve bağlam bütçesi",
    summary:
      "Bağlam penceresi bedava değil. Özetleme, yapılandırılmış hafıza, RAG'in dürüst sınırları ve maliyeti tek bir yerde tutma.",
    outcomes: [
      "Bağlam bütçesi defteri (kaç token, nereye gidiyor)",
      "Vektör indisi yerine/yanı sıra yapılandırılmış tablo",
      "Uzun görevlerde durum geri yükleme",
    ],
  },
  {
    id: "m5-kontrol-guvenlik",
    code: "M5",
    title: "Kontrol kapıları ve güvenlik",
    summary:
      "İzinsiz işlem yapmayan ajan. Komut enjeksiyonu, PII sızıntısı, tavan maliyeti ve izlenebilirlik burada çözülür.",
    outcomes: [
      "İzin/karantina katmanı ve insan onay kapısı",
      "İstemi enjeksiyonu test seti (en az 10 zararlı örnek)",
      "Açık izleme: her karar bir satır, yeniden oynatılabilir",
    ],
  },
  {
    id: "m6-degerlendirme",
    code: "M6",
    title: "Değerlendirme ve maliyet",
    summary:
      "Ölçmediğin ajanı düzeltemezsin. Altın örnek seti, regresyon kapısı, token ekonomisi ve yayına alma kriteri.",
    outcomes: [
      "25 altın örneklik eval seti + skorlayıcı",
      "CI'da çalışan regresyon kapısı",
      "İş başına maliyet panosu (basit ama gerçek)",
    ],
  },
  {
    id: "kendi-konu",
    code: "K",
    title: "Kendi konun (kod tabanında canlı çalışma)",
    summary:
      "Müfredat dışı: kendi takıldığın işi getiriyoruz ve o oturumda birlikte bitiriyoruz. Ekran paylaşımıyla, kodu sen yazıyorsun, ben yönlendiriyorum.",
    outcomes: [
      "Oturum sonunda çalışan bir PR",
      "Kullanılan kararların yazılı özeti",
      "14 gün asenkron soru desteği",
    ],
    custom: true,
  },
];

const rentTopics: readonly Topic[] = [
  {
    id: "r-tikanma",
    code: "S1",
    title: "Tıkanma çözümü",
    summary:
      "Bir şeye 3 saattir mi bakıyorsun? Birlikte açıyoruz: hata, bağlam, döngü. Kodu sen yazarsın, ben köşeleri gösteririm.",
    outcomes: ["Harekete geçer bir plan ya da çalışan düzeltme", "İlgili dosya/satır notları"],
  },
  {
    id: "r-review",
    code: "S2",
    title: "Kod ve mimari inceleme",
    summary:
      "Birleştirmeden önce PR'niz ya da tasarım dokümanınız: sözleşmeler, hata yolları, test edilebilirlik ve maliyet.",
    outcomes: ["Yorumlanmış PR listesi", "Önceliklendirilmiş düzeltme sırası"],
  },
  {
    id: "r-workshop",
    code: "S3",
    title: "Ekip içi mini çalıştay",
    summary:
      "Ekibinize (2-6 kişi) kendi kod tabanınız üzerinden 2-3 saatlik odaklı uygulama oturumu. Sunum değil, ortak çalışma.",
    outcomes: ["Ortak kurulan bir referans implementasyon", "Ekip içi karar kaydı"],
  },
  {
    id: "r-canli",
    code: "S4",
    title: "Üretime alma gözlemi",
    summary:
      "İlk canlı yayında yanınızdayım: gözetleme, eşikler, geri alma planı ve ilk 24 saatte gelen gerçek sinyaller.",
    outcomes: ["Yayın kontrol listesi", "Olay kaydı ve ertesi gün değerlendirmesi"],
  },
];

const consultingTopics: readonly Topic[] = [
  {
    id: "d-surec",
    code: "D1",
    title: "Yazılım süreci denetimi",
    summary:
      "Sürecin kendisi: planlama, PR akışı, test, dağıtım, olay yönetimi. AI'ın nerede gerçekten işe yarayıp nerede gürültü olduğunu buluyoruz.",
    outcomes: ["Değer akışı haritası", "Ölçülebilir 5 iyileştirme", "Uygulama sırası ve tahmini yük"],
  },
  {
    id: "d-mimari",
    code: "D2",
    title: "Ajan mimarisi tasarımı",
    summary:
      "Kurulumu biz yapıyoruz: iş akışı seçimi, araç sözleşmeleri, hafıza, kontrol kapıları, eval altyapısı. Kod sizde kalır.",
    outcomes: ["Mimari karar kaydı (ADR)", "Referans implementasyon", "Devir eğitimi"],
  },
  {
    id: "d-entegrasyon",
    code: "D3",
    title: "Kurulum ve entegrasyon",
    summary:
      "Mevcut ürününüze ajan gömme: veri erişimi, kimlik/izin, maliyet tavanı, gözetleme arayüzü. Çalışır halde teslim.",
    outcomes: ["Üretime alınmış bir iş akışı", "Gözetleme + eval paneli", "1 ay hata payı desteği"],
  },
  {
    id: "d-devir",
    code: "D4",
    title: "Devir ve ekip eğitimi",
    summary:
      "İçeri taşınamayan her çözüm bağımlılıktır. Kurduklarımızı ekibinize çalışır durumda öğretiyoruz.",
    outcomes: ["Ekip çalıştayı (2 oturum)", "Kendi kendine test seti", "Dokümante çalıştırma rehberi"],
  },
];

/* ── Talep türleri ────────────────────────────────────────────────── */

export const requestTypes: readonly RequestType[] = [
  {
    id: "gorusme",
    code: "T1",
    label: "Görüşme talebi",
    kicker: "30 / 60 dakika",
    intro:
      "Konuşarak netleşmek için. Kamera açık, ekran paylaşımıyla; karar vermeden önce kimle çalıştığınızı da görmüş olursunuz.",
    bestFor: [
      "Fikri henüz netleşmemiş kurucu veya tech lead",
      "Bir mimari kararı savunması gereken ekip",
      "Eğitim/danışmanlık ihtiyacının sınırı",
    ],
    durations: [
      { minutes: 30, priceEUR: 40, note: "Tek konu, tek karar. Not 24 saat içinde." },
      { minutes: 60, priceEUR: 75, note: "Envanter + önceliklendirme. Popüler başlangıç.", popular: true },
    ],
    topics: callTopics,
    slotHint: "Görüşmeler hafta içi 09.30–19.00 (TR saati) arası açılır.",
  },
  {
    id: "destek-egitim",
    code: "T2",
    label: "Destek & eğitim talebi",
    kicker: "1:1 canlı çalıştay",
    intro:
      "Eğitim, slayt değildir. Kendi deponuzu açıyorsunuz, kodu siz yazıyorsunuz; ben köşeleri, kısayolları ve tuzakları canlı gösteriyorum.",
    bestFor: [
      "Ajana başlayıp demo ile üretim arası sıkışan geliştiriciler",
      "Sağlayıcı/model kararını tek dosyadan yönetmek isteyen ekipler",
      "İçeride kurmak ama doğru kurmak isteyen teknik liderler",
    ],
    durations: [
      { minutes: 60, priceEUR: 120, note: "Tek modül, tek hedef." },
      { minutes: 90, priceEUR: 170, note: "Bir modülü baştan sona kurar.", popular: true },
      { minutes: 120, priceEUR: 220, note: "Derin oturum: kurar, kırar, düzeltir." },
    ],
    topics: trainingTopics,
    slotHint: "Çalıştaylar kesintisiz bloklar hâlindedir; aynı hafta içinde ikinci oturum alabilirsiniz.",
  },
  {
    id: "kiralama",
    code: "T3",
    label: "Saatlik kiralama",
    kicker: "“Yanında bir kıdemli”",
    intro:
      "Proje bazlı değil, saat bazlı. Kotanı al, takıldığın hafta kullan. Kullanılmayan saatler bir sonraki aya devreder.",
    bestFor: [
      "Küçük ekipler: kıdemli yok ama standart lazım",
      "Yaklaşan bir teslim tarihi öncesi gözlem",
      "Sürekli ama düşük hacimli teknik destek",
    ],
    durations: [
      { minutes: 60, priceEUR: 95, note: "Tek saat, tek konu." },
      { minutes: 180, priceEUR: 270, label: "3 saatlik kota", note: "Yoğun haftalar için." },
      { minutes: 300, priceEUR: 430, label: "5 saatlik kota", note: "En çok tercih edilen.", popular: true },
      { minutes: 600, priceEUR: 820, label: "10 saatlik kota", note: "Ay içi esnek kullanım." },
    ],
    topics: rentTopics,
    slotHint: "Kotalı saatler tek seferde kullanılmalıdır; bölünürse her parça ayrı slot alır.",
  },
  {
    id: "danismanlik",
    code: "T4",
    label: "Danışmanlık (bırak profesyoneller yapsın)",
    kicker: "Uçtan uca, biz kurarız",
    intro:
      "Ekibiniz yapmak istemiyorsa ya da vakti yoksa: süreci denetler, ajan sistemini kurar, çalışır halde ve size öğreterek teslim ederiz.",
    bestFor: [
      "Teslim tarihi net, teknik kapasite sınırlı ekipler",
      "AI sürecini ürüne koyması gereken ama kime danışacağını bilmeyenler",
      "Kurduktan sonra içeride bırakacak bir sahiplenme arayanlar",
    ],
    durations: [
      { minutes: 120, priceEUR: 190, note: "Kapsam atölyesi: denetim + teklif çıkışı." },
      { minutes: 240, priceEUR: 350, note: "Denetim + mimari tasarım paketi.", popular: true },
    ],
    topics: consultingTopics,
    slotHint: "Kapsam atölyesi tek oturum; uygulaması ayrı teklif ve takvimle planlanır.",
  },
];

export const requestTypeById = (id: string): RequestType | undefined =>
  requestTypes.find((type) => type.id === id);

/**
 * Sayfaların modül seviyesinde kullandığı garanti edici erişim:
 * `requestTypeById` `undefined` dönebileceği için closure içinde tip daralması kaybolur.
 */
export function requireRequestType(id: RequestTypeId): RequestType {
  const found = requestTypeById(id);
  if (!found) throw new Error(`Katalog hatası: "${id}" talep türü bulunamadı.`);
  return found;
}

export const topicById = (type: RequestType, id: string): Topic | undefined =>
  type.topics.find((topic) => topic.id === id);

export function findTopic(topicId: string): { type: RequestType; topic: Topic } | undefined {
  for (const type of requestTypes) {
    const topic = topicById(type, topicId);
    if (topic) return { type, topic };
  }
  return undefined;
}

/* ── Eğitim sayfası içeriği ───────────────────────────────────────── */

export const sessionFlow: readonly { code: string; when: string; title: string; body: string }[] = [
  {
    code: "01",
    when: "48 saat önce",
    title: "Hazırlık formu",
    body: "Depo yapısı, veri kaynağı, hedef iş akışı ve kısıtlarınız için 7 soruluk bir form gönderiyorum. Bunu doldurmayan oturum çalıştay değil, genel seminer olur.",
  },
  {
    code: "02",
    when: "Oturumda",
    title: "Ekran paylaşımı, canlı kurulum",
    body: "Kamerayı ben açmıyorum, siz yazıyorsunuz. Birlikte bir döngü kuruyoruz: bağlam → araç → karar → kapı → kayıt. Arada bozduğum şeyler de oluyor; o kısım eğitimin parçası.",
  },
  {
    code: "03",
    when: "24 saat sonra",
    title: "PR + karar notları",
    body: "Oturumda alınan kararlar, nedenleri ve reddedilen seçenekler bir sayfa not olarak gelir. Kodu hatırlamak için değil, gerekçeyi kaybetmemek için.",
  },
  {
    code: "04",
    when: "14 gün",
    title: "Asenkron destek",
    body: "E-posta üzerinden soru desteği. Kod parçası gönder, cevap al. Yeni bir oturum satın almadan önceki denetim bu.",
  },
];

export const notPromises: readonly string[] = [
  "Size müşteri referansı, logo duvarı veya “%300 verim” sayıları göstermeyeceğim. Bunların uydurma olduğunu ikiniz de biliyorsunuz.",
  "Kutudan çıkmış bir ajan framework'ü satmıyorum. İsterseniz kurarız ama önce neden kurmadığımızı ölçeriz.",
  "Bir oturumda her şey öğrenilmez. Tek oturumla üretime çıkacağınızı vaat eden varsa, ona gidin.",
  "Modelin kendi prompt'unuzla nasıl davranacağını bilemem; ölçebiliriz. Ölçmediğimiz hiçbir şeye “çalışıyor” demeyiz.",
];

export const inHouseChecklist: readonly { title: string; body: string }[] = [
  {
    title: "Karar tek dosyada",
    body: "Sağlayıcı, model, sıcaklık, araç seti ve tavanlar bir ayar dosyasında. Kod değişmeden ortam değişir.",
  },
  {
    title: "Soyutlama sızdırmaz",
    body: "İki sağlayıcının hata tipleri tek bir sözleşmeye iner. Değiştirdiğinizde çağrı yerleri değil, bir adaptör değişir.",
  },
  {
    title: "Her adım kayıtlı",
    body: "Girdi, çıktı, araç çağrısı, token, maliyet, süre. Yeniden oynatılamayan bir ajan hata ayıklanamaz.",
  },
  {
    title: "Yan etki kapısız değil",
    body: "Okuma araçları serbest, yazma araçları onaylı. Kapı kodda, prompt'ta değil.",
  },
  {
    title: "Değişiklik ölçer",
    body: "Prompt veya model değiştiğinde 25 altın örnek koşar. Yeşil değilse yayına girmez.",
  },
  {
    title: "Çıkış planı var",
    body: "Yerel bir model ya da ikinci sağlayıcı, kabiliyet düşüşü ölçülmüş şekilde rafta durur.",
  },
];

/* ── SSS ──────────────────────────────────────────────────────────── */

export const faq: readonly { q: string; a: string }[] = [
  {
    q: "Ödeme nasıl oluyor?",
    a: "Slotu ve konuyu seçtikten sonra Stripe'ın güvenli ödeme sayfasına yönlendiriliyorsunuz. Kart bilgileriniz bu sunucuya hiç uğramaz; işlem Stripe üzerinden tek seferlik alınır.",
  },
  {
    q: "Rezervasyonu iptal edebilir miyim?",
    a: "Oturumdan 24 saat öncesine kadar ücretsiz iptal veya erteleme yapabilirsiniz; bu durumda ücret iadesi Stripe üzerinden aynı karta yapılır. 24 saat içinde yapılan iptallerde saat kotası yanmaz, bir sonraki oturuma sayılır.",
  },
  {
    q: "Hangi dilde işliyoruz?",
    a: "Varsayılan Türkçe; teknik terimler İngilizce karşılığıyla birlikte geçer. Kod, yorumlar ve dokümanlar İngilizce olabilir — oturumun sonunda hangi dilde kalacağına siz karar verirsiniz.",
  },
  {
    q: "Uzaktan mı, yüz yüze mi?",
    a: "Her oturum uzaktan ve ekran paylaşımıyla. Görüntülü bağlantı rezervasyon sonrası e-postada gelir. Yüz yüze kapsam yalnızca İstanbul içi danışmanlık paketlerinde ve ayrıca planlanır.",
  },
  {
    q: "Hangi teknolojilerle çalışıyorsunuz?",
    a: "Ekipte ne varsa onunla: TypeScript/Node, Python, Go, Ruby, Java. Sağlayıcı bağımsız bir katman kuruyoruz; OpenAI, Anthropic, Google, açık ağırlıklı yerel modeller ya da birkaçı birlikte. Ayrı bir “ajans platformu”na bağlamıyoruz.",
  },
  {
    q: "Kurum için fatura kesiliyor mu?",
    a: "Evet. Faturayı **Ecostack Technology OÜ** (Tallinn, Estonya — vergi no EE102714663) keser; ödeme sırasında şirket adını ve vergi numaranızı (AB için VAT ID) Stripe formuna ekleyebilirsiniz, fatura e-posta ile iletilir. AB içi B2B alışverişinde KDV ters yükümlülük (reverse charge) uygulanabilir; Estonya dışı alıcılarda yerel KDV kuralların doğrulanması gerekir. Kurumsal toplu alımlar için 5 veya 10 saatlik kotalar daha verimli.",
  },
  {
    q: "Ekipçe katılabilir miyiz?",
    a: "Destek ve eğitim oturumlarına ekibinizden 2 kişi aynı ücretle katılabilir. Daha fazlası için saatlik kiralamadaki mini çalıştay seçeneğini kullanın; kişi başı değil, oturum başına ücretlendirilir.",
  },
  {
    q: "Ön koşul ne?",
    a: "Kendi deponuzda çalışabiliyor olmak ve bir iş akışını yazılı olarak tarif edebilmek. Makine öğrenmesi altyapısı şart değil; araç şemaları ve hata yolları konusunda rahat olmanız yeterli.",
  },
  {
    q: "Neden “seçenekleri seçmek” yetmiyor?",
    a: "Çünkü asıl maliyet seçimde değil, seçimin etrafında: hangi aracı kime veriyorsunuz, ne kadar hafıza taşıyorsunuz, nerede duruyorsunuz ve nasıl ölçüyorsunuz. Sağlayıcı değişince bu kararların hepsi yeniden sorulur. Amaç, o soruları tek bir yerde, kodda tutmak.",
  },
  {
    q: "Site neden demo modda görünüyor?",
    a: "Bu bilgisayarda STRIPE_SECRET_KEY tanımlı değilse site demo modda çalışır: akışın tamamı işler, ödeme alınmaz ve onay sayfasında sarı bir uyarı görürsünüz. Anahtar tanımlanınca gerçek Stripe Checkout devreye girer.",
  },
];

/* ── Danışmanlık ve saatlik sayfaları ─────────────────────────────── */

export const consultingTracks: readonly { code: string; title: string; days: string; body: string; deliverables: readonly string[] }[] = [
  {
    code: "A",
    title: "Hızlı denetim",
    days: "5 iş günü",
    body: "Sürecinizi ve veri/araç envanterinizi çıkarır, AI'ın nerede gerçek kazanç nerede gösteriş olduğunu yazarız. Uygulama sözü yok, tespit net.",
    deliverables: ["Değer akışı haritası", "5 iyileştirme, etki/efor sıralı", "Kapıya asılacak tek sayfalık bulgu notu"],
  },
  {
    code: "B",
    title: "Kurulum ortaklığı",
    days: "3–8 hafta",
    body: "Bir iş akışını uçtan uca biz kuraruz: araç sözleşmeleri, hafıza, kontrol kapıları, eval, gözetleme. Kod baştan sizin deponuzda yazılır.",
    deliverables: ["Üretime alınmış iş akışı", "Eval seti + CI kapısı", "Karar kayıtları (ADR)", "Ekip çalıştayı"],
  },
  {
    code: "C",
    title: "Tam teslim + devir",
    days: "bir çeyrek",
    body: "Kurulumu biz yaparız, sahiplenmeyi siz alırsınız. Haftalık tempo, ortak olay incelemeleri ve sonunda kendi kendine yeter bir ekip.",
    deliverables: ["Çeyrek sonu sahiplik devri", "Kendi kendine test/geri yükleme planı", "Yıllık bakım yol haritası"],
  },
];

export const rentTerms: readonly { label: string; value: string }[] = [
  { label: "Yanıt süresi", value: "İş gününde 4 saat içinde ilk cevap" },
  { label: "Kullanım", value: "Slot rezerve et, kotandan düşür; bölünabilir" },
  { label: "Devir", value: "Kullanılmayan saatler bir sonraki aya devreder" },
  { label: "Asgari", value: "Tek slot 60 dakika; gece/hafta sonu 1.5x" },
  { label: "Kapsam dışı", value: "İkinci seviye destek, devamlı operatörlük, vardiya" },
];

/* ── Fiyat tablosu ────────────────────────────────────────────────── */

export interface PriceRow {
  typeName: string;
  code: string;
  cells: readonly { minutes: number; priceEUR: number }[];
}

export const priceTable: readonly PriceRow[] = requestTypes.map((type) => ({
  typeName: type.label,
  code: type.code,
  cells: type.durations.map((duration) => ({ minutes: duration.minutes, priceEUR: duration.priceEUR })),
}));
