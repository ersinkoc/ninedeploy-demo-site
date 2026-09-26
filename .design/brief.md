# Design brief — Ajan Atölyesi (AI ajanları eğitim + danışmanlık satış sitesi)

Language: Türkçe (`lang="tr"`), tüm arayüz metinleri Türkçe, fiyatlar EURO.
Audience and primary task: Türk yazılım ekiplerinin kurucuları, tech lead'leri ve
geliştiricileri. İki görev: (a) "AI ajanını kendi projeme gerçekten nasıl gömerim?"
sorusunun cevabını olduğuna inanmak, (b) bir konu + saat seçip Stripe ile ödemek.
System and scope: Greenfield. Kit `tech-blueprint` (web stack) → `src/styles/design-tokens.css`.
Yeni token eklenmedi; `success`/`danger` semantic slot'ları `set` ile eklendi.

Direction (ürüne özgü fikir): Satış vaadi "sağlayıcı/model seçeneklerini seçmekten
ibaret kalmayan, %100 içeride kurulan agentic sistem". O hal sitenin kimliği de bir
**mühendislik çizim masası**: blueprint grid zemini, ince teknik çizgiler, monospace
ölçü/koordinat etiketleri, ve ziyaretçinin kendi elle çalıştırdığı bir
**"Ajan Sistemi Kurucusu"** (sağlayıcı → model → araçlar → otonomi seviyesi seçiyor,
SVG şema + gerçek bir mimari notu + "kendi içinde kur" kontrol listesi üretiliyor).
Bu hero dekoratif değil; eğitimin içeriğinin çalışan bir demosu. İkincil motif:
rezervasyon akışının bir **teknik şartname / drafting sheet** gibi davranması
(adımlar "istasyon", slot'lar ızgara hücreleri, özet paneli "spec" kutusu).

Content priority: 1) Rezervasyon/ödeme CTA'sı, 2) iki ürün hattının ayrımı
(eğitim oturumu vs "bırak profesyoneller yapsın" danışmanlığı), 3) saatlik kiralama,
4) kanıt yerine şeffaf müfredat + oturum akışı.

Layout and type: Display/body Inter, etiket-veri-ölçü JetBrains Mono (kit hükmü).
Tek `h1`/sayfa. Pazarlama sayfalarında geniş boşluklu (comfortable) ritim; uzun
proza 68ch ölçü. Bölüm hiyerarşisi numara + mono kicker ile ("02 / MÜFREDAT").
Uç noktalar: 320 / 768 / 1024 / 1440, yatay taşma yok, dokunma hedefleri ≥44px.

Color and assets: primary = cyan (çizgi/etkileşim), accent = amber (vurgu/uyarı),
success = yeşil (onay), danger = kırmızı (hata), fg = navy mürekkep.
"Blueprint panel" = fg zemin + bg metin (invert polarite), light/dark aynı token
setinden çalışıyor. Renk tek başına anlam taşımıyor (ikon + metin + mono etiket).
Üçüncü taraf logo/görsel yok: sağlayıcı ve model adları **metin** olarak geçiyor
(marka görseli kullanmak telif + sahtelik riski), şemalar elle çizilmiş SVG.

States and adaptation: Light ("whiteprint") + dark ("blueprint") toggle, localStorage
+ `prefers-color-scheme`, flash yok. Boş/yükleniyor/hata durumları: slot yüklenirken
skeleton, slot yoksa "bu gün kapalı" boş durumu, Stripe demo modu uyarısı, hata
mesajı danger + metin. Klavye: tüm seçiciler radiogroup/button, görünen focus ring.

Avoid: yuvarlak blob, degrade başlık, cam efekti, eşit 3-kart ızgarası, uydurma
müşteri logosu/referans/sayı, "AI" klişesi (robot emojisi, beyaz takım elbiseli
insan görseli), hover-only etkileşim.

Acceptance (gözlemlenebilir):
- Hero'daki kurucu gerçek state üretiyor: seçim değişince şema + not + fiyat etiketi değişiyor.
- `npm run typecheck` ve `npm run build` temiz; `design verify` drift 0 (veya gerekçeli).
- Ödeme akışı anahtarsız çalışıyor (demo mod) ve anahtarla Stripe Checkout'a gidiyor.
- Slot'lar `Europe/Istanbul`'da üretiliyor, seçili slot + konu + tip `metadata`'ya yazılıyor.
- 320px'de yatay scroll yok; klavye ile rezervasyon tamamlanabiliyor.

Assumptions (etiketli, doğrulanmadı):
- Eğitmen adı/marka "Ajan Atölyesi" geçici; `src/lib/site.ts` içinde tek yerden değişir.
- Fiyatlar örnek: `src/lib/catalog.ts` (gerçek fiyatlarla değiştirilmeli).
- Takvim backend'i yok: uygunluk `src/lib/slots.ts` içinde deterministik üretiliyor,
  rezervasyonlar süreç-içi + `.data/reservations.jsonl`'a yazılıyor → üretimde DB/Cal.com gerekir.
- `STRIPE_SECRET_KEY` yok → site demo modda çalışır, sahte ödeme yapılmaz.
