# Datové vstupy pro HLY pilíře

## Přehled

Všechny pilíře kromě Pohybu a Monitoringu závisí na **funkci Zdravé návyky (Habits)**. Uživatel musí:

1. Ráno provést 3min HRV měření
2. Zadat splnění/nesplnění včerejších návyků
3. (Volitelně) mít synchronizaci s Apple Health / Google Fit

## Detail podle pilířů

### 🏃 Pohyb (max 2.5h HLY/den)

**Zdroj:** Apple Health / Google Fit synchronizace + manuální vstup

- Data přicházejí automaticky ze synchronizace
- Uživatel může zadat pohyb i manuálně
- Logika: 4 kcal spálené pohybem = 1 minuta HLY
- 1 hodina intenzivní aktivity ≈ 2.5 hodiny HLY bonusu
- **DB tabulka:** `app_users_physical_activity_plans`, Apple Health sync data

### 🌙 Spánek (max 1.0h HLY/den)

**Zdroj:** Habits (self-report)

- Uživatel si zaškrtne, zda spal dostatečně (7-8h) a v pravidelný čas
- Nemáme spánkovou integraci (zatím)
- **Budoucí možnost:** integrace se spánkovými trackery
- **DB tabulka:** `user_habit_completion`

### 🥗 Strava (max 1.0h HLY/den)

**Zdroj:** Habits (self-report)

- Uživatel si zaškrtne splnění stravovacího návyku
- Příklady: 12h okno bez jídla, příjem vlákniny, kalorický deficit
- **DB tabulka:** `user_habit_completion`

### 🧘 Stres (max 0.5h HLY/den)

**Zdroj:** Habits (self-report)

- Uživatel si zaškrtne provedení dechového cvičení nebo meditace
- HRV validace ráno potvrdí efekt (→ Resilience Boost)
- **DB tabulka:** `user_habit_completion`

### ❤️ Vztahy (max 0.5h HLY/den)

**Zdroj:** Habits (self-report)

- Uživatel si zaškrtne kvalitní sociální interakci
- Nejvíce subjektivní pilíř
- **DB tabulka:** `user_habit_completion`

### 📊 Monitoring (max 0.5h HLY/den)

**Zdroj:** Automatický (kombinace tří vstupů)

Monitoring odráží celkovou disciplínu uživatele — zda aktivně sleduje své zdraví:

1. **HRV měření** — provedení ranního 3min měření → automaticky detekováno
2. **Habits zadání** — zaškrtnutí splnění/nesplnění návyků → automaticky detekováno
3. **Pohyb** — sync z Apple Health / Google Fit NEBO manuální zadání aktivity

Stačí kombinace těchto vstupů pro naplnění pilíře. Uživatel nemusí splnit všechny tři, ale čím víc vstupů, tím vyšší plnění.

- **DB tabulky:** `measurement_store`, `user_habit_completion`, `app_users_physical_activity_plans`

## Závislostní řetězec

```
Uživatel ráno
    ├── Měří HRV (3 min)                    → Monitoring pilíř ✓ (vstup 1/3)
    ├── Zadává habits                        → Spánek/Strava/Stres/Vztahy ✓
    │                                          + Monitoring ✓ (vstup 2/3)
    └── Sync Apple Health / GFit / manuálně  → Pohyb ✓
                                               + Monitoring ✓ (vstup 3/3)

Výstup: HLY hodiny za den
```

## Kritický insight

**Téměř vše závisí na habits zadávání.** Uživatel musí:
- Ráno se změřit
- Zadat, zda splnil včerejší návyky

Bez tohoto vstupu systém nemá data pro 5 z 6 pilířů. To je potenciální UX bottleneck — viz [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md).
