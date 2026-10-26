# Vortex Blast — Ürün dokümanları

> Hazırlanma: 2026-10-26 · Dil: Türkçe (oyun/ürün terimleri İngilizce) · Oyun kodu (`index.html`, `README.md`) bu çalışmada değiştirilmedi.

## Okuma sırası
1. **[01_GDD.md](01_GDD.md) §1**: yönetici özeti ve 4 kritik bulgu (5 dk)
2. **[03_ROADMAP.md](03_ROADMAP.md)**: ne zaman, ne yapılacak, kapılar (10 dk)
3. **[02_FEATURE_BACKLOG.md](02_FEATURE_BACKLOG.md)**: Top 10, quick wins, yapma listesi
4. **[00_RESEARCH.md](00_RESEARCH.md)**: pazar, benchmark ve uyumluluk kanıtları
5. **[01_GDD.md](01_GDD.md)** tamamı + Ek A (as-built sabitler, hipotez doğrulaması)
6. **[tools/README.md](tools/README.md)**: rakamları yeniden üretmek için

| Dosya | İçerik |
|---|---|
| `00_RESEARCH.md` | Yönetici özeti (15 madde), bulgular, 31 kaynaklı kaynak tablosu |
| `01_GDD.md` | 13 bölüm + 5 ADR + Ek A/B/C |
| `02_FEATURE_BACKLOG.md` | 44 özellik, RICE, Top 10, quick wins, anti-features |
| `03_ROADMAP.md` | P0–P4 (+Later), gantt, bağımlılık grafiği, Go/No-Go, risk register, Sprint 1–2 |
| `feature_backlog.csv` | Backlog'un CSV hâli (UTF-8 BOM, Excel uyumlu). `02`'deki tabloyla birebir aynı |
| `tools/` | Python oynanış modeli, analiz, backlog ve doküman derleme scriptleri ile çıktıları |

## Varsayımlar listesi `[VARSAYIM]`
| # | Varsayım | Nerede kullanıldı |
|---|---|---|
| V1 | Ekip 1 geliştirici + Claude Code, 20 sa/hafta (2,5 kişi-gün), %20 tampon | Roadmap kapasitesi |
| V2 | UA bütçesi yaklaşık 0, organik + küçük test | Roadmap R3, G1 eşiği |
| V3 | Oyuncu botlarının tap aralıkları ve seçim stratejileri (novice/casual/skilled) | Tüm model çıktıları |
| V4 | Oyuncu her run sonunda en ucuz alınabilir upgrade'i alır | İlerleme simülasyonu |
| V5 | Web kohort retention'ı store kohortunun yaklaşık %80'i | G1 hedefleri (D1 %25 / D7 %8) |
| V6 | Gelir senaryosu: 1,2 RV + 0,8 IS / DAU, eCPM 8 $ / 5 $ | GDD §9.2 |
| V7 | IAP fiyatları (no-ads 2,99 $, starter 1,99 $) | GDD §9.3 |
| V8 | Yeni upgrade maliyet formülleri ve yeni blok spawn oranları | GDD §4, §6.4 |
| V9 | Hedef kitle 18–45, global | GDD §1 |
| V10 | G1 için 1.000 kurulum yeterli örneklem | Roadmap §5 |
| V11 | Crash-free ≥ %99,5 eşiği | G2 |
| V12 | Türkiye/gelişen pazar eCPM'i küresel aralığın altında | 00_RESEARCH madde 8 |

## Açık sorular
1. Bot modeli gerçek oyuncuya ne kadar yakın? F-001 verisiyle kalibrasyon P0'da.
2. Dönen tahta mekaniğinin reklam kreatifindeki CPI performansı (veri bulunamadı).
3. Web ve store kohortları karşılaştırılabilir mi?
4. Toon görünüm, Play Families "çocuklara hitap" değerlendirmesini tetikler mi? Hukuki görüş gerekli.
5. Combo penceresi 1,3 sn juice hissini azaltır mı? Deney E2.
6. KVKK–GDPR uyumlaştırmasının (2026 Q3 bekleniyordu) güncel durumu. Kaynak 2025 tarihli.

## Önemli not: as-built referansı
GDD'deki `[AS-BUILT]` bilgiler, `index.html`'in commit `89f79ff` artı çalışma ağacındaki **commit edilmemiş** performans değişikliklerini içeren sürümüne aittir:
- Sprite cache
- Haptik
- `queueResize`

Bu değişiklikler bu doküman çalışmasından önce yapıldı. Bu çalışmada `index.html` ve `README.md`'ye dokunulmadı. Çalışmanın başında ve sonunda SHA-256 ile doğrulandı (`index.html` öneki `0BDBD034B1FBDB3A`).
