# docs/tools — hesap scriptleri

Yalnızca Python 3 standart kütüphanesi kullanılır, paket kurulumu gerekmez (`python` veya `python3`). Komutlar bu klasörden çalıştırılır.

| Script | Ne yapar | Çıktı | Süre (bu makinede) |
|---|---|---|---|
| `vb_model.py` | `index.html` oynanış kurallarının headless Python portu + oyuncu botları (kütüphane) | — | — |
| `vb_analysis.py` | As-built: upgrade maliyetleri, 3 bot × 3 upgrade seti run simülasyonu, dalga tablosu 1–20, "tüm upgrade'leri bitirme" ilerleme simülasyonu | `out/upgrade_costs.md`, `sim_runs.md`, `wave_table.md`, `progression.md`, `summary.json` | ~15 dk |
| `vb_proposed.py` | AS-BUILT ile ÖNERİ tuning karşılaştırması (GDD §3.5) | `out/tuning_compare.md`, `progression_compare.md` | ~5–10 dk |
| `backlog.py` | Backlog'un tek kaynağı: RICE, sıralama, quick wins, faz kapasitesi, gantt | `../feature_backlog.csv`, `out/backlog_table.md`, `backlog_stats.md`, `capacity.md`, `gantt.md` | < 1 sn |
| `build_docs.py` | `docs/*.md` içindeki `<!-- INCLUDE:out/... -->` bloklarını çıktılarla doldurur. `--check` ile fark varsa hata verir | docs/*.md | < 1 sn |
| `vb_final.py` | Uygulanan nihai dengenin (FINAL) doğrulaması, içerik açık/kapalı (GDD §14.2) | `out/final_runs.md`, `final_progression.md` | dakikalar |
| `smoke.py` | Oyunu headless Chrome'da 11 senaryoyla çalıştırır (GDD §14.4): consent, migration, bozuk/sahte kayıt, paneller, booster, pause/quit, zen, revive, prizma/kilit, Daily Challenge. Hata varsa exit 1 | konsol | ~30 sn |
| `parity.py` | Aynı seed'de oyun (JS) ile `vb_model` arasında 5 settle senaryosunun birebir eşitliği | konsol | saniyeler |
| `shots.py` | 15 ekranın EN/TR ekran görüntüsü | görüntüler | saniyeler |
| `build_dashboard.py` | Tüm çıktıları ve docs tablolarını okuyup tek sayfalık `../dashboard.html` üretir (şablon: `dashboard_template.html`) | `../dashboard.html` | < 1 sn |

Tam yeniden üretim:
```
python vb_analysis.py && python vb_proposed.py && python backlog.py && python build_docs.py && python build_docs.py --check && python build_dashboard.py
```

## Modelin kapsamı ve sınırları
- **Birebir port edilenler:** `ringSpeed`/`RSPEC`, yay fiziği (yalnızca `dr`/`da`; ölçek ve jöle kozmetik), `isSettled`, `computeClusters` (tolerans dahil), `applyMagnet`, `settle`/`moveBlock`/`spawnColor`, `doBlast`, `doBomb`, `waveUp`, `drainRate`, combo, hit-stop.
- **Port edilmeyenler:** parçacık, ses, banner, render. Bunlar oynanışı etkilemiyor.
- **Zaman adımı** 1/30 sn, yay için 2 alt adım. JS'te 60 fps'de 1 adım, 30 fps'de 2 alt adım var, sonuç eşdeğer.
- **Parite kontrolü:** `vb_model` tuning düğmeleri eklendikten sonra AS-BUILT ayarıyla aynı tohum aynı sonucu verdi (casual, tohum 1: 129,2 sn / dalga 13 / 84.273 skor / 319 gem). JS ile otomatik parite testi backlog'da (F-035, F-018 sonrası).
- **Botlar `[VARSAYIM]`** (`BOTS`):
  - novice: 1,40 sn aralık, rastgele küme seçer, bombayı %50 kullanır.
  - casual: 0,95 sn aralık, boya göre ağırlıklı seçer, bombayı %80 kullanır.
  - skilled: 0,60 sn aralık, en büyük kümeyi seçer, bombayı her zaman kullanır.
  - Aralıklara ±%30 jitter uygulanır. Nişan hatası ve "beklemeyi seçme" stratejisi yok.
  - F-001 verisiyle kalibre edilecek (GDD §13).
- Run tavanı 900 sn. Tavana ulaşan run "ölmüyor" sayılır.
