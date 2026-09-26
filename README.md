# Ajan Atölyesi — AI ajanları eğitim ve danışmanlık satış sitesi

Türkçe, çok rotalı bir satış sitesi: **1:1 canlı ajan eğitimi**, **yazılım süreci
danışmanlığı**, **saatlik kiralama**; ödeme **Stripe Checkout** üzerinden, seçim
**konu + slot** bazlıdır.

Satılan şeyin kimliği sitenin kimliğidir: hero'daki **Ajan Sistemi Kurucusu**
ziyaretçiye sağlayıcı → model → araçlar → otonomi → ölçme kararlarını verdirtip
gerçek bir SVG şeması, mimari notu, risk bandı, katman sahipliği tablosu ve
"kendi içinde kur" kontrol listesi üretir. Kurucudan çıkan özet, rezervasyon
sayfasının not alanına derin bağlantıyla taşınır.

## Komutlar

| Komut | İş |
|---|---|
| `npm install` | Bağımlılıklar (Next 16, React 19, Tailwind 4, Stripe 22, TS 7) |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (tüm rotalar) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest birim + rota testleri (`vitest run`) |
| `npm run test:watch` | Vitest izleyici mod |

## Testler

`tests/` altında 7 dosya, 104 test. Ağ/veritabanı gerektirmez; Node ortamında koşar.
Webhook testi Stripe'ı taklit (mock) etmez: imza yerel bir HMAC olduğu için gerçek
`constructEvent` doğrulaması ağa çıkmadan çalıştırılır.

| Dosya | Kapsadığı kural |
|---|---|
| `tests/slots.test.ts` | Hafta sonu ve resmî tatil kapanışı, öğle arası (12:00–13:00), 09:30–19:00 penceresi, 6 saatlik ön koşul (lead time), dolu saat düşümü, 1–45 gün ufku, `+03:00` damgası |
| `tests/booking.test.ts` | `priceOf` tüm tür×süre tablosu, katalogda olmayan süre/konunun reddi, **istemci fiyatının yok sayılması**, `validateBooking` alan hataları |
| `tests/blueprint.test.ts` | `compose()` risk monotonalitesi ve bant eşikleri, katman sahipliği, şema düğüm kapıları, oturum tahmini kademesi, kurucu→rezervasyon köprüsü |
| `tests/availability.test.ts` | `GET /api/availability`: tanınmayan `tip` → 400, katalogda olmayan `sure` → 400, `gun` 1–30 kısıtı, tutulan saatin `openTimes`dan düşürülüp `taken`da gösterilmesi, kapalı günün `taken: []` dönmesi |
| `tests/checkout.test.ts` | `POST /api/checkout`: demo onayı, katalog fiyatı yazımı, çakışan slot → 409, kapalı gün → 409, alan hataları → 422, bozuk JSON → 400 |
| `tests/money.test.ts` | Para katmanı: `toKurus()` Stripe `unit_amount` dönüşümü (tüm katalog bedelleri, IEEE-754 yuvarlama tuzağı), `priceOf → toKurus` uçtan uca tutar zinciri, `formatTL`/`formatDuration` gösterimi, katalog fiyat verisinin tamlığı |
| `tests/webhook.test.ts` | `POST /api/webhooks/stripe`: imza değeri yokken `503` (store'a dokunmaz), Stripe anahtarı yokken `503`, `stripe-signature` yokken `400`, bozuk/yanlış anahtarlı/bayat zaman damgalı imzada `400`, tanınmayan olay tipinde `200`, `checkout.session.completed` → `paid`, `expired` → `failed` + slotun yeniden açılması |

Rota testleri gerçek handler'ı (`route.GET` / `route.POST`) doğrudan çağırır; HTTP sunucusu
gerekmez. Rezervasyon kayıtları `RESERVATIONS_DIR` ile **sistemin geçici dizinine** yazılır,
testler proje `.data/` dizinine dokunmaz. Her test taze store alır (`beforeEach` +
`vi.resetModules()`), çünkü `src/lib/reservations.ts` modül düzeyinde bir `Map` tutar.

## Stripe

`.env.local` (depoya girmez):

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook ucu: `/api/webhooks/stripe` — yerelde
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

**Anahtar yoksa site DEMO moddadır:** üst şeritte sarı uyarı, akışın tamamı çalışır,
`/api/checkout` ödeme almadan kayıt üretir ve `/tesekkur` sayfası "ödeme alınmadı"
rozetini gösterir. Ücretler `src/lib/catalog.ts` içinde **EUR** cinsindendir; sunucu
fiyatı her zaman katalogdan hesaplar, istemciden gelen fiyat yok sayılır
(sent dönüşümü: `toCents()`). Yasal satıcı: `site.company` (Ecostack Technology OÜ,
Tallinn — reg. 16935780, VAT EE102714663).

## Rotalar

`/` · `/egitim` · `/danismanlik` · `/saatlik` · `/yontem` · `/sikca-sorulanlar` ·
`/iletisim` · `/kosullar` · `/rezervasyon` · `/tesekkur` · `/api/availability` ·
`/api/checkout` · `/api/webhooks/stripe` · `/sitemap.xml`

Rezervasyon bağlantısı parametreleri (hepsi opsiyonel, Türkçe):
`?tip=destek-egitim&konu=m3-arac-tasarimi&sure=90&not=<kurucu özeti>`;
ödeme iptali `&durum=iptal` ile döner.

## Kod haritası

| Dosya | Rol |
|---|---|
| `src/lib/site.ts` | Marka, iletişim, navigasyon |
| `src/lib/catalog.ts` | Talep türleri T1–T4, konular, süre/fiyat, müfredat, SSS |
| `src/lib/blueprint.ts` | Kurucunun verisi + saf `compose()` (risk, katman, not, tahmin) |
| `src/lib/booking.ts` | Seçim ve form doğrulaması — istemci ve sunucu ortak |
| `src/lib/slots.ts` | `Europe/Istanbul` uygunluk üretimi (hafta içi 09.30–19.00, öğle arası, resmî tatil, 6 saat lead time) |
| `src/lib/reservations.ts` | Hold → paid/failed; süreç içi bellek + `.data/reservations.jsonl` |
| `src/lib/stripe.ts` | Anahtar kontrolü, demo/canıl ayrımı, Stripe istemcisi |
| `src/components/agent-composer.tsx` | Etkileşimli kurucu |
| `src/components/architecture-plate.tsx` | Seçimden üretilen SVG levha |
| `src/components/booking-wizard.tsx` | 4 istasyonlu şartname akışı + slot ızgarası |
| `src/components/ui.tsx` | Bölüm/kicker/panel/veri satırı primitifleri |
| `src/styles/design-tokens.css` | **Tech-blueprint** kit token'ları (üretilir — elle düzenlemeyin) |
| `src/app/globals.css` | Tailwind v4 girişi, display kademesi, blueprint zemin/hareket |

Tasarım kararı ve kabul kriterleri: `.design/brief.md`, görsel denetim notları:
`.design/review.md`.

## Üretim öncesi açık uçlar (bilinçli olarak basit bırakıldı)

1. **Takvim/veritabanı.** Uygunluk kural bazlı üretiliyor, rezervasyonlar süreç içi
   bellek + JSONL'de. Çok örnekli dağıtımda Postgres veya Cal.com gerekir.
2. **Marka ve iletişim.** `src/lib/site.ts` içindeki ad/e-posta/alan adı yer tutucudur;
   fiyatlar `src/lib/catalog.ts` içinde örnektir.
3. **E-posta ve takvim daveti.** Onay akışı webhook'ta durumu günceller; davet ve
   hazırlık formu e-postasını bir transactional sağlayıcıya bağlamak gerekir.
4. **Hukuki metin.** `/kosullar` şablondur; gerçek iade ve fatura politikası yazılmalı.
5. **Görsel denetim.** Bu oturakta tarayıcı aracı olmadığı için piksel düzeyinde
   kontrol yapılmadı; tip/renk/boşluk sözleşmesi kaynak + derlenmiş CSS üzerinden
   doğrulandı (bkz. `.design/review.md`).
