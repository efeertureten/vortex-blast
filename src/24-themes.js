// ---------------------------------------------------------------- themes (F-026)
const C4 = (base, dark, light, deep, ico, rgb) => ({ base, dark, light, deep, ico, rgb });
const THEMES = {
  classic: { cost: 0, bg: ['#41208a', '#24105a', '#130833', '#08030f'], colors: COLORS.map(c => Object.assign({}, c)) },
  neon: { cost: 150, bg: ['#2a0a4a', '#170536', '#0b0322', '#040010'], colors: [
    C4('#ff2bd6', '#a3008a', '#ff9cf0', '#4d0042', '#ffe3fa', '255,43,214'), C4('#00e5ff', '#008aa8', '#9ff6ff', '#003a47', '#e0fdff', '0,229,255'),
    C4('#c6ff1a', '#6f9a00', '#eaffa0', '#2f4200', '#f7ffe0', '198,255,26'), C4('#8a5cff', '#4b22c4', '#c9b3ff', '#1f0a5c', '#efe8ff', '138,92,255')] },
  ocean: { cost: 250, bg: ['#0b4f6c', '#073a52', '#04263a', '#01131f'], colors: [
    C4('#ff6f61', '#c23b30', '#ffb3aa', '#5c140f', '#fff0ee', '255,111,97'), C4('#1e6bd6', '#0d3d8c', '#8fbfff', '#061d47', '#e6f0ff', '30,107,214'),
    C4('#f2c14e', '#b8860b', '#fde7a8', '#5e4100', '#fff8e6', '242,193,78'), C4('#16c2a3', '#0a7d68', '#9ff0e0', '#033d33', '#e3fbf6', '22,194,163')] },
  candy: { cost: 400, bg: ['#5a2a6e', '#3d1a52', '#26103a', '#120720'], colors: [
    C4('#ff5c8a', '#c22a59', '#ffb3c9', '#5c0d26', '#fff0f5', '255,92,138'), C4('#6a7dff', '#3446c4', '#bcc5ff', '#141c5c', '#eef0ff', '106,125,255'),
    C4('#ffe14d', '#c9a800', '#fff3a8', '#5c4d00', '#fffbe0', '255,225,77'), C4('#4de0a8', '#1a9e6e', '#b0f5da', '#064d33', '#e8fff5', '77,224,168')] },
  galaxy: { cost: 600, bg: ['#1b1446', '#0f0b2e', '#07061b', '#02010a'], colors: [
    C4('#ff4d6d', '#a8173a', '#ff9fb3', '#4a0716', '#ffe6ec', '255,77,109'), C4('#4da6ff', '#1a5fb4', '#b3d9ff', '#082a52', '#e6f3ff', '77,166,255'),
    C4('#ffb84d', '#c2770f', '#ffdca3', '#573000', '#fff4e3', '255,184,77'), C4('#4dffb8', '#12a86c', '#b3ffdf', '#04472b', '#e6fff4', '77,255,184')] },
};
function applyTheme(id) {
  const th = THEMES[id] || THEMES.classic;
  th.colors.forEach((c, i) => Object.assign(COLORS[i], c));   // icon shapes stay; only paint changes
  ICONS.splice(0, ICONS.length, ...COLORS.map(makeIcon));
  if (SPR) { buildBg(); buildBlockSprites(); }
}
function buyTheme(id) {
  const th = THEMES[id];
  if (!th || save.themes.includes(id)) return false;
  if (save.gems < th.cost) { Snd.deny(); return false; }
  save.gems -= th.cost; save.themes.push(id); Snd.buy();
  Track.ev('theme_buy', { id, cost: th.cost });
  persist();
  return true;
}

