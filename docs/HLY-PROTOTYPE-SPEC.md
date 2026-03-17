# HLY Prototype — Kompletni specifikace

> Verze: 1.0 | Datum: 2026-03-17
> Zdrojovy soubor: `src/App.jsx` (jediny zdrojovy soubor prototypu)

---

## 1. Prehled projektu

### Co prototype dela

Elonga HLY (Healthy Life Years) je mobilni-first React prototyp, ktery vizualizuje, kolik hodin "zdraveho zivota" uzivatel kazdy den ziska plnenim zdravotnich piliru. Aplikace pocita projekci "let ve zdravi" na zaklade denniho plneni, HRV stavu a veku uzivatele.

### Stack

| Vrstva | Technologie |
|--------|-------------|
| Framework | React 18.3 |
| Build tool | Vite 6.0 |
| Styling | Inline styles (zadne CSS-in-JS knihovny) |
| State management | React useState + useContext (ThemeCtx) |
| Routing | Zadny router — screen state (`"onboarding"` / `"dashboard"` / `"settings"`) |
| Data | Vygenerovana mock data primo v kodu |

### Struktura souboru

```
hly/
├── src/
│   ├── App.jsx          ← Veskerá logika, komponenty, data
│   ├── main.jsx         ← React mount point
│   ├── constants.js     ← Starší verze design tokens (nepoužívá se v App.jsx)
│   └── styles.css       ← Globální styly
├── docs/
│   ├── CONCEPT.md
│   ├── PRODUCT.md
│   ├── GAMIFICATION.md
│   ├── OPEN-QUESTIONS.md
│   ├── DATA-INPUTS.md
│   └── HLY-PROTOTYPE-SPEC.md  ← Tento soubor
├── package.json
└── index.html
```

> **Poznamka:** `src/constants.js` obsahuje starsi verzi design tokenu s jinou paletou barev. Prototyp v `App.jsx` pouziva svou vlastni paletu definovanou primo v souboru (objekty `LIGHT` a `DARK`).

---

## 2. Design system — Elonga

### 2.1 Barevna paleta

#### Light mode (`LIGHT`)

| Token | Hex | Pouziti |
|-------|-----|---------|
| `bg` | `#F2F3F8` | Pozadi aplikace |
| `card` | `#FFFFFF` | Pozadi karet |
| `cardAlt` | `#EBEDF3` | Alternativni pozadi karet, tab bg |
| `text` | `#1E1E4F` | Primarni text |
| `textSec` | `#475484` | Sekundarni text |
| `textTer` | `#7B85A8` | Terciarni text, labely |
| `primary` | `#4052F4` | Primarni akcent (Blue) |
| `primarySoft` | `#ECEEFE` | Soft pozadi pro primary |
| `primaryMuted` | `#7A88F8` | Tlumena primary |
| `purple` | `#733BE8` | Spanek pilir |
| `purpleSoft` | `#F2EBFD` | Soft purple pozadi |
| `pink` | `#E83A64` | Vztahy pilir, chybovy stav |
| `pinkSoft` | `#FDECF1` | Soft pink pozadi |
| `green` | `#3B7A5E` | Strava pilir, pozitivni stav |
| `greenSoft` | `#EAF4EF` | Soft green pozadi |
| `gray` | `#475484` | Stres pilir |
| `graySoft` | `#EBEDF3` | Soft gray pozadi |
| `red` | `#E83A64` | Error / alert (= pink) |
| `redSoft` | `#FDECF1` | Soft red pozadi |
| `gradStart` | `#1E3080` | Gradient start (tmava modra) |
| `gradEnd` | `#4052F4` | Gradient end (primary blue) |
| `border` | `#EBEDF3` | Hranice, oddelovace |
| `borderStrong` | `#D7DAE6` | Silnejsi hranice |
| `shadow` | `0 2px 12px rgba(30,30,79,0.07)` | Standard shadow |
| `shadowLg` | `0 8px 30px rgba(30,30,79,0.10)` | Velky shadow |
| `toggleBg` | `#EBEDF3` | Pozadi neaktivniho toggle |

#### Dark mode (`DARK`)

| Token | Hex | Pouziti |
|-------|-----|---------|
| `bg` | `#0D0F1A` | Pozadi aplikace |
| `card` | `#1E1E4F` | Pozadi karet |
| `cardAlt` | `#282A52` | Alternativni pozadi karet |
| `text` | `#FFFFFF` | Primarni text |
| `textSec` | `#AFB5CC` | Sekundarni text |
| `textTer` | `#7B85A8` | Terciarni text |
| `primary` | `#4052F4` | Primarni akcent (nemeni se) |
| `primarySoft` | `#1A2058` | Soft pozadi pro primary |
| `primaryMuted` | `#7A88F8` | Tlumena primary |
| `purple` | `#9E75F0` | Spanek (svetlejsi nez v light) |
| `purpleSoft` | `#2A1858` | Soft purple |
| `pink` | `#F07A98` | Vztahy (svetlejsi) |
| `pinkSoft` | `#3A1830` | Soft pink |
| `green` | `#72A790` | Strava (svetlejsi) |
| `greenSoft` | `#1A3028` | Soft green |
| `gray` | `#7B85A8` | Stres |
| `graySoft` | `#282A52` | Soft gray |
| `red` | `#F07A98` | Error |
| `redSoft` | `#3A1830` | Soft red |
| `gradStart` | `#2840D0` | Gradient start |
| `gradEnd` | `#5060FF` | Gradient end |
| `border` | `#282A52` | Hranice |
| `borderStrong` | `#383A60` | Silnejsi hranice |
| `shadow` | `0 2px 12px rgba(0,0,0,0.25)` | Shadow |
| `shadowLg` | `0 8px 30px rgba(0,0,0,0.35)` | Velky shadow |
| `toggleBg` | `#383A60` | Neaktivni toggle |

### 2.2 Typografie

```
Font family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif
```

| Pouziti | Size | Weight |
|---------|------|--------|
| App title | 22px | 800 |
| Section title | 14px | 700 |
| Onboarding heading | 24–28px | 800 |
| Hero cislo (projected years) | 42px | 800 |
| Onboarding hero cislo | 64px | 900 |
| Body text | 13–15px | 400–600 |
| Labels / tags | 9–11px | 600–700 |
| Pillar pill value | 11px | 600–700 |
| Chart center value | 22–30px | 800 |

### 2.3 Border radius & Spacing

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `r` | 20px | Karty, velke boxy |
| `rSm` | 14px | Tabs, mensi kontejnery |
| `rXs` | 10px | Mini karty, stat boxy |
| Pill | 20px | Tagy, badges |
| Toggle | 14px | Toggle switche |
| Icon box | 8–12px | Ikony piliru |

### 2.4 Gradienty

```
Primary gradient:  linear-gradient(135deg, gradStart, gradEnd)
Bar gradient:      linear-gradient(180deg, gradStart, gradEnd + "cc")
Primary button:    linear-gradient(135deg, gradStart, gradEnd) + box-shadow: 0 4px 20px gradStart40
```

### 2.5 Theme context

```jsx
const ThemeCtx = createContext(LIGHT);
const useTheme = () => useContext(ThemeCtx);
```

Kazda obrazovka je obalena `<ThemeCtx.Provider value={T}>` kde `T = darkMode ? DARK : LIGHT`.

---

## 3. Datovy model

### 3.1 Pilire (PILLARS)

```js
const PILLARS = [
  { key: "pohyb",      label: "Pohyb",      icon: "🏃", maxMin: 150, color: "#4052F4", soft: "#ECEEFE", darkSoft: "#1A2058" },
  { key: "spanek",     label: "Spánek",     icon: "🌙", maxMin: 60,  color: "#733BE8", soft: "#F2EBFD", darkSoft: "#2A1858" },
  { key: "strava",     label: "Strava",     icon: "🥗", maxMin: 60,  color: "#3B7A5E", soft: "#EAF4EF", darkSoft: "#1A3028" },
  { key: "stres",      label: "Stres",      icon: "🧘", maxMin: 30,  color: "#475484", soft: "#EBEDF3", darkSoft: "#282A52" },
  { key: "vztahy",     label: "Vztahy",     icon: "❤️", maxMin: 30,  color: "#E83A64", soft: "#FDECF1", darkSoft: "#3A1830" },
  { key: "monitoring", label: "Monitoring", icon: "📊", maxMin: 30,  color: "#7B85A8", soft: "#EBEDF3", darkSoft: "#282A52" },
];
```

| Klic | maxMin (minuty/den) | maxHrs (hodiny/den) | Barva |
|------|---------------------|---------------------|-------|
| pohyb | 150 | 2.5 | Blue `#4052F4` |
| spanek | 60 | 1.0 | Purple `#733BE8` |
| strava | 60 | 1.0 | Green `#3B7A5E` |
| stres | 30 | 0.5 | Gray `#475484` |
| vztahy | 30 | 0.5 | Pink `#E83A64` |
| monitoring | 30 | 0.5 | Gray `#7B85A8` |
| **CELKEM** | **360** | **6.0** | |

- `maxMin` = maximalni pocet minut zdraveho zivota, ktere pilir muze pridat za den pri 100% plneni
- `monitoring` je **vzdy aktivni** — uzivatel ho nemuze vypnout

### 3.2 HRV stavy (HRV_STATES)

```js
const HRV_STATES = [
  { label: "Pod průměrem", color: "#E83A64", bg: "#FDECF1", darkBg: "#3A1830", mult: 1.0,  tag: "Stabilizace" },
  { label: "V normě",      color: "#3B7A5E", bg: "#EAF4EF", darkBg: "#1A3028", mult: 1.1,  tag: "+10 %" },
  { label: "Nadprůměr",    color: "#733BE8", bg: "#F2EBFD", darkBg: "#2A1858", mult: 1.25, tag: "+25 %" },
];
```

HRV stav funguje jako **multiplikator** celkoveho HLY:
- Pod prumerem: `×1.0` (zadny bonus)
- V norme: `×1.1` (+10 %)
- Nadprumer: `×1.25` (+25 %)

### 3.3 DEMO hodnoty

```js
const DEMO = {
  pohyb: 0.72,       // 72% plneni
  spanek: 0.85,       // 85% plneni
  strava: 0.55,       // 55% plneni
  stres: 0.05,        // 5% plneni → triggers nudge card
  vztahy: 0.65,       // 65% plneni
  monitoring: 1.0,    // 100% plneni
};
```

Kazda hodnota je **0.0–1.0** (procento plneni pilire).

### 3.4 Historie (mock data)

Funkce `generateHistory(days)` generuje pole za `days` dni (default: 365):

```ts
interface HistoryItem {
  date: Date;
  day: string;           // "po", "ut", "st" ... (cs-CZ weekday short)
  dayNum: number;        // den v mesici
  month: string;         // "led", "uno" ... (cs-CZ month short)
  hrsRaw: number;        // raw hodiny (0.5–6.0)
  hrsBoosted: number;    // hrsRaw × HRV multiplikator
  hrvIdx: number;        // index do HRV_STATES (0, 1, 2)
  pillars: {             // plneni kazdeho pilire (0.0–1.0)
    pohyb: number;
    spanek: number;
    strava: number;
    stres: number;
    vztahy: number;
    monitoring: number;
  };
}
```

**Posledni den** (dnes) pouziva DEMO hodnoty pro konzistenci s interaktivnim dashboard.

### 3.5 Uzivatelska nastaveni

```ts
interface UserSettings {
  enabled: {              // ktere pilire ma uzivatel zapnute
    pohyb: boolean;       // default: true
    spanek: boolean;      // default: true
    strava: boolean;      // default: false
    stres: boolean;       // default: false
    vztahy: boolean;      // default: false
    // monitoring: vzdy true (neni v enabled objektu)
  };
  age: number;            // kalendarni vek (default: 40, range: 20–70)
  funcAge: number;        // funkcni vek (default: 32, range: 20–70)
  darkMode: boolean;      // default: false
  hrvState: number;       // index do HRV_STATES (default: 1 = "V norme")
}
```

### 3.6 Pillar metadata (PILLAR_META)

```js
const PILLAR_META = {
  pohyb: {
    desc: "Fyzická aktivita, kroky, tréninky",
    source: "Apple Health / Google Fit + manuálně",
    question: "Jak chceš zadávat pohyb?",
    options: [
      { label: "Synchronizace s Apple Health / Google Fit", desc: "Automaticky přenese kroky, tréninky a aktivitu" },
      { label: "Budu zadávat ručně", desc: "Záznam aktivit ručně po každém cvičení" },
    ]
  },
  spanek: {
    desc: "Kvalita a délka spánku",
    source: "Zdravý návyk (self-report)",
    question: "Čeho chceš dosáhnout?",
    options: [
      { label: "Chci spát určitý počet hodin denně", desc: "..." },
      { label: "Chci chodit spát ve stejný čas", desc: "..." },
      { label: "Chci eliminovat modré světlo před spaním", desc: "..." },
    ]
  },
  strava: {
    desc: "Výživa, stravovací návyky",
    source: "Zdravý návyk (self-report)",
    question: "Čeho chceš dosáhnout?",
    multiSelect: true,      // ← jediny multiSelect pilir
    options: [
      { label: "Chci se naučit lepší stravovací návyky", desc: "..." },
      { label: "Chci zhubnout", desc: "..." },
      { label: "Chci mít pravidelný stravovací režim", desc: "..." },
    ]
  },
  stres: {
    desc: "Dechová cvičení, meditace, relaxace",
    source: "Zdravý návyk (self-report)",
    question: "Čeho chceš dosáhnout?",
    options: [
      { label: "Chci se naučit dýchací techniky", desc: "..." },
      { label: "Chci pravidelně meditovat", desc: "..." },
      { label: "Chci lépe zvládat stresové situace", desc: "..." },
    ]
  },
  vztahy: {
    desc: "Sociální interakce, kvalitní čas s blízkými",
    source: "Zdravý návyk (self-report)",
    question: "Čeho chceš dosáhnout?",
    options: [
      { label: "Chci trávit víc kvalitního času s blízkými", desc: "..." },
      { label: "Chci být víc v kontaktu s přáteli", desc: "..." },
    ]
  },
};
```

> **Monitoring** nema meta — neni konfigurovatelny v onboardingu.

---

## 4. Komponenty

### 4.1 `DarkModeToggle`

| Prop | Typ | Popis |
|------|-----|-------|
| `dark` | `boolean` | Aktualni stav dark mode |
| `onToggle` | `() => void` | Callback pro prepnuti |

- Toggle switch 50×28px s posuvnym koleckem (24×24)
- Light: mesic ikona (SVG path), Dark: slunce ikona (SVG circle + lines)
- Animovany slide (`transform: translateX(22px)`)

### 4.2 `RadarChart`

| Prop | Typ | Popis |
|------|-----|-------|
| `data` | `Record<string, number>` | Plneni piliru (0–1) |
| `pillars` | `Pillar[]` | Aktivni pilire |
| `animate` | `boolean` | Zda animovat vstup |

- SVG 260×260, stred 130×130, max radius 95px
- 4 urovne (0.25, 0.5, 0.75, 1.0) polygonalniho gridu
- Oblast vyplnena linearnm gradientem (`rfL`: `gradStart` 20% → `gradEnd` 8%)
- Ohraniceni gradientem (`rsL`: `gradStart` → `gradEnd`)
- Body na okraji: circle r=4.5, bile vyplneni, barevny stroke
- Ikony piliru na 128% radius

### 4.3 `GaugeGrid`

| Prop | Typ | Popis |
|------|-----|-------|
| `data` | `Record<string, number>` | Plneni piliru |
| `pillars` | `Pillar[]` | Aktivni pilire |
| `animate` | `boolean` | Animace |
| `periodDays` | `number` | Pocet dni v periode (default: 1) |

- Grid layout: 1–2 sloupce (≤2 piliru), 2 sloupce (≤4), 3 sloupce (>4)
- Kazdy gauge: polkruhovy SVG oblouk (radius 36, stroke-width 7)
- Hodnota v hodinach uprostred, ikona + label dole
- Animace: `stroke-dashoffset` s delay `idx * 80ms`

### 4.4 `ActivityRings`

| Prop | Typ | Popis |
|------|-----|-------|
| `data` | `Record<string, number>` | Plneni piliru |
| `pillars` | `Pillar[]` | Aktivni pilire |
| `animate` | `boolean` | Animace |
| `periodTotal` | `{ hrs: string, label: string }` | Centralni hodnota |

- Apple Watch style soustredne kruhy
- Vnějsi kruh = prvni pilir, kazdy dalsi mensi o `step = strokeWidth(7) + gap(2)`
- Pozadi: `soft` barva pilire (dark-aware)
- Popredi: plna barva pilire, `stroke-dasharray/offset` animace
- Centralni text: `periodTotal.hrs` + `periodTotal.label`
- Legenda pod kruhy: barva teckka + label + procenta

### 4.5 `BarChartCard`

| Prop | Typ | Popis |
|------|-----|-------|
| `history` | `HistoryItem[]` | Cela historie |
| `animate` | `boolean` | Animace |

**Interni state:**
- `barPeriod`: `"day" | "week" | "month"`
- `selected`: index vybraneho baru (null = posledni)

**Chovani:**
- Prepinac Den/Tyden/Mesic nahoze
- Den: poslednich 30 dni, bar sirka 24px, gap 4px
- Tyden: agregovane tydny (max 12), bar 36px, gap 8px
- Mesic: agregovane mesice (max 12), bar 36px, gap 8px
- Kazdy bar ma HRV tecku nad sebou (barva dle `hrvIdx`)
- Vybrany bar: gradient fill, ostatni: `borderStrong` 60% opacity
- Tooltip nahoze: hodnota + datum
- Horizontalni scroll s auto-scroll na konec (den mód)

### 4.6 `PeriodSummary`

| Prop | Typ | Popis |
|------|-----|-------|
| `history` | `HistoryItem[]` | Cela historie |
| `period` | `"week" \| "month"` | Perioda |
| `activePillars` | `Pillar[]` | Aktivni pilire |

**Zobrazuje:**
- Celkove dny zdravi navic (totalHrs / 24)
- 3 stat boxy: Prumer/den, Nejlepsi den, Streak
- Prumerne plneni piliru (pill badges)

### 4.7 `PillarPill`

| Prop | Typ | Popis |
|------|-----|-------|
| `pillar` | `Pillar` | Pilir |
| `value` | `number` | Aktualni plneni (0–1) |
| `onChange` | `(v: number) => void` | Zmena plneni |
| `celebrated` | `string \| null` | Key prave oslaveneho pilire |
| `onCelebrate` | `(key: string) => void` | Callback pri dosazeni 95%+ |

**Chovani:**
- Progress bar s barevnym vyplnenim
- Hidden range input (opacity: 0) na progress baru pro interaktivitu
- Pri 95%+ plneni: ikona → ✅, badge "SPLNENO", glow efekt
- Pri prechodu na 95%+: celebracni animace (`fadeOut` 2s)
- Zobrazuje: label, procenta (badge), hodiny, progress bar

### 4.8 `NudgeCards`

| Prop | Typ | Popis |
|------|-----|-------|
| `data` | `Record<string, number>` | Plneni piliru |
| `activePillars` | `Pillar[]` | Aktivni pilire |

**Chovani:**
- Filtruje pilire s plnenim < 15%
- Zobrazi max 2 karty
- Kazda karta: ikona, label, potencialni hodiny, motivacni zprava, CTA tlacitko
- Levy border 4px solid v barve pilire

### 4.9 `TheGap`

| Prop | Typ | Popis |
|------|-----|-------|
| `data` | `Record<string, number>` | Periodova data |
| `todayData` | `Record<string, number>` | Dnesni data (vzdy dnesek) |
| `hrvState` | `number` | HRV index |
| `age` | `number` | Kalendarni vek |
| `onAgeChange` | `(n: number) => void` | Zmena KV |
| `funcAge` | `number \| null` | Funkcni vek |
| `onFuncAgeChange` | `(n: number) => void` | Zmena FV |
| `animate` | `boolean` | Animace |
| `activePillars` | `Pillar[]` | Aktivni pilire |
| `history` | `HistoryItem[]` | Cela historie |

**Zobrazuje:**
- Hero cislo: `projected.toFixed(1)` let ve zdravi
- 3 horizontalni bary: Potencial (vsechny pilire) / Tva cesta (aktivni) / Prumer populace (65)
- Skala s markery po 5 letech
- 2 slidery: KV (kalendarni vek) a FV (funkcni vek)
- Info box: "Tvé telo je o X let mladsi nez KV"
- Dnesni prispevek + mesicni souhrn
- Nevyuzity potencial (pokud nejsou vsechny pilire aktivni)

---

## 5. Obrazovky a navigace

### 5.1 Stavovy automat

```
                    ┌──────────────┐
                    │  Onboarding  │
                    │  (4 kroky)   │
                    └──────┬───────┘
                           │ "Pokračovat" (step 3)
                           ▼
                    ┌──────────────┐
          ┌────────│  Dashboard   │────────┐
          │        └──────────────┘        │
          │ ← zpet                  ⚙ gear │
          │                                │
          ▼                                ▼
    ┌──────────┐                    ┌──────────┐
    │ Dashboard│                    │ Settings │
    └──────────┘                    └──────────┘
```

State: `screen` = `"onboarding"` | `"dashboard"` | `"settings"`

### 5.2 Onboarding (4 kroky)

State: `onbStep` = 0 | 1 | 2 | 3

#### Step 0 — Hook

- **Otazka:** "Do kolika let můžeš vést aktivní život ve zdraví?"
- **Kontext:** "Průměrný Čech se dožívá 65 let ve zdraví"
- **CTA:** "Chci vědět více"
- Progress bar animovany na 60%
- Dark mode toggle v pravem hornim rohu
- Plna vyska viewport, vycentrovany obsah

#### Step 1 — Vyber piliru

- **Nadpis:** "Které oblasti zdraví chceš řešit?"
- **Popis:** "Vyber oblasti, které tě zajímají. Kdykoli si to můžeš změnit v nastavení."
- Label "Krok 1 z 3"
- Seznam 5 volitelnch piliru (klikaci karty s checkmarkem)
  - Kazdy zobrazuje: ikona, label, popis, `+X.Xh zdravi/den`
  - Vybrany: barevny border + soft background + check circle
- Monitoring karta (always active, dimmed, badge "Vždy aktivní")
- Sticky bottom bar: pocet piliru + max hodiny/den + "Pokracovat"
- Disabled button kdyz `enabledCount === 0`

#### Step 2 — Quick setup per pilir

State: `onbSetupIdx` = index do `activeForSetup[]`

Progress bar nahoze (segmenty za kazdy pilir, aktivni zabarven).

**Spanek (specialni):**
- Vlastni multiSelect UI s 4 cili:
  - "Spát určitý počet hodin denně" (ma hours picker 5–10, step 0.5)
  - "Stejná doba usínání"
  - "Eliminace modrého světla před spaním"
  - "Nevím, co by mi pomohlo" (exclusive — odznaci ostatni)
- Slider pro pocet hodin (pokud vybran "hours" cil)
- Uklada do `onbAnswers.spanek = { goals: string[], hours: number | null }`

**Strava (multiSelect):**
- Multiselect checkbox UI
- Uklada do `onbAnswers.strava = string[]`

**Ostatni pilire (singleSelect):**
- Tap na moznost → okamzite prejde na dalsi pilir
- Uklada do `onbAnswers[key] = string` (label vybrane moznosti)

**Navigace:**
- "← O krok zpět" pro navrat
- Prvni pilir zpet → step 1

#### Step 3 — Potencial

- Hero cislo: `projected.toFixed(1)` let ve zdravi (scale animace)
- 3 bary:
  - Tvuj potencial (vsechny pilire, hatch pattern) — pouze kdyz nejsou vsechny pilire aktivni
  - Tva cesta / Tvuj potencial (aktivni pilire, plny gradient)
  - Prumer populace (65.0, sedy)
- Pillar pills: aktivni (barevne) + neaktivni (dashed border, dimmed)
- Info box: souhrnny text o hodinach
- CTA: "Pokracovat" → `setScreen("dashboard")`

### 5.3 Dashboard

**Layout (vertikalni, shora dolu):**

1. **Header** — "Healthy Life Years" + dark toggle + settings gear
2. **TheGap karta** — hero projekce, bary, slidery, info
3. **Period toggle** — Den / Tyden / Mesic
4. **Chart karta** — Radar / Kruhy / Budiky (tab prepinac)
5. **Pilire zdravi** — interaktivni (den) nebo prumerne (tyden/mesic)
6. **Nudge karty** — pouze v den modu
7. **Bar chart** — Den/Tyden/Mesic historie
8. **HRV Resilience Boost** — 3 tlacitka pro vyber stavu
9. **Reset onboarding** link

**Period filter logika:**

| Period | Data zdroj | Pilire zobrazeni |
|--------|-----------|------------------|
| Den | `data` (DEMO/interaktivni) | Interaktivni slidery (PillarPill) |
| Tyden | Prumer z aktualniho kalendarniho tydne (po–ne) | Read-only prumery |
| Mesic | Prumer z aktualniho kalendarniho mesice | Read-only prumery |

Chart + TheGap pouzivaji `periodData` (prumer za periodu pro charty), ale TheGap **vzdy** pouziva `todayData` pro projekci (aby se nemenila s period filtrem).

### 5.4 Settings

- Back button → dashboard
- **Nadpis:** "Nastavení HLY"
- Seznam 5 piliru s toggle switchi
- Monitoring: vzdy zapnuty, dimmed, "Vždy aktivní"
- Sticky bottom: summary "X pilířů aktivních · max Y.Yh zdraví/den"

---

## 6. Business logika

### 6.1 HLY vypocet (denni)

```
totalMin = Σ (pillar.maxMin × fulfillment[pillar.key])    // pro aktivni pilire
boosted  = totalMin × HRV_STATES[hrvState].mult
totalHrs = boosted / 60
```

Priklad s DEMO hodnotami a HRV "V normě" (×1.1):
```
pohyb:      150 × 0.72 = 108.0 min
spanek:      60 × 0.85 =  51.0 min
strava:      60 × 0.55 =  33.0 min
stres:       30 × 0.05 =   1.5 min
vztahy:      30 × 0.65 =  19.5 min
monitoring:  30 × 1.00 =  30.0 min
─────────────────────────────────
totalMin                = 243.0 min
boosted (×1.1)          = 267.3 min
totalHrs                = 4.46 h
```

### 6.2 Projekce zdraveho veku

```js
effectiveAge = funcAge ?? age;                          // funkcni vek, fallback na kalendarni
remaining    = max(65 - effectiveAge, 0);               // zbyva do prumeru populace
dailyHrs     = (totalMin × HRV_STATES[hrvState].mult) / 60;
yearlyDays   = (dailyHrs × 365) / 24;                  // kolik dnu/rok ziskam
bonusYears   = remaining > 0 ? (yearlyDays × remaining) / 365 : 0;
projected    = 65 + bonusYears;                         // finalni projekce
```

**Dulezite:** Projekce pouziva VZDY `todayData` (ne periodova data), takze se nemeni s period filtrem.

### 6.3 Nevyuzity potencial

```js
allPillarsMax = PILLARS.reduce((s, p) => s + p.maxMin, 0) / 60;  // = 6.0h
allYearlyDays = (allPillarsMax × 365) / 24;
allBonusYears = remaining > 0 ? (allYearlyDays × remaining) / 365 : 0;
maxProjected  = 65 + allBonusYears;

untappedYears = maxProjected - projected;
```

- Zobrazi se pouze kdyz `hasInactive` (ne vsechny pilire aktivni)
- A `untappedYears > 0.5`

### 6.4 Mesicni souhrn (v TheGap)

```js
monthItems   = history.filter(d => sameMonth(d.date, today));
monthTotalHrs = monthItems.reduce((s, d) => s + d.hrsBoosted, 0);
monthDays     = (monthTotalHrs / 24).toFixed(1);
```

### 6.5 Period data vypocet

```js
// "day" → primo data (DEMO)
// "week" → prumer z aktualniho kalendarniho tydne (pondeli–dnes)
// "month" → prumer z aktualniho kalendarniho mesice
periodData[pillar.key] = items.reduce((s, d) => s + d.pillars[pillar.key], 0) / items.length;
```

Aktualni kalendarni tyden:
```js
const dow = now.getDay();  // 0=Sun
const mondayOffset = dow === 0 ? 6 : dow - 1;
const monday = new Date(now); monday.setDate(monday.getDate() - mondayOffset);
monday.setHours(0, 0, 0, 0);
return history.filter(d => d.date >= monday);
```

### 6.6 Max HLY za den

```js
maxHlyDay = selectablePillars                    // bez monitoring
  .filter(p => enabled[p.key])
  .reduce((s, p) => s + p.maxMin, 0) / 60
  + 0.5;                                         // + monitoring (30min = 0.5h)
```

### 6.7 Streak

```js
let streak = 0;
for (let i = items.length - 1; i >= 0; i--) {
  if (items[i].hrsBoosted >= 2) streak++;
  else break;
}
```

Streak = pocet po sobe jdoucich dni s `hrsBoosted >= 2h`.

---

## 7. Agregacni funkce

### 7.1 `aggregateByWeek(history)`

```ts
interface WeekItem {
  avg: number;        // prumerne hrsBoosted za den
  total: number;      // soucet hrsBoosted
  label: string;      // "1.–7."
  date: Date;         // datum posledniho dne
  count: number;      // pocet dni v tydnu
  hrvIdx: number;     // prumerny HRV index (zaokrouhleny)
}
```

- Bere chunky po 7 dnich od konce
- Vraci max 12 polozek

### 7.2 `aggregateByMonth(history)`

```ts
interface MonthItem {
  avg: number;        // prumerne hrsBoosted za den
  total: number;      // soucet hrsBoosted
  label: string;      // "led", "úno" ...
  date: Date;         // datum reprezentujici mesic
  count: number;      // pocet dni v mesici
  hrvIdx: number;     // prumerny HRV index
}
```

- Seskupuje dle `year-month`
- Vraci max 12 polozek

### 7.3 `periodTotal`

```ts
interface PeriodTotal {
  hrs: string;        // "4.5" (day) nebo "142h" (week/month)
  label: string;      // "hodin zdraví" (day) nebo "(5.9 dní)" (week/month)
  days: number;       // pocet dni v periode
}
```

---

## 8. Integracni body pro vyvojare

### 8.1 Prehled nahrazeni

| Misto v kodu | Aktualni stav | Co nahradit | Priorita |
|--------------|---------------|-------------|----------|
| `DEMO` objekt | Hardcoded hodnoty | API call: dnesni plneni piliru | **P0** |
| `generateHistory(365)` | Random mock | API call: historicka data | **P0** |
| `enabled` state | useState default | User profile z backendu | **P0** |
| `age`, `funcAge` | useState(40), useState(32) | User profile | **P1** |
| `hrvState` | useState(1) | Realtime HRV z Apple Health/Google Fit | **P1** |
| `onbAnswers` | Lokalni state | POST na backend pri onboarding completion | **P1** |
| PillarPill `onChange` | Lokalni state | POST habit completion | **P0** |
| PILLAR_META options | Hardcoded | Mozna dynamicke z backendu | **P2** |

### 8.2 Datove kontrakty

#### GET `/api/user/profile`

```json
{
  "age": 40,
  "funcAge": 32,
  "enabledPillars": ["pohyb", "spanek"],
  "darkMode": false,
  "onboardingCompleted": true
}
```

#### GET `/api/hly/today`

```json
{
  "date": "2026-03-17",
  "pillars": {
    "pohyb": 0.72,
    "spanek": 0.85,
    "strava": 0.55,
    "stres": 0.05,
    "vztahy": 0.65,
    "monitoring": 1.0
  },
  "hrvIdx": 1,
  "hrsRaw": 4.05,
  "hrsBoosted": 4.46
}
```

#### GET `/api/hly/history?days=365`

```json
{
  "items": [
    {
      "date": "2025-03-18",
      "hrsRaw": 3.2,
      "hrsBoosted": 3.52,
      "hrvIdx": 1,
      "pillars": {
        "pohyb": 0.68,
        "spanek": 0.90,
        "strava": 0.40,
        "stres": 0.30,
        "vztahy": 0.50,
        "monitoring": 1.0
      }
    }
  ]
}
```

#### POST `/api/hly/pillar`

```json
// Request
{
  "pillarKey": "pohyb",
  "value": 0.85,
  "date": "2026-03-17"
}
// Response
{
  "ok": true,
  "updatedTotals": {
    "hrsRaw": 4.5,
    "hrsBoosted": 4.95
  }
}
```

#### POST `/api/user/onboarding`

```json
{
  "enabledPillars": ["pohyb", "spanek", "strava"],
  "answers": {
    "pohyb": "Synchronizace s Apple Health / Google Fit",
    "spanek": { "goals": ["hours", "bedtime"], "hours": 7.5 },
    "strava": ["Chci se naučit lepší stravovací návyky", "Chci zhubnout"]
  }
}
```

#### PUT `/api/user/settings`

```json
{
  "enabledPillars": ["pohyb", "spanek", "strava"],
  "age": 40,
  "funcAge": 32,
  "darkMode": false
}
```

### 8.3 Apple Health / Google Fit integrace

**Pohyb (source: `"apple_health"`):**
- Kroky, tréninky, aktivní kalorie
- Potřeba: HealthKit / Google Fit SDK
- Mapování na fulfillment: `min(activity_minutes / 150, 1.0)`

**HRV (Resilience Boost):**
- Ranní HRV měření z Apple Health
- Mapování na `hrvIdx`:
  - Pod průměrem (personalizovaný baseline) → 0
  - V normě → 1
  - Nadprůměr → 2

**Monitoring pilíř:**
- Automaticky: HRV měření provedeno + habits zadány + pohyb (sync i manuální)
- `fulfillment = 1.0` pokud alespoň 1 aktivita za den

### 8.4 Backend endpointy souhrn

| Endpoint | Method | Popis |
|----------|--------|-------|
| `/api/user/profile` | GET | Profil uzivatele |
| `/api/user/profile` | PUT | Update profilu (vek, funcAge, darkMode) |
| `/api/user/settings` | PUT | Update nastaveni (enabled pillars) |
| `/api/user/onboarding` | POST | Odeslani onboarding odpovedi |
| `/api/hly/today` | GET | Dnesni plneni piliru + HRV |
| `/api/hly/history` | GET | Historicka data (query: `days`) |
| `/api/hly/pillar` | POST | Zaznamenat plneni pilire |
| `/api/hrv/current` | GET | Aktualni HRV stav |
| `/api/health/sync` | POST | Trigger sync s Apple Health / Google Fit |

---

## 9. Nudge zpravy

```js
const NUDGE_MESSAGES = {
  pohyb:      { msg: "Pohyb je královský pilíř — 1 hodina aktivity ti přidá až 2.5h zdraví.", cta: "Otevřít pohybový plán" },
  spanek:     { msg: "Kvalitní spánek ti může přidat celou hodinu zdraví denně.", cta: "Nastavit spánkový návyk" },
  strava:     { msg: "Správná strava sníží záněty a přidá ti až 1h zdraví denně.", cta: "Přidat stravovací návyk" },
  stres:      { msg: "Dechové cvičení + meditace = 0.5h zdraví denně. Stačí 5 minut.", cta: "Vyzkoušet dechové cvičení" },
  vztahy:     { msg: "Kvalitní vztahy jsou nejsilnější prediktor zdraví ve stáří.", cta: "Přidat sociální návyk" },
  monitoring: { msg: "Ranní HRV měření ti přidá 0.5h zdraví + odemkne bonus.", cta: "Změřit HRV" },
};
```

Nudge se zobrazi pokud `data[pillar.key] < 0.15` (pod 15% plneni). Max 2 karty najednou.

---

## 10. Animace

### CSS Keyframes (definovane v dashboard)

```css
@keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
@keyframes slideUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
```

### Animacni vzory

| Komponenta | Efekt | Timing |
|------------|-------|--------|
| Radar chart | Opacity fade-in | 0.8s ease |
| Activity rings | Stroke dashoffset | 1.2s cubic-bezier + idx×100ms delay |
| Gauge arcs | Stroke dashoffset | 1s cubic-bezier + idx×80ms delay |
| Bar chart bars | Height grow | 0.5s cubic-bezier + i×30ms delay |
| HRV dots | Opacity | 0.4s ease + i×30ms+300ms delay |
| Pillar progress | Width | 0.5s cubic-bezier |
| TheGap bars | Width | 1.3s–1.8s cubic-bezier + delay |
| Onboarding hero | Scale + opacity | 1s cubic-bezier + 0.3s delay |
| Celebration | fadeOut 2s, slideUp 0.4s | On pillar completion |

### Animate state

```js
useEffect(() => { setTimeout(() => setAnimate(true), 150); }, []);
useEffect(() => { setAnimate(false); setTimeout(() => setAnimate(true), 50); }, [chartView, period, screen, darkMode]);
```

Animace se resetuji pri zmene: chart view, periody, obrazovky, dark mode.

---

## 11. Poznamky k implementaci

### 11.1 Jediny soubor

Cely prototyp je v jedinem souboru `src/App.jsx` (1609 radku). Pro produkci je treba rozdelit na:
- Komponenty (kazda do vlastniho souboru)
- Design tokens (theme provider)
- Datovy model / typy
- API vrstva
- Business logika (hooks)
- Navigace (React Router nebo React Navigation pro mobile)

### 11.2 Mobile-first layout

Vsechny obrazovky pouzivaji `width: 393px, maxWidth: "100%"` — simuluje iPhone Pro viewport.

### 11.3 Lokalizace

Vsechny texty jsou v cestine. Formatovani dat pouziva `cs-CZ` locale:
```js
d.toLocaleDateString("cs-CZ", { weekday: "short" })  // "po", "ut" ...
d.toLocaleDateString("cs-CZ", { month: "short" })     // "led", "úno" ...
d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })
```

### 11.4 Inline styly

Zadne CSS tridy ani CSS-in-JS. Vsechny styly jsou inline `style={{}}` objekty s theme tokeny. Pro produkci zvazit migraci na:
- Tailwind CSS
- styled-components
- CSS Modules

### 11.5 Chybejici v prototypu

- Persistentni stav (vse se resetuje pri reloadu)
- Autentizace
- API volani
- Error handling
- Loading stavy
- Offline podpora
- Notifikace / push
- Detailni obrazovky per pilir
- Historie plneni per pilir
- Achievement system (pripraveno v GAMIFICATION.md)
- Realne HRV mereni
