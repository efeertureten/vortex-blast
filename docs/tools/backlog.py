"""Single source of truth for the feature backlog.

Run:  python backlog.py
Writes ../feature_backlog.csv and out/backlog_table.md (embedded in 02_FEATURE_BACKLOG.md) and
out/backlog_stats.md. RICE = Reach × Impact × Confidence ÷ Effort (kişi-gün; 1 kişi-gün = 8 saat).
"""
import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# (ID, Ad, Kategori, Problem/gerekçe, Çözüm, KPI, Reach, Impact, Confidence, Effort, Bağımlılık, Risk, Kabul kriterleri, Dokunulacak alanlar, Faz)
F = [
 ('F-001', 'Analytics event katmanı', 'Analytics & deney',
  '[AS-BUILT] Telemetri yok; tek dış çağrı Google Fonts. Hiçbir tuning kararı veriyle doğrulanamıyor.',
  'Track(name, params) kuyruğu; localStorage tamponu; sendBeacon ile toplu gönderim; endpoint remote config ile; consent yoksa yalnızca anonim sayaç.',
  'Tüm KPI ölçümü', 10, 2, 0.8, 3, '', 'Endpoint/gizlilik maliyeti',
  'GDD §10 şemasındaki 14 event üretimde tetikleniyor; çevrimdışı 200 event tamponlanıp sonra gönderiliyor; frame süresine etkisi <0,2 ms',
  'startGame, doBlast, doBomb, waveUp, gameOver, buy, handleTap, visibilitychange', 'P0'),
 ('F-002', 'Save şeması v2 + migration', 'Teknik/Platform',
  '[AS-BUILT] SAVE_KEY = vortexBlast.save.v1, sürüm alanı ve migration yok; yeni sistemler (görev, envanter) eklenince v1 kırılır.',
  'save.v alanı; migrate(v1→v2) zinciri; yeni alanlar: stats, daily, inventory, settings; bozuk kayıt yedeği.',
  'D1/D7 (veri kaybı churn)', 10, 1, 1.0, 1.5, '', 'Migration hatası = ilerleme kaybı',
  'v1 kaydı v2ye kayıpsız taşınıyor (gems/best/upg/muted); bozuk JSON yedeğe alınıp varsayılanla açılıyor; birim test 6 senaryo geçiyor',
  'load(), persist(), save, SAVE_KEY', 'P0'),
 ('F-003', 'Test kancasını üretimde kapat', 'Teknik/Platform',
  '[AS-BUILT] window.__vortex.setStability üretimde açık; konsoldan sonsuz run/skor hilesi.',
  '__vortex yalnızca ?debug=1 veya localhost iken tanımlanır; setStability kaldırılır, salt-okunur kalır.',
  'Skor/leaderboard güvenilirliği', 10, 0.5, 1.0, 0.25, '', 'Otomatik testler kancaya bağımlı',
  'Üretim URLsinde window.__vortex undefined; ?debug=1 ile headless test geçiyor',
  'window.__vortex bloğu', 'P0'),
 ('F-004', 'Pause butonu', 'FTUE & UX',
  '[AS-BUILT] Yalnızca visibilitychange auto-pause ve drawer; oyun içinde bilinçli duraklatma yok.',
  'HUD sol üstte (mute yanında) pause; duraklatma paneli: devam / ayarlar / ana menü.',
  'Oturum süresi, rage-quit', 9, 1, 1.0, 0.75, '', 'Pause-scumming (dönüşü durdurup plan yapma)',
  'Pause sırasında simulate çalışmıyor; panelde 3 eylem; resume sonrası 0,5 sn geri sayım',
  'drawHUD, handleTap, update, autoPaused', 'P1'),
 ('F-005', 'Ayarlar ekranı', 'FTUE & UX',
  '[AS-BUILT] Yalnızca mute (MUTE_BTN, M kısayolu). Müzik/haptik/hareket/dil/gizlilik ayarı yok.',
  'Ayarlar paneli: SFX, müzik, haptik, reduced motion, dil, gizlilik seçenekleri, save sıfırla (onaylı).',
  'Erişilebilirlik, consent zorunluluğu', 8, 1, 0.8, 2.5, 'F-002', 'UI yoğunluğu 540x960de',
  'Tüm ayarlar save.settingsde kalıcı; panel 400 px genişlikte taşmıyor; reset iki adımlı onay',
  'drawMute, handleTap, Snd.setMuted, buzz, save', 'P1'),
 ('F-006', 'Etkileşimli FTUE (ilk 120 sn)', 'FTUE & UX',
  '[AS-BUILT] FTUE yalnızca yanıp sönen ipucu metni (drawHUD tip); halkalar arası eşleşme ve zamanlama hiç öğretilmiyor.',
  'İlk run: drain %0 → kademeli; el işaretiyle 1) halka içi küme 2) halka-arası hizalama bekle 3) 6+ ile bomba 4) bomba kullan. Adım geçince drain normale döner.',
  'D1, FTUE tamamlama', 10, 3, 0.8, 4, 'F-001, F-018', 'Fazla el tutma sıkar',
  'FTUE adım-tamamlama hunisi ölçülüyor; ilk runda ölüm oranı ilk 60 sn içinde <%5; FTUE atlanabilir',
  'drainRate, tapBoard, drawHUD, fillBoardFresh, spawnColor', 'P1'),
 ('F-007', 'Reduced motion + sarsıntı/flash/haptik kapatma', 'Erişilebilirlik',
  '[AS-BUILT] shake, flashA, boardPunch, buzz her zaman açık; prefers-reduced-motion okunmuyor.',
  'settings.motion: tam/azaltılmış; prefers-reduced-motion varsayılanı; shake×0,2, flash kapalı, jel salınımı azaltılmış.',
  'Erişilebilirlik, store değerlendirmesi', 4, 1, 1.0, 1, 'F-005', 'Juice kaybı',
  'Reduced modda flash alfa 0, shake ≤3 px; ayar kapatılınca tam juice geri geliyor',
  'drawBoard (shake), render (flashA), buzz, geom (jel)', 'P1'),
 ('F-008', 'Dinamik müzik (Web Audio, stability-reaktif)', 'Juice/Audio/Müzik',
  '[AS-BUILT] Müzik yok; yalnızca sentezlenmiş SFX (Snd).',
  'Sentezlenmiş 4 katmanlı döngü (bas, pad, arp, perküsyon); stability <%25te tempo/filtre değişimi; combo ile arp yoğunluğu.',
  'Oturum süresi', 8, 1, 0.5, 4, 'F-005', 'Mobil CPU/pil; mevcut SFX ile çakışma',
  'Müzik açıkken ortalama frame süresi artışı <0,5 ms; ayrı ses düzeyi; SFX ducking',
  'Snd (yeni music modülü), update', 'P2'),
 ('F-009', 'PWA: manifest + service worker + font self-host', 'Teknik/Platform',
  '[AS-BUILT] Manifest/SW/ikon yok; Google Fonts harici → çevrimdışında Lilita/Fredoka düşer.',
  'manifest.webmanifest, sw.js (cache-first), 192/512 ikon, fontlar base64 veya yerel woff2.',
  'Tekrar ziyaret (D7), çevrimdışı oynanış', 6, 1, 0.8, 2, '', 'Tek dosya ilkesi (SW ayrı dosya)',
  'Lighthouse PWA installable; uçak modunda tam açılış, doğru fontlar',
  '<head>, FD/FB font yığınları', 'P1'),
 ('F-010', 'Rewarded revive (run başına 1)', 'Monetizasyon',
  '[AS-BUILT] gameOver() doğrudan dying durumuna geçiyor; devam etme yok.',
  'dying başında 3 sn kart: "Reklam izle → %50 stability ile devam"; run başına 1 kez; reklam yoksa gizli.',
  'Rewarded opt-in, ARPDAU, run süresi', 7, 2, 0.8, 3, 'F-013, F-001', 'Bomba/drain dengesi bozulur',
  'Opt-in oranı ölçülüyor; revive sonrası 1,5 sn drain koruması; run başına en fazla 1',
  'gameOver, update (dying), drawOver', 'P3'),
 ('F-011', 'Run sonu 2× gem (rewarded)', 'Monetizasyon',
  '[AS-BUILT] drawOver runGemsi gösteriyor ama katlama yok.',
  'Run sonu kartında "2× gem" rewarded butonu.',
  'ARPDAU, upgrade hızı', 7, 1, 0.8, 1, 'F-013', 'Ekonomi enflasyonu',
  'Butona tek dokunuş; reklam tamamlanınca runGems kadar ek gem; günde ≤5',
  'drawOver, handleTap, addGems', 'P3'),
 ('F-012', 'No-ads IAP', 'Monetizasyon',
  'Interstitial eklenirse rahatsız oyuncu için çıkış yolu yok [ARAŞTIRMA S13,S14].',
  'Tek seferlik IAP: interstitial kapalı + günlük 1 bonus.',
  'IAP dönüşüm', 3, 1, 0.5, 3, 'F-013, F-031', 'Web\'de ödeme altyapısı yok',
  'Satın alma sonrası interstitial çağrısı 0; restore purchases çalışıyor',
  'Ads adapter, save.entitlements', 'P4'),
 ('F-013', 'Reklam soyutlama katmanı (adapter)', 'Monetizasyon',
  'Platform bağımsız reklam çağrısı yok; web/TWA/Capacitor farklı SDK ister.',
  'Ads.showRewarded(placement) → Promise<bool>; uygulamalar: mock, web (AdSense H5 [VARSAYIM]), AdMob (Capacitor).',
  'Monetizasyon önkoşulu', 7, 1, 0.8, 3, 'F-001', 'SDK onay süreçleri',
  'Mock ile tüm yerleşimler uçtan uca test ediliyor; reklam yüklenemezse buton gizleniyor',
  'yeni Ads modülü, drawOver', 'P3'),
 ('F-014', 'Günlük ödül takvimi (7 gün)', 'Retention/LiveOps',
  '[AS-BUILT] Günlük ödül/streak yok.',
  '7 günlük takvim: gem + booster karışık (çeşitlilik [ARAŞTIRMA S18]); kaçırılınca 1. güne dönmez, bekler.',
  'D1→D7', 8, 1, 0.8, 2, 'F-002', 'Saat hilesi',
  'Yerel tarih değişiminde 1 kez claim; 7 gün sonra döngü; saat geri alma claim üretmiyor',
  'save.daily, title ekranı', 'P1'),
 ('F-015', 'Günlük görevler (3/gün)', 'Retention/LiveOps',
  '[AS-BUILT] blasts, maxCombo, bombsMade, wave sayılıyor ama hedefe bağlanmıyor.',
  'Günde 3 görev (ör. "x6 combo yap", "3 bomba üret", "Dalga 8e ulaş"); tamamlama gem + booster.',
  'D7, oturum/gün', 8, 2, 0.8, 3, 'F-002, F-001', 'Görev sıkıcılığı',
  'Görev ilerlemesi run içinde canlı; 15 görev şablonu; günlük yenileme yerel gece yarısı',
  'doBlast, doBomb, waveUp, gameOver, drawOver', 'P1'),
 ('F-016', 'Başarımlar (20)', 'Retention/LiveOps',
  'Uzun vadeli hedef yok.',
  '20 başarım (kademeli); gem ödülü; profil ekranı.',
  'D30', 6, 0.5, 0.8, 2, 'F-002', 'Düşük etki',
  '20 başarım tanımlı ve save\'de; geriye dönük v1 bestten açılanlar veriliyor',
  'save.stats, drawOver', 'P2'),
 ('F-017', 'Daily Challenge (seed\'li run)', 'Modlar',
  'Tek mod endless; tekrar sebebi sadece best.',
  'Günün seedi (tarih hash); herkes aynı tahta/spawn; günde 1 skor kaydı; ödül.',
  'D7, oturum/gün', 6, 2, 0.5, 4, 'F-018', 'Halka hızı simTye bağlı → aynı seed aynı run değil',
  'Aynı seed iki cihazda aynı ilk 30 spawnı üretiyor; günde 1 resmi deneme',
  'fillBoardFresh, spawnColor, simT başlangıcı', 'P2'),
 ('F-018', 'Seed\'lenebilir oyun RNG', 'Teknik/Platform',
  '[AS-BUILT] Oynanış Math.random kullanıyor (newBlock rengi, spawnColor, fillBoardFresh).',
  'Oyun RNG\'si (mulberry32) ve kozmetik RNG ayrımı; seed run başında atanır.',
  'Test edilebilirlik, Daily Challenge', 10, 0.5, 1.0, 0.75, '', 'Yok denecek kadar az',
  'Aynı seed + aynı tap dizisi → aynı skor (headless test)',
  'fillBoardFresh, spawnColor, startGame', 'P0'),
 ('F-019', 'Zorluk yeniden dengesi (bomba döngüsü + drain tavanı)', 'Core loop & zorluk',
  '[AS-BUILT] Model (GDD §5): skilled bot %100 oranda 900 sn tavanına ulaşıyor (doBomb +20 stability; drainRate dalga 13te 20%/snde sabit). Gem&Score Boost skoru çarptığı için dalgaları hızlandırıyor: novice medyan run 84 sn (upgrade yok) → 43 sn (maks.). Maks. upgrade\'li casual oyuncunun %29\'u 900 sn tavanına ulaşıyor.',
  'PROPOSED seti (vb_model.PROPOSED): dalga eşiği çarpansız skorla (base score); bomba dolumu 20 kalır (12 denendi, Bomb Threshold upgrade\'ini zararlı yaptı); drain tavanı 24, tavan sonrası +0,6/dalga; combo penceresi 1,8→1,3 sn. Remote config ile A/B.',
  'Run süresi dağılımı, D1', 10, 2, 0.8, 2, 'F-001, F-036', 'Mevcut oyuncu algısı',
  'Model (out/tuning_compare.md): skilled tavana ulaşma oranı %0; maks. upgrade ile novice medyan run, upgrade\'siz değerden kısa değil; casual medyan 90–180 sn',
  'drainRate, doBomb, doBlast (skor), waveScore kontrolü (simulate), COMBO_WINDOW, docs/tools/vb_model.py', 'P0'),
 ('F-020', 'Yeni blok: Kilitli blok', 'Yeni blok/engel türleri',
  '[AS-BUILT] Blok türleri yalnızca 4 renk + bomba; dalga ilerleyince yeni karar yok.',
  'Dalga 4+ spawnlarında %6 kilitli; komşusu patlayınca kilit açılır; o zamana dek kümeye katılmaz.',
  'Run derinliği, D7', 8, 1, 0.5, 3, 'F-018', 'Okunabilirlik',
  'Kilit görseli 400 px ekranda seçilebilir; spawn oranı remote config; model ile run süresi etkisi ölçülmüş',
  'newBlock, spawnColor, computeClusters, drawBlock, buildBlockSprites', 'P2'),
 ('F-021', 'Yeni blok: Joker (prizma)', 'Yeni blok/engel türleri',
  'Büyük küme yaratma aracı yalnızca şans + magnet.',
  'Her renkle eşleşir; 7+ blast ödülü veya booster; küme rengini komşular belirler.',
  'Ortalama küme boyu, keyif', 7, 1, 0.8, 2, '', 'Küme algoritması belirsizliği (iki renk köprüsü)',
  'Joker en fazla tek kümeye ait; birim testte 5 köprü senaryosu',
  'computeClusters, newBlock, drawBlock', 'P2'),
 ('F-022', 'Renk bombası', 'Booster/power-up',
  'Tek güç bloğu (Vortex Bomb) var.',
  '9+ blast ile üretilir; dokununca o renkteki tüm blokları patlatır.',
  'Combo/juice, run derinliği', 7, 1, 0.8, 2, '', 'Stability dengesine etkisi',
  'Model ile ortalama run süresi değişimi raporlanmış; görsel ayırt edilebilir',
  'doBlast, newBlock, tapBoard, drawBlock', 'P2'),
 ('F-023', 'Run öncesi booster\'lar', 'Booster/power-up',
  'Gem için upgrade dışında sink yok.',
  '3 booster: Başlangıç bombası, %20 kalkan (ilk ölümde %30 ile devam), 30 sn magnet+2; gem ile veya ödül olarak.',
  'Gem sink, oturum başına run', 7, 2, 0.5, 4, 'F-024', 'Pay-to-win algısı',
  'Seçim ekranı 1 dokunuşta; booster etkisi run sonu özetinde görünüyor',
  'startGame, drawTitle, drawOver', 'P2'),
 ('F-024', 'Booster envanteri', 'Meta & ekonomi',
  'Ödül çeşitliliği için tek kaynak (gem) yetersiz [ARAŞTIRMA S18].',
  'save.inventory {bomb, shield, magnet}; ödül kaynakları: günlük, görev, başarım.',
  'Retention ödül çeşitliliği', 7, 1, 0.8, 1.5, 'F-002', 'Envanter şişmesi',
  'Envanter save v2de; maksimum 99/tür; UIda sayaç',
  'save, drawDrawer', 'P2'),
 ('F-025', 'Upgrade ağacını genişlet (yeni sink)', 'Meta & ekonomi',
  '[AS-BUILT] 3 upgrade, toplam maliyet hesaplandı (GDD §6); bitince gemin kullanım yeri kalmıyor.',
  '+3 upgrade: Combo Window (+0,2 sn/sv), Core Shield (başlangıç stability +5/sv), Spawn Harmony (spawnColor eşleşme %22→%34); drawer kaydırma.',
  'D30, gem sink', 8, 2, 0.8, 3, 'F-002', 'Güç enflasyonu (F-019 ile çatışır)',
  'Model: tüm upgrade\'leri maksimuma çıkarma süresi 20–30 saat bandında; drawer 6 kartı kaydırarak gösteriyor',
  'UPGRADES, drawDrawer, buyRect, COMBO_WINDOW, spawnColor', 'P2'),
 ('F-026', 'Kozmetik temalar (Core + blok)', 'Meta & ekonomi',
  'Kozmetik yok; ikonlar/renkler sabit (COLORS, ICONS).',
  '4 tema (Neon, Okyanus, Şeker, Galaksi); gem veya IAP; sprite cache temaya göre yeniden kurulur.',
  'Gem sink, IAP', 6, 1, 0.5, 5, 'F-024', 'Renk körlüğü okunabilirliği temada bozulabilir',
  'Tema değişimi <100 ms (buildBlockSprites); her temada ikon şekilleri korunuyor',
  'COLORS, makeIcon, buildBlockSprites, buildBg', 'P5'),
 ('F-027', 'Win-streak bonusu', 'Retention/LiveOps',
  'Art arda iyi oynamanın ödülü yok; türde etkili [ARAŞTIRMA S16,S17].',
  'Dalga 5+ biten her run streak+1; streak 1/2/3+: başlangıç stability +5/+10/+15; ölüm <dalga 5 sıfırlar.',
  'Oturum başına run', 6, 1, 0.5, 1.5, 'F-002', 'Kayıp hissi (frustration)',
  'Streak HUDda; sıfırlanma ekranında kayıp net gösteriliyor',
  'startGame, gameOver, drawTitle', 'P2'),
 ('F-028', 'Boss dalga (her 5 dalgada)', 'Modlar',
  'Zorluk eğrisi yalnızca drain + halka hızı (ringSpeed wf).',
  'Dalga 5/10/15...: 20 sn boyunca bir halka ters ve 1,6x hızlı + kilitli blok yağmuru; temizlenince gem.',
  'Run zirveleri, paylaşım', 7, 2, 0.5, 5, 'F-020', 'Kaos/okunabilirlik',
  'Boss başlangıç ve bitişi banner+ses ile; model ile ölüm oranı artışı ≤ +%15',
  'ringSpeed, waveUp, banner, spawnColor', 'P2'),
 ('F-029', 'Zen modu', 'Modlar',
  'Rahat oynamak isteyen için mod yok.',
  'Drain yok, dalga yok, gem kazancı ×0,25.',
  'Oturum süresi (alt segment)', 4, 0.5, 0.8, 1, '', 'Ana modu yamyamlar',
  'Zen modunda gem/dk ≤ ana modun %25i',
  'update, drainRate, drawTitle', 'P4'),
 ('F-030', 'Paylaşılabilir skor kartı', 'Sosyal',
  '[AS-BUILT] Skor yalnızca yerel best; paylaşım yok.',
  'Run sonu: canvas\'tan 1080x1920 kart; Web Share API (dosya), desteklenmiyorsa indirme.',
  'Organik K-faktör', 5, 0.5, 0.8, 1.5, '', 'Platform desteği değişken',
  'Android Chromeda paylaşım sayfası açılıyor; kart 300 ms altında üretiliyor',
  'drawOver, handleTap', 'P2'),
 ('F-031', 'Store paketleme (Capacitor)', 'Teknik/Platform',
  'Store yok; native reklam/IAP için gerekli [ARAŞTIRMA S22].',
  'Capacitor projesi; www/ = index.html; AdMob + IAP eklentileri; haptik native.',
  'Erişim, monetizasyon', 6, 2, 0.5, 8, 'F-009, F-034, F-033', 'Build adımı, inceleme reddi (4.2)',
  'Android iç test kanalında yayında; iOS TestFlight; 60 fps orta segment cihazda',
  'Proje kökü (yeni), Ads adapter', 'P4'),
 ('F-032', 'Lokalizasyon altyapısı (TR/EN)', 'Lokalizasyon',
  '[AS-BUILT] Tüm metinler hard-coded İngilizce (banner, txt çağrıları).',
  'STR tablosu + t(key); navigator.language; TR ve EN; uzun metin için otomatik font küçültme.',
  'Erişim (TR pazarı), store dönüşümü', 7, 1, 0.8, 2.5, '', 'Metin taşması',
  'Tüm kullanıcı metinleri t() üzerinden; TR\'de taşma yok (otomatik test 400 px)',
  'txt, banner, drawHUD, drawOver, drawDrawer, UPGRADES', 'P1'),
 ('F-033', 'Consent (CMP) + gizlilik politikası + yaş kapısı', 'Uyumluluk',
  'Reklam/analitik eklendiğinde zorunlu [ARAŞTIRMA S23–S26].',
  'İlk açılışta yaş kapısı; EEA/UK için sertifikalı CMP; TR için KVKK aydınlatma metni; ayarlarda privacy options.',
  'Yasal uyum, Limited Ads riskini önleme', 7, 1, 0.8, 3, 'F-013', 'Hukuki yorum hatası',
  'Consent yokken kişiselleştirilmiş reklam ve analitik ID gönderilmiyor; ayarlardan rıza geri alınabiliyor',
  'Ads adapter, Track, ayarlar', 'P3'),
 ('F-034', 'Modülerleşme: native ES modules (build yok)', 'Teknik/Platform',
  '[AS-BUILT] Tek dosya ~1400 satır; her özellik eklemesi bakım maliyetini artırıyor.',
  'src/*.js ES modülleri (config, audio, render, sim, ui, meta); index.html <script type=module>; dağıtım için isteğe bağlı tek dosya inline scripti (python).',
  'Geliştirme hızı', 10, 0.5, 0.8, 3, 'F-035', 'file:// altında ES module CORS → yerel sunucu gerekir',
  'Davranış birebir aynı (headless parity testi); hiçbir modül 400 satırı aşmıyor',
  'Tüm dosya', 'P2'),
 ('F-035', 'Otomatik test: headless smoke + model parity', 'Teknik/Platform',
  'Test yok; dengeleme modeli (vb_model.py) ile JS arasında sapma riski.',
  'Headless Chrome: açılış, hata yok, 1 blast, skor artışı; parity: aynı seed ile JS ve Python modelinin ilk 50 settle sonucu eşit.',
  'Kalite', 10, 0.5, 0.8, 2, 'F-018, F-003', 'Headless rAF zamanlaması',
  'Tek komutla çalışıyor; CI\'sız yerelde <60 sn',
  'docs/tools (yeni test), window.__vortex (debug)', 'P0'),
 ('F-036', 'Remote config + A/B atama', 'Analytics & deney',
  'Tuning sabitleri koda gömülü (drainRate, UPGRADES).',
  'config.json fetch (timeout 1,5 sn, yerel varsayılan); kullanıcı ID hash ile kova; event\'lere variant parametresi.',
  'Deney hızı', 10, 1, 0.8, 2, 'F-001', 'Yanlış config ile oyun kırılması',
  'Geçersiz config yerel varsayılana düşüyor; 2 varyantlı deney uçtan uca raporlanıyor',
  'drainRate, UPGRADES, doBomb sabitleri', 'P0'),
 ('F-037', 'Hafif anti-cheat (save checksum + sınır)', 'Teknik/Platform',
  '[AS-BUILT] localStorage düz JSON; gem düzenlemesi kolay.',
  'Save HMAC benzeri checksum (gizli değil, caydırıcı); gems/best makul sınır; şüpheli kayıtlar leaderboard dışı.',
  'Leaderboard güveni', 3, 0.25, 0.8, 1, 'F-002', 'Gerçek güvenlik değil',
  'Elle düzenlenen save tespit edilip işaretleniyor; meşru oyuncu etkilenmiyor',
  'load, persist', 'P4'),
 ('F-038', 'Son şans anı (low-stability slow-mo)', 'Juice/Audio/Müzik',
  '[AS-BUILT] Stability <%25te yalnızca tick sesi + vinyet; ölüm ani.',
  'Run başına 1 kez stability %8in altına inince 0,8 sn zaman ×0,5 + kalp atışı; oyuncuya kurtarma şansı.',
  'Run süresi, near-miss hissi', 8, 0.5, 0.5, 1, '', 'Zorluğu düşürür',
  'Run başına en fazla 1; model ile run süresi etkisi ≤ +%5',
  'update, Snd.tick, render', 'P2'),
 ('F-039', 'Renk körü modu (desen katmanı)', 'Erişilebilirlik',
  '[AS-BUILT] İkonlar (flame/drop/star/leaf) zaten şekille ayırıyor; gradyanlar benzer tonda.',
  'Ayarda yüksek kontrast: blok kenarına desen (çizgili/noktalı) + daha koyu kontur.',
  'Erişilebilirlik', 3, 0.5, 0.8, 1.5, 'F-005', 'Görsel gürültü',
  'Deuteranopi simülasyonunda 4 renk ayırt edilebilir',
  'paintBody, buildBlockSprites', 'P2'),
 ('F-040', 'Sezon pass-lite (30 gün)', 'Retention/LiveOps',
  'Uzun vadeli hedef/LiveOps yok; türde yaygınlaşıyor [ARAŞTIRMA S31].',
  'Görev puanı ile 30 kademe; ücretsiz + premium şerit (kozmetik/booster).',
  'D30, IAP', 5, 1, 0.5, 6, 'F-015, F-031, F-026', 'İçerik üretim yükü',
  '30 kademe içerik tanımlı; ücretsiz şerit tek başına tamamlanabilir',
  'yeni sezon modülü', 'P5'),
 ('F-041', 'Event şablonu (hafta sonu 2× gem vb.)', 'Retention/LiveOps',
  'LiveOps aracı yok.',
  'Remote config\'te tarih aralıklı çarpanlar (gem, görev ödülü, booster).',
  'DAU zirveleri', 6, 0.5, 0.8, 1, 'F-036', 'Yanlış tarih/saat dilimi',
  'Event başlangıç/bitişi UTC ile doğru; HUD rozetinde gösteriliyor',
  'addGems, drawTitle', 'P3'),
 ('F-042', 'Yerel skor geçmişi (top 10)', 'Sosyal',
  '[AS-BUILT] Yalnızca save.best.',
  'Son 10 run + en iyi 10; trend grafiği yok, liste.',
  'Hedef koyma', 6, 0.5, 0.8, 1, 'F-002', 'Düşük',
  'Run sonrası liste güncel; save boyutu <4 KB',
  'gameOver, drawOver', 'P2'),
 ('F-043', 'Run sonu "sonraki hedef" kartı', 'FTUE & UX',
  '[AS-BUILT] drawOver yalnızca drawerı işaret ediyor; oyuncuya net hedef verilmiyor.',
  'En yakın upgrade için kalan gem, en yakın görev, best\'e kalan skor.',
  'Oturum başına run, D1', 9, 1, 0.8, 1, '', 'Ekran kalabalığı',
  'Kartta en fazla 2 hedef; PLAY AGAIN butonunun konumu değişmiyor',
  'drawOver, anyAffordable', 'P1'),
 ('F-044', 'Gem ekonomisi yeniden ölçekleme', 'Meta & ekonomi',
  '[AS-BUILT] Upgrade\'lerin tamamı 8.561 gem; model: casual oyuncu tümünü medyan 4 runda (≈25 dk), novice ≈31 runda (≈27 dk) bitiriyor → meta ilk oturumda tükeniyor.',
  'Tüm gem kaynaklarına GEM_RATE = 0,15 (kesirli birikim, runGemFrac); dalga ödülü dahil. F-025 yeni sinkleri ile birlikte.',
  'D7/D30, gem sink süresi', 10, 2, 0.8, 1, 'F-002', 'Mevcut oyuncuların kazanç algısı (eski save\'lerde gem korunur)',
  'Model (out/progression_compare.md): casual için mevcut 3 upgrade\'i bitirme ≥ 50 run (ölçülen: 61,5); ≥ 100 run hedefi F-025 yeni sinkleriyle birlikte; ilk upgrade ≤ 2. run; run sonu gem sayısı tam sayı gösteriliyor',
  'addGems, doBlast, doBomb, waveUp, drawOver', 'P0'),
]

# Roadmap phase per feature (03_ROADMAP.md). 'Later' = cut from the 2026-11 → 2027 plan (capacity).
PHASE = {
    'P0': ['F-001', 'F-002', 'F-003', 'F-018', 'F-019', 'F-035', 'F-036', 'F-044'],
    'P1': ['F-004', 'F-005', 'F-006', 'F-007', 'F-009', 'F-014', 'F-015', 'F-032', 'F-043'],
    'P2': ['F-021', 'F-022', 'F-024', 'F-025', 'F-027', 'F-030', 'F-034', 'F-038', 'F-042'],
    'P3': ['F-013', 'F-031', 'F-033', 'F-037'],
    'P4': ['F-010', 'F-011', 'F-012', 'F-041'],
    'Later': ['F-008', 'F-016', 'F-017', 'F-020', 'F-023', 'F-026', 'F-028', 'F-029', 'F-039', 'F-040'],
}
PHASE_OF = {fid: p for p, ids in PHASE.items() for fid in ids}

# Implementation status in index.html (2026-10-26, branch dev/roadmap). 'Kısmi' says what is missing.
DONE = 'Uygulandı'
STATUS = {fid: DONE for fid in PHASE_OF}
STATUS.update({
    'F-031': 'Kısmi: Capacitor iskeleti + AdMob/UMP kodu hazır; derleme/test yapılmadı (Node/Android Studio yok) — docs/STORE.md',
    'F-012': 'Kısmi: no-ads yetkisi ve interstitial atlama hazır; mağaza satın alma eklentisi yok',
    'F-040': 'Kısmi: ücretsiz 30 kademe çalışıyor; premium şerit IAP gelene kadar kilitli',
    'F-034': 'Uygulandı (değiştirilmiş): src/ bölüm dosyaları + tools/build.py → tek index.html (ES modules yerine; ADR-2)',
})
assert sorted(PHASE_OF) == sorted(f[0] for f in F), 'every feature needs exactly one phase'
F = [f[:-1] + (PHASE_OF[f[0]],) for f in F]

FIELDS = ['ID', 'Ad', 'Kategori', 'Problem/gerekçe', 'Çözüm özeti', 'Etkilediği KPI', 'Reach', 'Impact',
          'Confidence', 'Effort (kişi-gün)', 'RICE', 'Bağımlılıklar', 'Risk', 'Kabul kriterleri',
          'Dokunulacak fonksiyonlar/alanlar', 'Faz', 'Durum']

rows = []
for f in F:
    (fid, ad, kat, prob, coz, kpi, R, I, C, E, dep, risk, kabul, dok, faz) = f
    rice = round(R * I * C / E, 2)
    rows.append(dict(zip(FIELDS, [fid, ad, kat, prob, coz, kpi, R, I, f'{int(C * 100)}%', E, rice, dep, risk, kabul, dok, faz, STATUS[fid]])))

with open(os.path.join(HERE, '..', 'feature_backlog.csv'), 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.DictWriter(fh, fieldnames=FIELDS)
    w.writeheader(); w.writerows(rows)


def cell(v):
    return str(v).replace('|', '\\|').replace('\n', ' ')


md = ['| ' + ' | '.join(FIELDS) + ' |', '|' + '---|' * len(FIELDS)]
md += ['| ' + ' | '.join(cell(r[k]) for k in FIELDS) + ' |' for r in rows]
with open(os.path.join(OUT, 'backlog_table.md'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(md) + '\n')

# ranking + totals per phase
rank = sorted(rows, key=lambda r: -r['RICE'])
lines = ['| Sıra | ID | Ad | RICE | Effort | Faz |', '|---:|---|---|---:|---:|---|']
lines += [f"| {i + 1} | {r['ID']} | {r['Ad']} | {r['RICE']} | {r['Effort (kişi-gün)']} | {r['Faz']} |" for i, r in enumerate(rank)]
phase = {}
for r in rows:
    phase[r['Faz']] = phase.get(r['Faz'], 0) + r['Effort (kişi-gün)']
lines += ['', '| Faz | Özellik sayısı | Toplam effort (kişi-gün) |', '|---|---:|---:|']
for p in sorted(phase):
    lines.append(f"| {p} | {sum(1 for r in rows if r['Faz'] == p)} | {phase[p]:g} |")
lines.append(f"| **Toplam** | **{len(rows)}** | **{sum(phase.values()):g}** |")
qw = [r for r in rank if r['Effort (kişi-gün)'] <= 2 and r['RICE'] >= 4]
lines += ['', '**Quick wins** (effort ≤ 2 kişi-gün ve RICE ≥ 4):', '', '| ID | Ad | RICE | Effort | Faz |', '|---|---|---:|---:|---|']
lines += [f"| {r['ID']} | {r['Ad']} | {r['RICE']} | {r['Effort (kişi-gün)']} | {r['Faz']} |" for r in qw]
n_done = sum(1 for r in rows if r['Durum'].startswith('Uygulandı'))
lines += ['', f"**Uygulama durumu:** {n_done}/{len(rows)} uygulandı, "
          f"{sum(1 for r in rows if r['Durum'].startswith('Kısmi'))} kısmi."]
cats = sorted({r['Kategori'] for r in rows})
lines += ['', f'Kategori sayısı: {len(cats)} — ' + ', '.join(cats)]
with open(os.path.join(OUT, 'backlog_stats.md'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(lines) + '\n')
print('\n'.join(lines))

# ---------------------------------------------------------------- capacity + gantt (03_ROADMAP.md)
import datetime as dt
import math

DAYS_PER_WEEK = 20 / 8          # 20 h/week, 1 kişi-gün = 8 h  → 2.5 kişi-gün/hafta
BUFFER = 1.2                    # %20 tampon (test, bug, mağaza incelemesi)
START = dt.date(2026, 11, 2)
MEASURE = {'P1': 2, 'P4': 4}    # ölçüm penceresi (hafta) — kod yazılmaz, kohort verisi toplanır
NAMES = {'P0': 'Hardening & Instrumentation', 'P1': 'Retention çekirdeği', 'P2': 'İçerik derinliği',
         'P3': 'Platform + monetizasyon altyapısı', 'P4': 'Monetizasyon soft-launch'}
cap = ['| Faz | Ad | Effort (kişi-gün) | Saf hafta | Tamponlu hafta | Ölçüm (hafta) | Başlangıç | Bitiş |',
       '|---|---|---:|---:|---:|---:|---|---|']
gantt = ['gantt', '    title Vortex Blast yol haritası', '    dateFormat YYYY-MM-DD', '    axisFormat %d %b']
d = START; tot_e = tot_w = 0
for p in ('P0', 'P1', 'P2', 'P3', 'P4'):
    e = sum(r['Effort (kişi-gün)'] for r in rows if r['Faz'] == p)
    raw = e / DAYS_PER_WEEK
    wk = math.ceil(raw * BUFFER)
    mw = MEASURE.get(p, 0)
    end = d + dt.timedelta(weeks=wk + mw) - dt.timedelta(days=1)
    cap.append(f'| {p} | {NAMES[p]} | {e:g} | {raw:.1f} | {wk} | {mw} | {d} | {end} |')
    gantt.append(f'    section {p} {NAMES[p]}')
    gantt.append(f'    Geliştirme ({e:g} kg) :{p.lower()}, {d}, {wk * 7}d')
    if mw:
        gantt.append(f'    Ölçüm penceresi :{p.lower()}m, after {p.lower()}, {mw * 7}d')
    tot_e += e; tot_w += wk + mw
    d = end + dt.timedelta(days=1)
later = sum(r['Effort (kişi-gün)'] for r in rows if r['Faz'] == 'Later')
cap.append(f'| **P0–P4** | | **{tot_e:g}** | | | | **{START}** | **{d - dt.timedelta(days=1)}** ({tot_w} hafta) |')
cap.append(f'| Later (kesildi) | P5 LiveOps & genişleme adayı | {later:g} | {later / DAYS_PER_WEEK:.1f} | {math.ceil(later / DAYS_PER_WEEK * BUFFER)} | | — | — |')
with open(os.path.join(OUT, 'capacity.md'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(cap) + f'\n\nKapasite: 20 sa/hafta = {DAYS_PER_WEEK} kişi-gün/hafta; tampon ×{BUFFER}.\n')
with open(os.path.join(OUT, 'gantt.md'), 'w', encoding='utf-8') as fh:
    fh.write('```mermaid\n' + '\n'.join(gantt) + '\n```\n')
print('\n'.join(cap)); print('\n'.join(gantt))
