// ---------------------------------------------------------------- ads (F-013, F-010, F-011)
// Providers: 'none' (rewarded buttons stay hidden), 'mock' (?ads=mock in debug: a fake 2.5 s ad),
// 'h5' (Google H5 Games Ads, needs CFG.ads.h5Client), 'admob' (Capacitor app with @capacitor-community/admob).
// Children (age gate < 13) never see ads; without personalised-ads consent requests are non-personalised.
const Ads = (() => {
  let busy = false, h5 = false, admobInit = false;
  const admob = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  const provider = () => {
    if (save.consent.age === 'u13' || !save.consent.age) return 'none';
    const p = (DEBUG && qparam('ads')) || CFG.ads.provider;
    if (p !== 'auto') return p;
    if (admob() && CFG.ads.admobRewardedId) return 'admob';
    return CFG.ads.h5Client ? 'h5' : 'none';
  };
  function initAdmob() {
    if (admobInit || provider() !== 'admob') return;
    admobInit = true;
    const A = admob();
    // Google's certified CMP (UMP) for EEA/UK users runs before the first ad request (00_RESEARCH S23)
    A.initialize({ initializeForTesting: DEBUG })
      .then(() => A.requestConsentInfo ? A.requestConsentInfo() : null)
      .then(info => info && info.isConsentFormAvailable && info.status === 'REQUIRED' ? A.showConsentForm() : null)
      .catch(() => {});
  }
  function loadH5() {
    if (h5 || provider() !== 'h5' || !CFG.ads.h5Client) return;
    h5 = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CFG.ads.h5Client);
    s.setAttribute('data-ad-frequency-hint', '30s');
    if (DEBUG) s.setAttribute('data-adbreak-test', 'on');
    document.head.appendChild(s);
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
    if (!save.consent.ads) window.adsbygoogle.requestNonPersonalizedAds = 1;
  }
  function ready(placement) {
    const p = provider();
    if (placement === 'double' && save.adsDay.date === dayKey() && save.adsDay.doubles >= CFG.ads.doubleGemsPerDay) return false;
    return p === 'mock' || (p === 'h5' && h5) || (p === 'admob' && !!admob());
  }
  function showRewarded(placement) {
    if (busy || !ready(placement)) return Promise.resolve(false);
    busy = true;
    const done = ok => { busy = false; Track.ev('ad_result', { placement, result: ok ? 'viewed' : 'skipped' }); return ok; };
    const p = provider();
    if (p === 'mock') return new Promise(res => openModal({ kind: 'ad', t0: T, resolve: ok => res(done(ok)), pausesGame: true }));
    if (p === 'admob') {
      const A = admob();
      return A.prepareRewardVideoAd({ adId: CFG.ads.admobRewardedId, isTesting: DEBUG, npa: !save.consent.ads })
        .then(() => A.showRewardVideoAd()).then(r => done(!!r)).catch(() => done(false));
    }
    return new Promise(res => {
      let settled = false; const fin = ok => { if (!settled) { settled = true; res(done(ok)); } };
      window.adBreak({ type: 'reward', name: placement, beforeReward: show => show(),
        adDismissed: () => fin(false), adViewed: () => fin(true), adBreakDone: () => fin(false) });
    });
  }
  // run-end interstitial (off unless CFG.ads.interstitialEveryRuns > 0; never for no-ads owners or the first 3 runs)
  function maybeInterstitial() {
    const n = CFG.ads.interstitialEveryRuns, p = provider();
    if (!n || save.ent.noads || busy || save.stats.runs < 3 || save.stats.runs % n) return;
    Track.ev('ad_offer', { placement: 'interstitial' });
    if (p === 'h5' && h5) window.adBreak({ type: 'next', name: 'run_end' });
    else if (p === 'admob' && admob() && CFG.ads.admobInterstitialId)
      admob().prepareInterstitial({ adId: CFG.ads.admobInterstitialId, isTesting: DEBUG, npa: !save.consent.ads })
        .then(() => admob().showInterstitial()).catch(() => {});
  }
  const load = () => { loadH5(); initAdmob(); };
  return { ready, showRewarded, maybeInterstitial, loadH5: load, provider, get busy() { return busy; } };
})();

