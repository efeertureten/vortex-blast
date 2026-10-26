# 00 — Pazar ve Benchmark Araştırması

> Erişim tarihi: **2026-10-26** · Web erişimi: **var** (WebSearch + WebFetch).
> Etiketler: `[ARAŞTIRMA]` = kaynak tablosundaki **S#** girdisine bağlı · `[VARSAYIM]` = doğrulanamadı · `[AS-BUILT]` = `index.html`'de mevcut.
> Kural: Rakamlar kaynaklarından parafraz edilmiştir. Kaynaklar çoğunlukla vendor/blog içeriğidir. Her satırda güvenilirlik notu var, "yön gösterici" olarak okuyun. 2024 öncesi veri **(eski)** diye işaretlidir.

---

## Yönetici özeti (15 madde)

1. **Puzzle büyüyen bir kategori:** 2025'te mobil puzzle yaklaşık 9,7 milyar indirme ve yaklaşık 10 milyar $ IAP geliri yaptı (+%14 YoY). Büyümenin yaklaşık %60'ı Merge-2'den, kalanı Sort/Screw/Block gibi niş alt türlerden geldi. `[ARAŞTIRMA S11]` Sonuç: "küçük ama anlamlı twist" içeren niş mekanikler hâlâ yer bulabiliyor.
2. **Hybrid-casual puzzle IAP'ı yükselen bir hat** (AppMagic Q2'25: top-10 hybrid-casual gelirinin %50'sinden fazlası puzzle). `[ARAŞTIRMA S30]` Saf reklam (IAA) modeli tek başına artık norm değil. Hibrit modele geçiş 2023'te başlamıştı: hybrid-casual puzzle geliri yıllık yaklaşık %430 arttı **(eski)** `[ARAŞTIRMA S29]`.
3. **Retention çıtası düşüyor ama puzzle görece iyi:** GameAnalytics 2025 (2024 verisi): D1 top-%25 ≈ %26,5–27,7; D7 medyan ≈ %3,4–3,9 (top-%25 ≈ %7–8). Projelerin %75'inde D28 < %3. Puzzle, uzun vadeli retention'da en iyi türler arasında. `[ARAŞTIRMA S1]`
4. **Hybrid-casual hedefleri daha yüksek:** D7 için %15–20 (Mob Control D7 %25,1). `[ARAŞTIRMA S4]` 2023'te bir publisher'ın eşikleri D1 ≥%45, D7 ≥%15 (puzzle %20), D30 ≥%10 idi **(eski)**. `[ARAŞTIRMA S5]`
5. **Oturum süresi:** Medyan oturum 5–6 dk, top-%25 8–9 dk, günde yaklaşık 4 oturum. `[ARAŞTIRMA S1]` Vortex Blast'ın as-built run süresi casual oyuncu modelinde yaklaşık 2 dk (bkz. GDD §5). Kısa run'lar oturum başına 2–3 run'a karşılık gelir. Bu, hybrid-casual için uygun.
6. **Reklam hacmi:** Puzzle türü yoğun reklam alıyor. US Android'de kullanıcı başına 72,5 interstitial ve 23,4 rewarded izlenmiş. `[ARAŞTIRMA S6]`
7. **Rewarded opt-in oranı** genel olarak %30–60, tamamlama oranı %85–95 (puzzle'a özel kaynak yok). `[ARAŞTIRMA S7]`
8. **eCPM ve ARPDAU:** US rewarded eCPM yaklaşık 10–25 $ (2026). `[ARAŞTIRMA S8]` Casual/puzzle ARPDAU yaklaşık 0,03–0,10 $. `[ARAŞTIRMA S9]` Bunlar bölgeye çok bağlı. TR ve gelişmekte olan pazarlarda çok daha düşük `[VARSAYIM]`.
9. **Rewarded izleyen oyuncular daha sadık:** İlk hafta 1 rewarded izleyenlerin D30'u ≥%50, benchmark %13. Bu bir korelasyon, nedensellik değil. `[ARAŞTIRMA S12]`
10. **Interstitial etkisi tartışmalı:** Bir deneyde frekans 1,6× artırılınca IS geliri %23, IAP geliri %9 arttı `[ARAŞTIRMA S13]`. Başka bir kaynak, oturum başına 3 altı interstitial'da %27 daha yüksek retention bildiriyor `[ARAŞTIRMA S14]`. Sonuç: frekans üst sınırı A/B ile belirlenmeli.
11. **Hafif meta + win-streak + booster:** Royal Match bilinçli olarak hafif meta tuttu `[ARAŞTIRMA S15]`. Win-streak booster'ları (Butler's Gift) `[ARAŞTIRMA S16]` ve Toon Blast'ın streak özelliği (%12 aylık gelir etkisi) `[ARAŞTIRMA S17]`. Vortex Blast'ın "tek run" yapısına uyarlanabilir.
12. **Aynı ödülü tekrarlayan günlük çark etkisini kaybeder.** Ödül çeşitliliği gerekli. `[ARAŞTIRMA S18]`
13. **Dağıtım:** TWA, Chrome 72+ ve Digital Asset Links ile PWA'yı Play'e taşır `[ARAŞTIRMA S21]`. Apple için yalnızca uzak URL yükleyen sarmalayıcı 4.2 (minimum işlev) riski taşır. Varlıkları yerel paketlemek ve native özellik eklemek önerilir. `[ARAŞTIRMA S22]` iOS PWA'da `beforeinstallprompt` yok, web push yalnızca ana ekrana eklenmiş uygulamada. `[ARAŞTIRMA S28]`
14. **Uyumluluk:** Google, EEA/UK'de 2024-01-16'dan beri sertifikalı CMP istiyor. Aksi hâlde yalnızca "Limited Ads" gösteriliyor. Önce GDPR mesajı, sonra ATT gösteriliyor. `[ARAŞTIRMA S23]` Çocuklara yönelik veya karma kitlede self-certified ads SDK ve yaş kapısı gerekiyor. `[ARAŞTIRMA S24, S25]` KVKK 2024 değişikliğiyle yurt dışı aktarımda açık rıza yalnızca "arızi" aktarımla sınırlandı. Reklam ve analitik SDK'ları için standart sözleşme gerekiyor. `[ARAŞTIRMA S26]`
15. **Dönen halka + halkalar arası eşleşme** için doğrudan rakip verisi bulunamadı. Zuma tarzı veya dönen halka alt türüne dair indirme/gelir verisi yok. `[VARSAYIM]` Bu boşluk hem fırsat (ayırt edici) hem risk (pazarda kanıtlanmamış mekanik). Soft-launch'ta CPI ve D1 ile test edilmeli.

---

## 1. Core loop karşılaştırması

| Oyun / tip | Çekirdek eylem | Başarısızlık koşulu | Run/seviye süresi | Vortex Blast'a göre fark |
|---|---|---|---|---|
| Toon Blast / Toy Blast (tap-blast) | 2+ aynı rengi dokunarak patlat, hedefli seviye | Hamle biter | Seviye, birkaç dakika `[VARSAYIM]` | VB'de **hamle yok, süre (Core Stability) var**. Tahta statik değil, **döner**. |
| Block Blast (skor odaklı) | Parçaları 8×8'e yerleştir | Yer kalmaz | 40M+ DAU `[ARAŞTIRMA S19]`; oturum yaklaşık 12 dk, günde 2,7 oturum `[ARAŞTIRMA S20]` | VB'de zaman baskısı var, "sakin düşünme" yok. Endless skor ortak. |
| Zuma tipi (dairesel) | Topu fırlat, 3'lü eşleştir | Zincir merkeze ulaşır | Seviye | Dairesel/dönen görsel dil ortak. VB'de **nişan yok, dokunma var**. |
| Hybrid-casual puzzle (Sort/Screw/Block) | Basit tek eylem + meta | Seviye başarısız | Kısa | VB'nin meta'sı (3 upgrade) bu türe göre çok dar `[AS-BUILT]`. |

**Değerlendirme:**
- **Benzersiz yan** `[AS-BUILT computeClusters]`: eşleşme, halkalar arası hizalanmaya bağlı (`tolerance()` = 0,19 rad + 0,024 × magnet). Oyuncu "doğru anı bekleme" kararı veriyor. Bu bir **zamanlama katmanı**, tap-blast türünde yok.
- **Risk:** Zamanlama + süre baskısı birleşince, casual kitle için okunabilirlik zorlaşıyor. FTUE yalnızca ipucu metni `[AS-BUILT drawHUD tip]`.
- **Risk:** Dönen tahta, reklam kreatifinde kanıtlanmamış. `[VARSAYIM]` CPI testi gerekli.

## 2. Meta ve ekonomi örüntüleri
- **Hafif meta, puzzle odağını korur** (Royal Match bölge tabanlı meta testi). `[ARAŞTIRMA S15]` VB için: ağır bir dekor/inşa metası yerine "Core koleksiyonu / tema açma" gibi hafif bir katman uygun.
- **Booster ekonomisi:** Booster'lar oyun içi ödül olarak verilir. Win-streak ile ücretsiz booster döngüsü kurulur. `[ARAŞTIRMA S16, S17]`
- **Season/battle-pass-lite:** Battle pass benimsemesi yıllık yaklaşık %20 arttı `[ARAŞTIRMA S31]`. Casual giriş fiyatı yaklaşık 5,99 $, medyan 9,99 $ `[ARAŞTIRMA S8]`. Puzzle'a özel benimseme verisi yok `[VARSAYIM]`.
- **Kaynak/sink:** VB'de tek kaynak (gem) ve tek sink (3 upgrade) var. Upgrade'ler bitince gem'in kullanım alanı kalmıyor `[AS-BUILT buy, UPGRADES]`. Sayısal analiz GDD §6'da.

## 3. Retention mekanikleri
| Mekanik | Kanıt | VB'de durum | Uygunluk |
|---|---|---|---|
| Win-streak ödülü | S16, S17 | Yok | Endless'e uyarlanır: "art arda X dalgasını geç" serisi |
| Günlük ödül / çark | S18 (çeşitlilik şart) | Yok | Takvim ödülü + çeşitlilik |
| Görev (daily/weekly) | S17 (görevle açılan paket) | Yok | Run içi istatistikler (`blasts`, `maxCombo`, `bombsMade`) zaten sayılıyor `[AS-BUILT]` |
| Daily challenge (sabit seed) | `[VARSAYIM]` tür pratiği | Yok | `Math.random` her yerde. Seed'lenebilir RNG gerekli |
| Başarımlar | `[VARSAYIM]` | Yok | Düşük maliyet |

## 4. Monetizasyon
- **Rewarded revive / 2× gem:** En düşük sürtünmeli yerleşimler. Rewarded izleyenlerde retention korelasyonu yüksek. `[ARAŞTIRMA S12]`
- **Interstitial:** Puzzle'da yaygın `[ARAŞTIRMA S6]`. Gelir artışı ile retention kaybı arasındaki ödünleşim, deneyle belirlenmeli. `[ARAŞTIRMA S13, S14]`
- **No-ads IAP, starter pack, kozmetik:** Hybrid-casual puzzle'da IAP payı artıyor. `[ARAŞTIRMA S10, S30]`
- **Gelir hesabı:** ARPDAU ≈ (gösterim/DAU × eCPM ÷ 1000) + IAP/DAU. Vendor ARPDAU aralıkları yalnızca sağlama için kullanılmalı. Hedefler GDD §9'da `[VARSAYIM]` olarak modellenmiştir.

## 5. Benchmark metrikler (kaynaklı)
| Metrik | Değer | Kapsam / tarih | Kaynak | Güvenilirlik |
|---|---|---|---|---|
| D1 (top %25) | %26,5–27,7 | Tüm türler, 2024 verisi | S1 | Orta-yüksek |
| D7 medyan | %3,4–3,9 (top-%25 %7–8) | Tüm türler, 2024 | S1 | Orta-yüksek |
| D28 | Projelerin %75'i < %3 | Tüm türler, 2024 | S1 | Orta-yüksek |
| "İyi" retention | D1 ≈ %27; D7 %8–14; D30 %3–7 `[ARAŞTIRMA S2]` | 2026, genel | S2 | Düşük-orta (pazarlama) |
| Casual puzzle | D1 %30–40; D7 %10–20; D30 %3–7 | Tarihsiz | S3 | Düşük |
| Hybrid-casual D7 hedefi | %15–20 | 2025 | S4 | Orta-düşük |
| Publisher eşiği | D1 ≥45, D7 ≥15 (puzzle 20), D30 ≥10 | 2023 **(eski)** | S5 | Orta |
| Oturum süresi | Medyan 5–6 dk; top-%25 8–9 dk | 2024 | S1 | Orta-yüksek |
| Oturum/gün | ≈ 4 | 2024 | S1 | Orta-yüksek |
| Rewarded opt-in | %30–60 | Genel | S7 | Düşük |
| Rewarded/kullanıcı (puzzle) | 23,4 | US Android, 06/2024–01/2025 | S6 | Orta |
| Interstitial/kullanıcı (puzzle) | 72,5 | Aynı | S6 | Orta |
| Rewarded eCPM (US iOS) | 10–25 $ | 2026 | S8 | Düşük |
| ARPDAU casual/puzzle | 0,03–0,10 $ | Tarihsiz | S9 | Düşük |

**Bu projede kullanılacak hedef çıpaları** (`03_ROADMAP.md` Go/No-Go):
- D1 ≥ %30 (S1 top-%25 üstü + S3 alt sınırı)
- D7 ≥ %10 (S2 / S3 alt sınırı)
- D30 ≥ %3 (S1/S2/S3 kesişimi)

Bu çıpalar, soft-launch'ta organik ve küçük bütçeli trafik varsayımıyla `[VARSAYIM]` olarak düşürülmüş hedeflerdir.

## 6. Dağıtım
| Yol | Artı | Eksi | Kaynak |
|---|---|---|---|
| **PWA** (manifest + SW) | Sıfır store maliyeti, anında güncelleme, mevcut tek dosyaya uygun | iOS'ta kurulum istemi yok. Push yalnızca ana ekranda. Depolama tahliyesi riski var (save kaybı) | S28 |
| **TWA** (Bubblewrap) | Aynı PWA Play'de yer alır. Chrome 72+ | Native SDK (reklam/IAP) entegrasyonu zayıf, web reklam/ödeme gerekir | S21 |
| **Capacitor** | Native reklam/IAP/haptik eklentileri. iOS 4.2 için native özellik eklenebilir | Build adımı gerekir ("build yok" ilkesi kırılır) | S22 |

## 7. Uyumluluk
- **GDPR/UK + Google UMP:** Sertifikalı CMP zorunlu (2024-01-16'dan beri, aksi hâlde Limited Ads). Rıza geri alınabilir olmalı (ayarlarda "Privacy options"). Mediation partnerleri mesajda listelenmeli. `[ARAŞTIRMA S23]`
- **Apple ATT:** Önce GDPR mesajı, sonra ATT gösterilir. `NSUserTrackingUsageDescription` gerekir. `[ARAŞTIRMA S23]`
- **COPPA / Google Play Families:** Çocuk hedefli veya karma kitlede self-certified ads SDK ve yaş kapısı gerekir. Program başvuru durumu Play Console'da kontrol edilmeli. `[ARAŞTIRMA S24, S25]` VB'nin toon görünümü, Play'in "çocuklara hitap" değerlendirmesini tetikleyebilir `[VARSAYIM]`. Hedef kitle beyanı dikkatle yapılmalı.
- **KVKK:** 7499 sayılı Kanun ile değişiklik (RG 12.03.2024, yürürlük 01.06.2024). Yurt dışı aktarımın üç yolu var: yeterlilik kararı, uygun güvenceler (standart sözleşme) ve arızi aktarım. Açık rıza artık yalnızca arızi aktarım için kullanılabiliyor. `[ARAŞTIRMA S26]` GDPR ile uyumlaştırmanın 2026 Q3'te tamamlanması bekleniyordu. Bugünkü durumu doğrulanmalı. `[ARAŞTIRMA S27]`
- Bu bölüm hukuki tavsiye değildir. Mağaza çıkışından önce uzman görüşü alınmalı. `[VARSAYIM]`

## 8. Bulunamayanlar (açık boşluklar)
- Zuma tarzı veya dönen halka puzzle alt türü için indirme/gelir/retention verisi
- Puzzle'a özel rewarded opt-in oranı
- Türkiye'ye özgü eCPM ve ARPDAU

Bunlarla ilgili her rakam `[VARSAYIM]` olarak işaretlenmiştir. Ölçüm planı GDD §10'da.

---

## Kaynak tablosu (erişim: 2026-10-26)

| No | Başlık | URL | Güvenilirlik notu |
|---|---|---|---|
| S1 | GameDev Reports — GameAnalytics: Mobile gaming benchmarks in 2025 | https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks | Birincil raporun özeti, 2024 verisi. Orta-yüksek |
| S2 | Segwise — Mobile Game User Retention 2026 | https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies.md | Vendor blog. Düşük-orta |
| S3 | Playio — Retention by game genre | https://blog.playio.co/retention-by-game-genre | Tarihsiz, metodoloji yok. Düşük |
| S4 | MAF — Hybrid casual UA strategies | https://maf.ad/en/blog/hybrid-casual-ua-strategies/ | AppMagic verisine atıf. Orta-düşük |
| S5 | WN Hub — publisher retention eşikleri (2023) | https://wnhub.io/news/analytics/item-41307 | Eski (2023). Orta |
| S6 | Appodeal — Mobile Casual Benchmarks Report 2025 | https://files.gameindustrylibrary.com/documents/mobile-casual-benchmarks-report-2025.pdf | 10k+ oyun, US Android. Orta |
| S7 | Layer.ai — Rewarded video (glossary) | https://www.layer.ai/glossary/rewarded-video | Sözlük, kaynaksız aralık. Düşük |
| S8 | MWM — Rewarded video / Battle pass glossary | https://mwm.ai/glossary/rewarded-video | Sözlük. Düşük |
| S9 | Juego Studio — ARPDAU Benchmarks by Genre | https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre | Vendor blog. Düşük |
| S10 | Cinevva — Casual Games Trends 2026 | https://app.cinevva.com/de/guides/casual-games-trends-2026 | Sensor Tower/AppMagic'e atıf. Düşük-orta |
| S11 | Naavik — How niche subgenres are reshaping the mobile puzzle market | https://naavik.co/digest/how-niche-subgenres-are-reshaping-the-mobile-puzzle-market/ | Analist yayını. Orta-yüksek |
| S12 | Unity — Impact of rewarded ads on IAP, retention and engagement | https://unity.com/blog/understanding-the-impact-of-rewarded-ads-on-iap-retention-and-engagement | Vendor, korelasyon. Orta |
| S13 | Airflux — Are interstitial ads really bad for monetization? | https://airflux.ai/blog/interstitial-ads-monetization | Vendor vaka çalışması. Düşük-orta |
| S14 | Playio — Impact of ads on mobile gamers | https://blog.playio.co/impact-of-ads-on-mobile-gamers | İkincil atıf. Düşük |
| S15 | Naavik — Royal Match: finding success through iteration | https://naavik.co/digest/royal-match-finding-success-through-iteration/ | Analist yayını. Orta-yüksek |
| S16 | Medium — Game analysis: Royal Match & Toon Blast | https://medium.com/@ekinmelissezer/game-analysis-for-royal-match-and-toon-blast-9c4bff8ef48b | Bireysel analiz. Düşük-orta |
| S17 | Liquid & Grit — Casual reports | https://www.liquidandgrit.com/category/casual-reports/ | Sektör bülteni. Orta |
| S18 | GameAnalytics blog — ödül/booster tasarımı | https://gameanalytics.com/?p=15379 | Analitik vendor. Orta |
| S19 | PocketGamer.biz — Block Blast surges past 40m DAU | https://www.pocketgamer.biz/block-blast-surges-past-40m-daily-active-users | Haber. Orta-yüksek |
| S20 | Udonis — Block Blast statistics | https://www.blog.udonis.co/statistics/block-blast | Blog. Düşük-orta |
| S21 | Chrome Developers — Trusted Web Activity | https://developer.chrome.com/docs/android/trusted-web-activity | Resmî doküman. Yüksek |
| S22 | Abratabia — App Store submission for web-wrapped games | https://www.abratabia.com/native-wrappers/app-store-submission.php | Rehber, Apple'dan doğrulanmalı. Düşük-orta |
| S23 | Google AdMob — Privacy & messaging (GDPR) | https://developers.google.com/admob/ios/privacy/gdpr | Resmî doküman. Yüksek |
| S24 | Google Play — Families Self-Certified Ads SDK Policy | https://support.google.com/googleplay/android-developer/answer/12918983 | Resmî. Yüksek |
| S25 | Google Play — Families policies | https://support.google.com/googleplay/android-developer/answer/9893335 | Resmî. Yüksek |
| S26 | Erdem & Erdem — KVKK'da Değişiklik | https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-korunmasi-kanununda-degisiklik | Hukuk bürosu. Orta-yüksek |
| S27 | EY — 2025 yılında dijital hukuk alanındaki gelişmeler | https://www.ey.com/content/dam/ey-unified-site/ey-com/tr-tr/services/law/documents/ey-2025-yilinda-dijital-hukuk-alaninda-yasanan-gelismeler.pdf | Danışmanlık. Orta |
| S28 | MagicBell — PWA iOS limitations and Safari support | https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide | Vendor rehberi. Orta |
| S29 | Sensor Tower — Puzzle games creative trends | https://sensortower.com/blog/puzzle-games-creative-trends | 2023 **(eski)**. Orta |
| S30 | GameDev Reports — AppMagic: Top-10 hybrid-casual games Q2'25 | https://gamedevreports.substack.com/p/appmagic-top-10-hybrid-casual-games | AppMagic özeti. Orta |
| S31 | Mobidictum — Battle pass trendi (GameRefinery) | https://mobidictum.com/tr/roblox-pazar-payini-yukseltirken-yeni-trend-battle-pass-oldu/ | Haber. Orta |
