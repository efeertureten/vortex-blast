// ---------------------------------------------------------------- strings (F-032)
// [English, Türkçe]. {name} placeholders are filled by t(key, {name: value}).
const STR = {
  play: ['PLAY', 'OYNA'], playAgain: ['PLAY AGAIN', 'TEKRAR OYNA'], best: ['BEST', 'EN İYİ'], score: ['SCORE', 'SKOR'],
  core: ['CORE STABILITY', 'ÇEKİRDEK STABİLİTESİ'], wave: ['WAVE {n}', 'DALGA {n}'], combo: ['COMBO x{n}', 'KOMBO x{n}'],
  go: ['GO!', 'BAŞLA!'], nice: ['NICE!', 'GÜZEL!'], great: ['GREAT!', 'HARİKA!'], awesome: ['AWESOME!', 'MÜTHİŞ!'],
  incredible: ['INCREDIBLE!', 'İNANILMAZ!'], vbomb: ['VORTEX BOMB!', 'GİRDAP BOMBASI!'], ringClear: ['RING CLEAR!', 'HALKA TEMİZ!'],
  cbomb: ['COLOUR BOMB!', 'RENK BOMBASI!'], colourClear: ['COLOUR CLEAR!', 'RENK TEMİZ!'], boss: ['BOSS WAVE!', 'BOSS DALGASI!'],
  bossClear: ['BOSS BEATEN!', 'BOSS YENİLDİ!'], lastChance: ['LAST CHANCE!', 'SON ŞANS!'], questDone: ['QUEST DONE!', 'GÖREV TAMAM!'],
  achDone: ['ACHIEVEMENT!', 'BAŞARIM!'], revived: ['BACK IN!', 'DEVAM!'], shieldSaved: ['SHIELD!', 'KALKAN!'],
  'tip.tap': ['Tap a glowing group of 3+ matching blocks', '3+ aynı renk parlayan gruba dokun'],
  'tip.bomb': ['Tap the VORTEX BOMB to clear its whole ring!', 'Halkayı temizlemek için GİRDAP BOMBASI\'na dokun!'],
  'tip.forge': ['Blast {n}+ at once to forge a VORTEX BOMB', 'Tek seferde {n}+ patlat: GİRDAP BOMBASI'],
  'tip.cbomb': ['Tap the COLOUR BOMB to clear every block of its colour!', 'RENK BOMBASI o renkteki bütün blokları temizler!'],
  'tip.lock': ['Locked blocks open when a neighbour blasts', 'Kilitli bloklar komşusu patlayınca açılır'],
  tagline: ['Tap glowing clusters  •  keep the core alive', 'Parlayan gruplara dokun  •  çekirdeği canlı tut'],
  collapsed: ['CORE COLLAPSED', 'ÇEKİRDEK ÇÖKTÜ'], newBest: ['NEW BEST!', 'YENİ REKOR!'],
  runLine: ['WAVE {w}   •   {b} BLASTS   •   MAX COMBO x{c}', 'DALGA {w}   •   {b} PATLAMA   •   KOMBO x{c}'],
  upHintYes: ['Upgrades available!  Open the drawer below ▼', 'Geliştirme alabilirsin!  Aşağıdaki çekmeceyi aç ▼'],
  upHint: ['Spend Core Gems in the Upgrade Drawer ▼', 'Çekirdek Taşlarını aşağıdaki çekmecede harca ▼'],
  paused: ['PAUSED', 'DURAKLATILDI'], tapResume: ['Tap to resume', 'Devam etmek için dokun'], gamePaused: ['GAME PAUSED', 'OYUN DURDU'],
  upgrades: ['UPGRADES', 'GELİŞTİRMELER'], max: ['MAX', 'MAKS'],
  'up.magnet': ['Alignment Magnet', 'Hizalama Mıknatısı'], 'up.magnet.d': ['Rings drift to line up colours', 'Halkalar renkleri hizalamaya kayar'],
  'up.magnet.eff': ['Pull power {p}%  •  wider links', 'Çekim %{p}  •  daha geniş bağ'],
  'up.bomb': ['Bomb Threshold', 'Bomba Eşiği'], 'up.bomb.d': ['Vortex Bomb from {n}+ blocks', '{n}+ bloktan Girdap Bombası'],
  'up.bomb.eff': ['Next level: {n}+ blocks', 'Sonraki seviye: {n}+ blok'],
  'up.mult': ['Gem & Score Boost', 'Taş ve Skor Artışı'], 'up.mult.d': ['Multiplies score and Core Gems', 'Skoru ve Çekirdek Taşlarını katlar'],
  'up.mult.eff': ['Score x{a}  •  gems x{b}', 'Skor x{a}  •  taş x{b}'],
  'up.combo': ['Combo Timer', 'Kombo Süresi'], 'up.combo.d': ['More time to keep a combo going', 'Komboyu sürdürmek için daha çok zaman'],
  'up.combo.eff': ['+{s} s per hit', 'vuruş başına +{s} sn'],
  'up.shield': ['Core Shield', 'Çekirdek Kalkanı'], 'up.shield.d': ['Start every run with extra stability', 'Her run\'a fazladan stabiliteyle başla'],
  'up.shield.eff': ['Runs start at {p}%', 'Run %{p} ile başlar'],
  'up.harmony': ['Spawn Harmony', 'Doğuş Uyumu'], 'up.harmony.d': ['New blocks match their neighbours more', 'Yeni bloklar komşularına daha çok uyar'],
  'up.harmony.eff': ['{p}% neighbour match', '%{p} komşu eşleşmesi'],
  'up.none': ['Not installed', 'Kurulu değil'], 'up.min': ['Minimum reached', 'En düşük seviye'],
  pauseTitle: ['Paused', 'Duraklatıldı'], resume: ['Resume', 'Devam et'], settings: ['Settings', 'Ayarlar'], quit: ['End run', 'Run\'ı bitir'],
  sound: ['Sound effects', 'Ses efektleri'], music: ['Music', 'Müzik'], haptics: ['Vibration', 'Titreşim'], motion: ['Motion', 'Hareket'],
  'motion.full': ['Full', 'Tam'], 'motion.reduced': ['Reduced', 'Az'], 'motion.auto': ['System', 'Sistem'],
  language: ['Language', 'Dil'], 'lang.auto': ['Auto', 'Otomatik'], patterns: ['Colour-blind patterns', 'Renk körü desenleri'],
  analytics: ['Share anonymous usage data', 'Anonim kullanım verisi paylaş'], adsPersonal: ['Personalised ads', 'Kişiselleştirilmiş reklam'],
  reset: ['Reset progress', 'İlerlemeyi sıfırla'], resetConfirm: ['Tap again to erase everything', 'Her şeyi silmek için tekrar dokun'],
  on: ['On', 'Açık'], off: ['Off', 'Kapalı'], close: ['Close', 'Kapat'], version: ['Version {v}', 'Sürüm {v}'],
  welcome: ['Welcome!', 'Hoş geldin!'], ageQ: ['How old are you?', 'Kaç yaşındasın?'], ageU13: ['Under 13', '13\'ten küçük'],
  age1315: ['13 – 15', '13 – 15'], age16: ['16 or older', '16 ve üzeri'],
  ageWhy: ['We use this only to keep the game safe for your age.', 'Bunu yalnızca oyunu yaşına uygun tutmak için kullanırız.'],
  dataQ: ['Help improve Vortex Blast?', 'Vortex Blast\'ı geliştirmemize yardım eder misin?'],
  dataBody: ['Share anonymous gameplay statistics. You can change this any time in Settings.', 'Anonim oyun istatistiklerini paylaş. Bunu Ayarlar\'dan istediğin zaman değiştirebilirsin.'],
  yesShare: ['Yes, share', 'Evet, paylaş'], noThanks: ['No thanks', 'Hayır, teşekkürler'],
  privacy: ['Privacy policy', 'Gizlilik politikası'],
  'ftue.0': ['Tap the glowing group!', 'Parlayan gruba dokun!'],
  'ftue.1': ['Same colours also link ACROSS rings when they line up', 'Aynı renkler hizalanınca halkalar ARASINDA da bağlanır'],
  'ftue.1b': ['Wait for a line-up, then tap it', 'Hizalanmayı bekle, sonra dokun'],
  'ftue.2': ['Stability drains. Blasting refills it!', 'Stabilite azalır. Patlatmak onu doldurur!'],
  'ftue.3': ['Blast 6+ at once to forge a VORTEX BOMB', 'Bir kerede 6+ patlat: GİRDAP BOMBASI'],
  'ftue.3g': ['Here is one to try!', 'Al, bir tane dene!'], 'ftue.4': ['Tap the bomb to clear its ring!', 'Halkayı temizlemek için bombaya dokun!'],
  'ftue.5': ['You\'ve got it. Keep the core alive!', 'Tamamdır. Çekirdeği canlı tut!'], skip: ['Skip', 'Geç'],
  dailyTitle: ['Daily reward', 'Günlük ödül'], day: ['Day {n}', '{n}. gün'], claim: ['Claim', 'Al'], tomorrow: ['Come back tomorrow', 'Yarın tekrar gel'],
  questsTitle: ['Daily quests', 'Günlük görevler'], newQuests: ['New quests at midnight', 'Yeni görevler gece yarısı'], done: ['Done', 'Tamam'],
  'q.blasts': ['Blast {n} groups', '{n} grup patlat'], 'q.bigs': ['Blast {n} groups of 6+', '6+ bloklu {n} grup patlat'],
  'q.combo': ['Reach a x{n} combo', 'x{n} komboya ulaş'], 'q.bombs': ['Forge {n} Vortex Bombs', '{n} Girdap Bombası üret'],
  'q.wave': ['Reach wave {n}', '{n}. dalgaya ulaş'], 'q.score': ['Score {n} in one run', 'Tek run\'da {n} skor yap'],
  'q.runs': ['Play {n} runs', '{n} run oyna'], 'q.cross': ['Blast {n} cross-ring groups', 'Halkalar arası {n} grup patlat'],
  'q.joker': ['Use {n} prism blocks', '{n} prizma blok kullan'], 'q.cbomb': ['Trigger {n} Colour Bombs', '{n} Renk Bombası patlat'],
  'q.boss': ['Beat {n} Boss Waves', '{n} Boss Dalgası yen'], 'q.gems': ['Earn {n} gems', '{n} taş kazan'],
  'q.ring': ['Clear {n} rings with bombs', 'Bombayla {n} halka temizle'], 'q.unlock': ['Free {n} locked blocks', '{n} kilitli bloğu aç'],
  'q.time': ['Survive {n} s in one run', 'Tek run\'da {n} sn dayan'],
  'next.up': ['{n} more gems: {name} Lv {l}', '{n} taş daha: {name} Sv {l}'], 'next.upReady': ['You can buy {name} Lv {l}!', '{name} Sv {l} alınabilir!'],
  'next.best': ['{n} points to beat your best', 'Rekoruna {n} puan kaldı'], 'next.quest': ['Quest: {q}  ({p}/{g})', 'Görev: {q}  ({p}/{g})'],
  reviveTitle: ['Core failing!', 'Çekirdek çöküyor!'], reviveWatch: ['Watch an ad to continue', 'Reklam izle, devam et'],
  reviveSkip: ['No thanks', 'Hayır'], double: ['2x gems', '2x taş'], adLabel: ['AD', 'REKLAM'], testAd: ['Test ad', 'Test reklamı'],
  adFail: ['Ad not available right now', 'Şu an reklam yok'],
  boostTitle: ['Boosters', 'Güçlendiriciler'], 'boost.bomb': ['Start bomb', 'Başlangıç bombası'], 'boost.shield': ['Shield', 'Kalkan'],
  'boost.magnet': ['Magnet+ 30 s', 'Mıknatıs+ 30 sn'], start: ['START', 'BAŞLA'], have: ['x{n}', 'x{n}'],
  streak: ['Streak x{n}  •  +{p}% start', 'Seri x{n}  •  başlangıç +%{p}'],
  profile: ['Profile', 'Profil'], runs: ['Runs', 'Run'], blastsL: ['Blasts', 'Patlama'], bombsL: ['Bombs', 'Bomba'],
  bestCombo: ['Best combo', 'En iyi kombo'], bestWave: ['Best wave', 'En iyi dalga'], playTime: ['Play time', 'Oyun süresi'],
  recent: ['Recent runs', 'Son run\'lar'], achievements: ['Achievements', 'Başarımlar'], noRuns: ['No runs yet', 'Henüz run yok'],
  endless: ['ENDLESS', 'SONSUZ'], dailyMode: ['DAILY', 'GÜNLÜK'], zen: ['ZEN', 'ZEN'],
  'mode.endless': ['Tap glowing clusters  •  keep the core alive', 'Parlayan gruplara dokun  •  çekirdeği canlı tut'],
  'mode.daily': ['Same board for everyone today  •  one try', 'Bugün herkese aynı tahta  •  tek hak'],
  'mode.dailyUsed': ['Today\'s try is used  •  best {s}', 'Bugünkü hak kullanıldı  •  en iyi {s}'],
  'mode.zen': ['No timer, relaxed play  •  gems x0.25', 'Süre yok, rahat oyun  •  taş x0.25'],
  themes: ['Themes', 'Temalar'], use: ['Use', 'Kullan'], inUse: ['In use', 'Kullanımda'],
  'th.classic': ['Classic', 'Klasik'], 'th.neon': ['Neon', 'Neon'], 'th.ocean': ['Ocean', 'Okyanus'], 'th.candy': ['Candy', 'Şeker'], 'th.galaxy': ['Galaxy', 'Galaksi'],
  season: ['Season', 'Sezon'], tier: ['Tier {n}', '{n}. kademe'], free: ['Free', 'Ücretsiz'], premium: ['Premium', 'Premium'],
  premiumNote: ['Premium track comes with the app-store version', 'Premium şerit mağaza sürümüyle gelecek'],
  pts: ['{p} pts', '{p} puan'], endsIn: ['Ends in {d} days', '{d} gün kaldı'], seasonHow: ['Earn points from quests and daily rewards', 'Puanları görev ve günlük ödüllerden kazan'],
  'ev.gems': ['Weekend event: 2x gems!', 'Hafta sonu etkinliği: 2x taş!'], 'ev.bomb': ['Weekend event: bombs need 1 block less!', 'Hafta sonu: bomba için 1 blok az!'],
  'ev.quest': ['Weekend event: 2x quest rewards!', 'Hafta sonu: 2x görev ödülü!'], 'ev.combo': ['Weekend event: longer combos!', 'Hafta sonu: daha uzun kombo!'],
  share: ['Share', 'Paylaş'], shareText: ['I scored {s} in Vortex Blast! Can you beat it?', 'Vortex Blast\'ta {s} skor yaptım! Geçebilir misin?'],
  btnDaily: ['Daily', 'Günlük'], btnQuests: ['Quests', 'Görevler'], btnProfile: ['Profile', 'Profil'], btnThemes: ['Themes', 'Temalar'], btnSeason: ['Season', 'Sezon'],
  gemsWord: ['gems', 'taş'], rewardGems: ['+{n} gems', '+{n} taş'],
};
const ACHS = [   // [id, en, tr, test(stats-like), reward]
  ['first', 'First Pop', 'İlk Patlama', s => s.blasts >= 1, 10], ['b100', '100 Blasts', '100 Patlama', s => s.blasts >= 100, 15],
  ['b1000', '1,000 Blasts', '1.000 Patlama', s => s.blasts >= 1000, 40], ['bomb', 'Bomb Smith', 'Bomba Ustası', s => s.bombs >= 1, 10],
  ['bomb50', 'Demolition', 'Yıkım', s => s.bombs >= 50, 30], ['c10', 'Combo x10', 'Kombo x10', s => s.maxCombo >= 10, 15],
  ['c25', 'Combo x25', 'Kombo x25', s => s.maxCombo >= 25, 40], ['w10', 'Wave 10', 'Dalga 10', s => s.maxWave >= 10, 15],
  ['w20', 'Wave 20', 'Dalga 20', s => s.maxWave >= 20, 30], ['w30', 'Wave 30', 'Dalga 30', s => s.maxWave >= 30, 50],
  ['s50k', 'Score 50,000', 'Skor 50.000', (s, x) => x.best >= 5e4, 15], ['s200k', 'Score 200,000', 'Skor 200.000', (s, x) => x.best >= 2e5, 30],
  ['s1m', 'Score 1,000,000', 'Skor 1.000.000', (s, x) => x.best >= 1e6, 50], ['t180', 'Three Minutes', 'Üç Dakika', (s, x) => x.longest >= 180, 20],
  ['boss', 'Boss Breaker', 'Boss Kırıcı', s => s.bosses >= 1, 15], ['boss5', 'Boss Hunter', 'Boss Avcısı', s => s.bosses >= 5, 30],
  ['cbomb', 'Rainbow Burst', 'Gökkuşağı', s => s.cbombs >= 1, 15], ['joker', 'Prism', 'Prizma', s => s.jokers >= 1, 10],
  ['maxup', 'Fully Charged', 'Tam Güç', () => UPGRADES.every(U => save.upg[U.key] >= U.max), 100],
  ['week', 'Regular', 'Müdavim', (s, x) => x.week, 30],
];
let LANG = 0;   // index into STR entries
function setLang() {
  const l = save.settings.lang === 'auto' ? ((navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en') : save.settings.lang;
  LANG = l === 'tr' ? 1 : 0;
  NUM_FMT = new Intl.NumberFormat(LANG ? 'tr-TR' : 'en-US');
  document.documentElement.lang = LANG ? 'tr' : 'en';
}
function t(key, vars) {
  const e = STR[key];
  let s = e ? e[LANG] : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
const upName = U => t('up.' + U.key), upDesc = (U, l) => t('up.' + U.key + '.d', U.descArg ? U.descArg(l) : null);
setLang();

// Haptics (Android/Chrome; silently absent on iOS). Needs a prior user gesture, which every caller has.
function buzz(p) { try { if (save.settings.haptics && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

