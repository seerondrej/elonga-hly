# Otevřené otázky

## Z Radimova konceptu (původní)

- [ ] Jak se budou chovat habits, které si lidi sami zadávají? Jaký bonusový parametr?
- [ ] Zkusíme defaultně 65 let HLY pro ČR?
- [ ] Jak to bude pro ostatní státy? Hledat průměr, nebo per-country?
- [ ] Upravovat průměrný věk dožití podle vstupního dotazníku (kouření, aktivita)?
- [ ] Jak by měl být teoretický věk dožití ovlivněný aktuálním funkčním věkem?

## Produktové

- [ ] **Závislost na habits self-reportu:** 5 z 6 pilířů závisí na manuálním zadávání. Není to pro uživatele příliš náročné? Co když zapomene zadat?
- [ ] **Cold start:** Nový uživatel nemá historii. Co mu ukážeme první den? Jen potenciál?
- [ ] **Vědecká zodpovědnost:** Můžeme uživateli říct "prodloužíš si život o 4 roky"? Není to příliš silné tvrzení? Potřebujeme disclaimer?
- [ ] **Frekvence vyhodnocení:** Jak často přepočítáváme projekci? Denně? Po každém habit completion?
- [ ] **Spánková integrace:** Máme plán na automatický sleep tracking? Bez něj je spánek pilíř slabý (jen self-report).

## UX

- [ ] **Onboarding HLY:** Kolik kroků potřebujeme, aby uživatel pochopil systém? Radimův koncept je komplexní.
- [ ] **Umístění v appce:** Nový tab "HLY"? Součást Home? Nahrazuje stávající metriky?
- [ ] **Vztah k Readiness:** Jak se HLY vztahuje k existující Readiness metrice? Konkurují si? Doplňují se?
- [ ] **Sauna/pitný režim problém:** Survey ukázal, že některé návyky (sauna, hydratace) vychází negativně. Jak to ošetřit v HLY?

## Technické

- [ ] **Backend výpočet:** Kde poběží HLY engine? Backend (Tomáš) nebo mobilní app?
- [ ] **Baseline kalibrace:** Jak stanovíme uživatelův baseline HRV pro Resilience Boost?
- [ ] **Historical backfill:** Můžeme zpětně dopočítat HLY pro existující uživatele s historií?
- [ ] **Caching:** Projekce věku dožití je výpočetně náročná. Cachovat denně?

## Validace

- [ ] **A/B test:** HLY screen vs. stávající Habits screen → měřit engagement, retention
- [ ] **Kvalitativní rozhovory:** 5-8 uživatelů, ukázat prototyp, zjistit srozumitelnost
- [ ] **Korelace:** Ověřit, zda uživatelé s vyšším HLY skóre mají skutečně lepší HRV trend
