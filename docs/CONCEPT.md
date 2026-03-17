# HLY Koncept — Vědecké principy

> Autor: Radim Šlachta | Produktová adaptace: Ondřej Seer

## Základní princip

Průměrný Čech se dožívá **65 let ve zdraví** (Healthy Life Years). Každý zdravý návyk, který uživatel dodrží, mu přidává **bonusové hodiny**, které se kumulativně přepočítávají na dny, měsíce a roky zdravého života navíc.

Maximální denní bonus: **6 hodin HLY**.

## Šest pilířů zdraví

| Pilíř | Max. bonus/den | Váha | Vědecký základ |
|---|---|---|---|
| Pohyb | 2,5 hod (150 min) | 42 % | Harvard/Circulation 2022: 150–300 min aktivity/týden → -21–31 % mortalita |
| Spánek | 1,0 hod (60 min) | 17 % | Matthew Walker: zkrácení na 6h → +400 % KV riziko |
| Strava | 1,0 hod (60 min) | 17 % | The Lancet 2019: vláknina/celozrna → -15–30 % chronické nemoci |
| Stres | 0,5 hod (30 min) | 8 % | PNAS: chronický stres zrychluje buněčné stárnutí o 10 let |
| Vztahy | 0,5 hod (30 min) | 8 % | Harvard Study of Adult Development (80 let): nejsilnější prediktor |
| Monitoring | 0,5 hod (30 min) | 8 % | "What gets measured, gets managed" |

### Pravidlo 50% pro další návyky

Každý **další** návyk ve stejném pilíři přidává bonus s 50% účinností. Např. pokud mám 2 stravovací návyky, druhý přidá jen 0.5h místo 1h.

## HRV Resilience Boost

HRV funguje jako **úroková sazba** na účtu zdraví:

| HRV stav | Multiplikátor | Efekt |
|---|---|---|
| Pod průměrem (červená) | ×1,0 | Základní body, žádný bonus |
| V normě (zelená) | ×1,1 | +10 % ke všem HLY hodinám |
| Nadprůměr (excelentní) | ×1,25 | +25 % ke všem HLY hodinám |

## Výpočet predikce

```
předpokl_HLY = 65 - (funkční_věk - kalendářní_věk)
HLY_current = předpokl_HLY + (Σ HLY_credits / (24 × 365))
```

### Příklad: Tomáš, 40 let

1. Zbývá do průměrného HLY: 25 let (65 - 40)
2. Průměrný denní zisk: 4 hodiny HLY
3. Za rok: 1 460 hodin ≈ 61 dní
4. Za 25 let: 1 525 dní ≈ **4,2 roku**
5. Predikce: **69,2 let** (z 65)

## Vizualizace: "The Gap"

Tři úsečky:
1. **Čárkovaná** — Tvůj potenciál (100 % všech pilířů + max HRV)
2. **Barevná (gradient)** — Tvá aktuální cesta
3. **Šedá** — Průměr populace (65 let)

## Věkový koeficient

- 35 let: koeficient 1.0
- 55 let: koeficient 1.2–1.5 (malá změna má dramaticky vyšší dopad)

## Otevřené otázky

Viz [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md)
