// ─── Design Tokens (Elonga app style) ───────────
export const T = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#1A1D2E",
  textSec: "#7B7F96",
  textTer: "#A9ADC1",
  blue: "#4A5FE0",
  blueSoft: "#EEF0FF",
  pink: "#E8467C",
  pinkSoft: "#FFF0F4",
  green: "#22B573",
  greenSoft: "#EAFAF2",
  orange: "#F5A623",
  orangeSoft: "#FFF8EC",
  gradStart: "#7B8CFF",
  gradEnd: "#E8467C",
  border: "#ECEEF5",
  r: 20,
  rSm: 14,
  rXs: 10,
  f: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── HLY Pillars ────────────────────────────────
// Zdroje dat:
//   pohyb    → Apple Health / Google Fit sync + manuální vstup
//   spanek   → Habits (self-report: spal jsem X hodin, kvalita)
//   strava   → Habits (self-report: splnil/nesplnil stravovací návyk)
//   stres    → Habits (self-report: dechové cvičení, meditace)
//   vztahy   → Habits (self-report: sociální interakce)
//   monitoring → Automaticky: HRV měření provedeno + habits zadání
export const PILLARS = [
  { key: "pohyb",      label: "Pohyb",      icon: "🏃", maxMin: 150, color: "#4A5FE0", soft: "#EEF0FF", source: "apple_health" },
  { key: "spanek",     label: "Spánek",     icon: "🌙", maxMin: 60,  color: "#7B8CFF", soft: "#F0F1FF", source: "habits" },
  { key: "strava",     label: "Strava",     icon: "🥗", maxMin: 60,  color: "#F5A623", soft: "#FFF8EC", source: "habits" },
  { key: "stres",      label: "Stres",      icon: "🧘", maxMin: 30,  color: "#22B573", soft: "#EAFAF2", source: "habits" },
  { key: "vztahy",     label: "Vztahy",     icon: "❤️", maxMin: 30,  color: "#E8467C", soft: "#FFF0F4", source: "habits" },
  { key: "monitoring", label: "Monitoring", icon: "📊", maxMin: 30,  color: "#9B8FFF", soft: "#F3F1FF", source: "auto" },
  //   monitoring → Automaticky: HRV měření + habits zadání + pohyb (sync i manuální vstup)
];

// ─── HRV States ─────────────────────────────────
export const HRV_STATES = [
  { label: "Pod průměrem", color: "#E8467C", bg: "#FFF0F4", mult: 1.0,  tag: "Stabilizace" },
  { label: "V normě",      color: "#22B573", bg: "#EAFAF2", mult: 1.1,  tag: "+10 %" },
  { label: "Nadprůměr",    color: "#F5A623", bg: "#FFF8EC", mult: 1.25, tag: "+25 %" },
];

// Max denní HLY bonus (v minutách)
export const TOTAL_MAX_MIN = 360; // 6 hodin

// ─── Nudge zprávy pro nepoužívané pilíře ────────
export const NUDGE_MESSAGES = {
  pohyb:      { msg: "Pohyb je královský pilíř — 1 hodina aktivity ti přidá až 2.5h HLY.", cta: "Otevřít pohybový plán" },
  spanek:     { msg: "Kvalitní spánek ti může přidat celou hodinu HLY denně.", cta: "Nastavit spánkový návyk" },
  strava:     { msg: "Správná strava sníží záněty a přidá ti až 1h HLY denně.", cta: "Přidat stravovací návyk" },
  stres:      { msg: "Dechové cvičení + meditace = 0.5h HLY denně. Stačí 5 minut.", cta: "Vyzkoušet dechové cvičení" },
  vztahy:     { msg: "Kvalitní vztahy jsou nejsilnější prediktor zdraví ve stáří.", cta: "Přidat sociální návyk" },
  monitoring: { msg: "Ranní HRV měření ti přidá 0.5h HLY + odemkne Resilience Boost.", cta: "Změřit HRV" },
};

// ─── Demo data ──────────────────────────────────
export const DEMO_DATA = {
  pohyb: 0.72,
  spanek: 0.85,
  strava: 0.55,
  stres: 0.05,     // Low → triggers nudge card
  vztahy: 0.65,
  monitoring: 1.0,
};
