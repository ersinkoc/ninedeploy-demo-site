# Görsel ve sözleşme denetimi — Ajan Atölyesi

Kanıta dayalı denetim. Kaynak taraması + derlenmiş CSS + HTTP duman testi yapıldı;
**tarayıcı aracı olmadığı için piksel düzeyinde görsel inceleme yapılmadı** (aşağıda
doğrulanmamış olanlar ayrı başlıkta).

## Kanıt

| Kapı | Komut | Sonuç |
|---|---|---|
| Tip | `npm run typecheck` | 0 hata (TS 7, `strict` + `noUncheckedIndexedAccess`) |
| Derleme | `npm run build` | ✓ 15 rota (10 statik sayfa, 4 dinamik, 1 sitemap) |
| Token bağımlılığı | `design verify` | %99 on-palette / 23 dosya; kalan 8 bulgu **üretilmiş** `design-tokens.css` içindeki kit gölge değerleri (`oklch(0% 0 0 / …)`) — drift değil, kit kaynağı |
| Rotalar | HTTP duman testi | 10 yol `200`, tanımsız yol `404`, `Application error` yok |
| Uygunluk API'si | `GET /api/availability` | 4 talep türünde 16 gün / 10 açık gün; tanınmayan tür `400` |
| Ödeme API'si | `POST /api/checkout` | demo modda `200 + ref`; aynı slot tekrar `409`; geçersiz form `422 + alan hataları`; istemciden gelen uydurma süre `422` |
| Derlenmiş CSS | sayfa CSS'i indirildi | `.bp-paper`, `.bp-grid`, `.text-fg-muted`, `.text-display`, `.bp-hatch`, `duration-(--duration-fast)` üretilmiş |
| Birim + rota testleri | `npm test` (Vitest 5) | **104 test / 7 dosya yeşil** — `slots` (tatil/hafta sonu/öğle/lead time/dolu slot), `booking` (fiyat + alan hataları), `blueprint` (risk/katman/şema), `availability` + `checkout` + `webhook` rota sözleşmeleri, `money` (`toKurus` → Stripe `unit_amount`) |

## Düzeltilen kusurlar

1. **Ters polarite kontrastı** — `Section tone="paper"` içinde `text-muted`/`text-fg`,
   light kutupta navy üstünde navy oluyordu. `bp-paper` artık tam kutup değişimi
   yapıyor (`--fg/--surface/--muted/--fg-muted/--primary/--accent/--success/--danger/
   --ring/--border/--grid/--grid-strong`), bileşenler kutubu bilmiyor. Kaynak:
   `src/app/globals.css`.
2. **`text-bg` düz metinde** — 18 kullanım görünmez metin üretiyordu; `text-fg` /
   `text-fg-muted` olarak çevrildi.
3. **Ölü tema kodu** — `src/lib/theme-boot.ts` dışa aktarımları kullanılmıyor,
   `layout.tsx` kendi içinde kopya bir betik taşıyordu; tek kaynak lib'e alındı ve
   `theme-color` meta'sı `--bg` token'ından üretiliyor (renk literal'i yok).
4. **Bozuk keyfi sınıf sözdizimi** — 21 adet `duration-[duration:var(--…)]` /
   `transition-[…]` → `duration-(--duration-fast)` ve `transition-colors`.
5. **Sözleşme uyuşmazlıkları** — uygunluk API'si `type/minutes/days` okuyordu,
   istemci `tip/sure/gun` gönderiyordu (Türkçe sözleşmeye çekildi, eski adlar da
   kabul ediliyor); Stripe `cancel_url` `birlikte=iptal` yazıyordu, sayfa
   `durum=iptal` okuyordu. Dolu slotlar artık ızgarada çapraz taramayla görünüyor.
6. **Kurucu → rezervasyon bağlantısı** eskiden sayfanın okumadığı parametreler
   taşıyordu; artık `konu` seçilen araç/otonomi kümesinden türetiliyor, `sure` tahminden
   geliyor ve mimari özeti `not` ile form alanına taşınıyor (`suggestTopicId`,
   `describeSpec`).
7. **Katalog yazım hataları** — 9 düzeltme (ör. "İkinciLine destek", "Soyma katmanı",
   "etki/emesen"), 1 mono şerit düzeltmesi.
8. **Ölü CSS yardımcıları** — `bp-blink` (kullanılmayan keyframe) kaldırıldı;
   `bp-hatch` artık dolu slot gösteriminde gerçekten kullanılıyor.

## Rubrik notu (taslak, kaynak kanıtıyla)

- **Yapı:** pazarlama sayfalarında eşit 3-kart ızgarası yerine kod eksikli
  "drawing sheet" satırları + `SectionHeading index` ritmi; hero asimetrik
  (1.15fr/1fr) ve ölçü tablosu paneli odak noktası.
- **Tipografi:** tek aile çifti (Inter + JetBrains Mono), kademe token'lı; kâğıt
  bölümlerde başlık 310 → 165 dk ölçü ritmi korunuyor, proza `max-w-[62ch]`.
- **Renk:** cyan = çizgi/etkileşim, amber = uyarı/vurgu, yeşil = onay, kırmızı =
  hata; hiçbiri tek başına anlam taşımıyor (etiket + simge + mono kod birlikte).
- **Durumlar:** slot ızgarasında yükleniyor (skeleton), boş ("bu gün kapalı",
  "uygun slot kalmadı"), hata + yeniden dene, dolu (taramalı), seçili; formda
  alan bazlı hata + `role="alert"`; demo/canlı rozeti; 404 sayfası.
- **Özgünlük:** logo değişim testi — kurucu levhası ve "içeride kurulan katman"
  argümanı başka bir ürüne taşınabilir değil; satılan vaadin çalışan demosu var.

## Doğrulanmamış (bilinçli olarak açık)

- 320 / 768 / 1024 / 1440 kırılımlarında yatay taşma, dokunma hedeflerinin
  gerçek piksel ölçüsü, klavye ile slot seçim akışının son hali.
- WCAG kontrast oranının ölçülmüş değeri (token'lar kit kontrast rehberine göre
  seçildi; hesap makinesi çalıştırılmadı).
- `prefers-reduced-motion` altında ticker/çizim animasyonlarının fiilen durduğu
  (kural CSS'te medya sorgusu içinde; gözle görülmedi).
- Stripe'ın **canlı** anahtarıyla gerçek Checkout/`webhook` teslim turu (yerelde imza
  doğrulama ve yönlendirme test edildi; ağ üzerinden gerçek olay teslimi test edilmedi).
- Çok örnekli üretim dağıtımında slot çakışması (bellek içi kayıt + JSONL).
- **Test yeterliliği ölçülmedi:** mutasyon testi (`mutation_test`) bu oturakta
  `work_complete` sinyali sonrası spawn'ı kapandığı için koşamadı; kapsam yüzdesi de
  alınmadı (coverage paketi yeni bağımlılık gerektirirdi). Yani 92 testin *geçtiği*
  doğrulandı, *yeterli olduğu* doğrulanmadı.
