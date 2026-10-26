# Mağaza paketi (Capacitor) — F-031

> **Durum:** Proje iskeleti hazır (`package.json`, `capacitor.config.json`, `tools/build_www.py`, ikonlar, AdMob/UMP kodu `index.html` → `Ads`).
> **Bu repoda derlenmedi ve test edilmedi:** geliştirme makinesinde Node.js/npm, Android Studio ve Xcode yoktu. Aşağıdaki adımlar standart Capacitor akışıdır. İlk derlemede sürümlerin (`^7.0.0`) güncel olduğunu kontrol et.

## Gereksinimler
- Node.js 20+ ve npm
- Android: Android Studio (SDK 34+)
- iOS: macOS + Xcode 15+ ve CocoaPods
- Google AdMob hesabı: uygulama kimliği, ödüllü (rewarded) reklam birimi; istersen geçiş (interstitial) birimi

## Adımlar
```bash
npm install
npx cap add android            # ilk kez
npx cap add ios                # ilk kez (macOS)
python tools/build_www.py --config store-config.json   # www/ = oyun + mağaza config'i
npx cap sync
npx cap open android           # ya da: npx cap open ios
```

`store-config.json` örneği (repoya koyma, gizli değil ama ortama özel):
```json
{ "ads": { "provider": "auto", "admobRewardedId": "ca-app-pub-XXXX/RRRR", "admobInterstitialId": "", "interstitialEveryRuns": 0 },
  "analytics": { "endpoint": "https://example.com/collect" } }
```

## Platform ayarları
- **AdMob uygulama kimliği:**
  - Android: `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`.
  - iOS: `Info.plist` → `GADApplicationIdentifier`.
- **iOS ATT:** `Info.plist` → `NSUserTrackingUsageDescription`. Önce GDPR (UMP) formu gösterilir, sonra ATT `[ARAŞTIRMA S23]`. Oyun UMP'yi `Ads.initAdmob` içinde istiyor.
- **Titreşim (Android):** `VIBRATE` izni (`navigator.vibrate` WebView'da çalışır).
- **Ekran yönü:** dikey. Android'de `android:screenOrientation="portrait"`, iOS'ta yalnızca Portrait.

## Mağaza kontrol listesi
- [ ] Gizlilik politikası URL'si (`docs/PRIVACY.md` → yayınlanmış sayfa, iletişim bilgileri doldurulmuş)
- [ ] Play Console → Data safety: cihazdaki oyun ilerlemesi; isteğe bağlı analitik (rastgele id); AdMob
- [ ] Play → Target audience: 13+ önerilir. Toon görünüm nedeniyle "Families" incelemesi gelebilir. Self-certified ads SDK gerekebilir `[ARAŞTIRMA S24, S25]`
- [ ] Apple 4.2: varlıklar uygulama içinde (uzak URL yok), native özellikler: AdMob, titreşim, çevrimdışı çalışma `[ARAŞTIRMA S22]`
- [ ] İkonlar: `icons/icon-512.png`, `icons/maskable-512.png` (Android adaptive için Android Studio Image Asset ile)
- [ ] Sürüm: `BUILD` sabiti (`index.html`), `package.json` `version`, `sw.js` `VERSION` birlikte artırılır

## Bilinen eksikler
- No-ads IAP (F-012) satın alma akışı yok. `save.ent.noads` yetkisi ve interstitial'ı atlama mantığı hazır. Satın alma eklentisi (ör. RevenueCat veya `cordova-plugin-purchase`) mağaza hesabıyla eklenmeli.
- Premium sezon şeridi aynı nedenle kilitli gösteriliyor.
