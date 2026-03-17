# Elonga HLY Prototype

Interaktivní prototyp vizualizace **Healthy Life Years (HLY)** pro mobilní aplikaci Elonga.

## Quick Start

```bash
npm install
npm run dev
```

Otevře se na `http://localhost:3000`

## Co to je

HLY je metrika, která převádí každodenní zdravé návyky uživatele na **hodiny života ve zdraví navíc**. Uživatel každý den vidí, kolik hodin zdravého života získal, a může sledovat svou dlouhodobou projekci oproti populačnímu průměru (65 let v ČR).

## Struktura projektu

```
elonga-hly-prototype/
├── docs/
│   ├── CONCEPT.md          # Vědecký koncept HLY (Radim Šlachta)
│   ├── PRODUCT.md           # Produktový popis pro tým
│   ├── DATA-INPUTS.md       # Zdroje dat pro jednotlivé pilíře
│   ├── GAMIFICATION.md      # Nudge/celebration mechaniky
│   └── OPEN-QUESTIONS.md    # Otevřené otázky k řešení
├── src/
│   ├── main.jsx             # Entry point
│   ├── App.jsx              # Hlavní komponenta (monolith, refaktor later)
│   ├── constants.js         # Design tokens, pilíře, HRV stavy
│   └── styles.css           # Globální styly + animace
├── index.html
├── package.json
└── vite.config.js
```

## Klíčové obrazovky

### Den
- Radar / Budíky (semicircle gauges) — plnění 6 pilířů
- HRV Resilience Boost — multiplikátor ×1.0 / ×1.1 / ×1.25
- Pilíře zdraví — detail s interaktivními slidery
- Nudge karty — pro nepoužívané pilíře

### Týden / Měsíc
- Period summary (celkové dny navíc, průměr, streak)
- Denní bar chart
- Kumulativní trend

### Vždy viditelné (hero)
- **The Gap** — 3 úsečky (potenciál / tvá cesta / průměr populace)
- Motivační zpráva
- Věkový slider pro simulaci

## Autor konceptu

- **Radim Šlachta** — vědecký framework HLY
- **Ondřej Seer** — produktový design a vizualizace
