# HLY Algorithm Documentation

## Overview

HLY (Healthy Life Years) is a bonus system that converts daily healthy habits and physical activity into "bonus hours" of healthy life. The core idea: every day a user follows healthy behaviors, they earn HLY credits that represent additional healthy life expectancy beyond the population average.

**Maximum daily bonus: ~6 hours (360 minutes)**

The algorithm is fully individualized per user -- each user has their own set of habits, activities, activity plans, and HRV measurements that feed into the calculation.

---

## 1. Pillars

HLY is built on 6 pillars, each contributing a maximum number of bonus minutes per day:

| Pillar     | Max Bonus   | Weight | Key Evidence                              | Source         |
|------------|-------------|--------|-------------------------------------------|----------------|
| Pohyb      | 150 min (2.5h) | 42%   | Reduces mortality by ~30%                | Activity Plan  |
| Spanek     | 90 min (1.5h)  | 17%   | Cellular regeneration, glymphatic system | Habits         |
| Strava     | 90 min (1.5h)  | 17%   | Insulin resistance prevention            | Habits         |
| Stres      | 45 min (0.75h) | 8%    | Telomere protection                      | Habits         |
| Vztahy     | 30 min (0.5h)  | 8%    | Strongest longevity predictor            | Habits         |
| Monitoring | 30 min (0.5h)  | 8%    | "What gets measured, gets managed"       | HRV Measurement|

**Note:** Spanek and Strava max values are 90 min (not 60 min as in the original concept) because the diminishing returns system allows additional habits beyond the first to contribute up to 50% more (1st habit = 60 min, 2nd = 30 min = 90 min total).

### Pillar Sources

- **Pohyb**: Based on completed items from the user's Activity Plan (e.g., running, walking, tennis). Rule: 4 kcal = 1 min HLY. Completion ratio determines the pillar value (0.0 - 1.0).
- **Spanek, Strava, Stres, Vztahy**: Based on habit completion with geometric diminishing returns.
- **Monitoring**: Binary -- 1.0 if the user performed an HRV measurement that day, 0.0 otherwise.

---

## 2. Dynamic Per-User Habits

Habits are **not hardcoded**. Each user has their own set of habits stored in the database (`habit_favorite` table). Each habit belongs to a category that maps to a pillar:

| DB Category ID | Category Name | Pillar Key |
|----------------|---------------|------------|
| 1              | Moje navyky   | *(none -- user-created, not counted in HLY pillars)* |
| 2              | Strava         | `strava`   |
| 3              | Spanek         | `spanek`   |
| 4              | Stres          | `stres`    |
| 5              | Vztahy         | `vztahy`   |

### How it works

1. On each API request, the system queries all user's favorite habits with their categories from the DB.
2. Habits are grouped by pillar using the `CATEGORY_TO_PILLAR` mapping.
3. The resulting `pillarHabits` object (e.g., `{ strava: [3, 265, 6], spanek: [8, 9] }`) is passed to `computePillars()`.
4. User-created habits (category_id = 1) are displayed in the UI but do not affect HLY calculations.

---

## 3. Habit Weighting (Diminishing Returns)

Each pillar's habit-based value uses **geometric diminishing returns**:

```
1st habit weight: 1.0   (100%)
2nd habit weight: 0.5   (50%)
3rd habit weight: 0.25  (25%)
4th habit weight: 0.125 (12.5%)
...
n-th habit weight: 0.5^(n-1)
```

### Calculation

For a pillar with N habits:

```
weightedSum = sum of (weight_i * completed_i) for each habit
maxPossible = sum of all weights = 1 + 0.5 + 0.25 + ... = 2 * (1 - 0.5^N)
pillarValue = weightedSum / maxPossible  (normalized to 0.0 - 1.0)
```

### Example: Strava with 3 habits

| Habit              | Weight | Completed | Contribution |
|--------------------|--------|-----------|--------------|
| Protein shake      | 1.0    | Yes       | 1.0          |
| Fasting 16:8       | 0.5    | No        | 0.0          |
| Pitny rezim        | 0.25   | Yes       | 0.25         |

```
weightedSum = 1.0 + 0.0 + 0.25 = 1.25
maxPossible = 1.0 + 0.5 + 0.25 = 1.75
pillarValue = 1.25 / 1.75 = 0.714 (71.4%)
strava minutes = 90 * 0.714 = 64.3 min = 1.07h
```

---

## 4. HRV Resilience Boost

HRV (Heart Rate Variability) readiness acts as a multiplier on the daily HLY bonus. The `myAgeReadiness` value (0-100) from the HRV measurement determines the state:

| myAgeReadiness | State | Label           | Multiplier |
|----------------|-------|-----------------|------------|
| < 33           | 0     | Pod prumerem    | 1.00x      |
| 33 - 66        | 1     | V norme         | 1.10x      |
| > 66           | 2     | Nadprumer       | 1.25x      |

### Split HRV Application

HRV is applied differently depending on the pillar type:

- **Pohyb (Activity)**: Uses **yesterday's HRV** -- because today's activity was planned based on yesterday's readiness state.
- **Habits + Monitoring**: Uses **today's HRV** -- because habit completion reflects today's state.

### Example

```
Activity completed: 2.5h base
Yesterday's HRV: Nadprumer (1.25x)
Pohyb with HRV: 2.5h * 1.25 = 3.13h

Habits completed: 1.5h base
Today's HRV: V norme (1.10x)
Habits with HRV: 1.5h * 1.10 = 1.65h
```

---

## 5. Age Coefficient

The system adjusts HLY based on the user's effective age. Starting later in life has a *higher* impact because even small changes dramatically reduce disease risk at older ages.

| Age Range | Coefficient | Rationale                                     |
|-----------|-------------|-----------------------------------------------|
| < 45      | 1.0         | Baseline                                       |
| 45 - 54   | 1.2         | Increased impact of lifestyle changes          |
| >= 55     | 1.5         | Maximum impact -- small changes, big results   |

### Functional Age Override

If an HRV measurement provides a functional age (`funcAge` from CA5 algorithm), this overrides the chronological age for the coefficient calculation. This means a 40-year-old with the cardiovascular profile of a 50-year-old would get the 1.2x coefficient.

### Age Penalty

If `funcAge > chronological age`, the user has a biological disadvantage. The age coefficient uses the functional age, which may push them into a higher coefficient bracket -- a higher coefficient means their efforts count *more*, reflecting the greater urgency and impact of health behaviors.

---

## 6. Daily HLY Calculation

The full daily calculation follows this pipeline:

```
For each pillar:
  1. Compute pillar value (0.0 - 1.0)
  2. Convert to base minutes: pillarValue * PILLAR_MAX_MIN[pillar]
  3. Apply age coefficient: baseMinutes * ageCoef
  4. Apply HRV multiplier: minutes * hrvMultiplier
  5. Convert to hours: minutes / 60

Total HLY = sum of all pillar hours
```

### Full Example (one day)

**User profile:** Age 38 (funcAge 37), chronological age coefficient = 1.0

**Yesterday's HRV:** myAgeReadiness = 72 -> Nadprumer -> 1.25x
**Today's HRV:** myAgeReadiness = 55 -> V norme -> 1.10x

| Pillar     | Value | Max Min | Base Hours | x Age(1.0) | x HRV     | Final    |
|------------|-------|---------|------------|------------|-----------|----------|
| Pohyb      | 1.00  | 150     | 2.50h      | 2.50h      | x1.25     | **3.13h**|
| Spanek     | 0.67  | 90      | 1.00h      | 1.00h      | x1.10     | **1.10h**|
| Strava     | 0.71  | 90      | 1.07h      | 1.07h      | x1.10     | **1.18h**|
| Stres      | 0.50  | 45      | 0.38h      | 0.38h      | x1.10     | **0.41h**|
| Vztahy     | 1.00  | 30      | 0.50h      | 0.50h      | x1.10     | **0.55h**|
| Monitoring | 1.00  | 30      | 0.50h      | 0.50h      | x1.10     | **0.55h**|
| **TOTAL**  |       |         | **5.95h**  | **5.95h**  |           | **6.92h**|

---

## 7. Activity Plan

The Pohyb (Movement) pillar is driven by the user's Activity Plan, not habits. Each user has personalized activity items per day:

- Activities are fetched from `app_users_physical_activity_plan_items` joined with `app_users_activity_detailed_type` for names.
- Each item has: `typeId`, `completed`, `energyOutput` (kcal), `recommendedIntensity` (light/moderate/high), `recommendedMinutesDuration`, `recommendedStepsCount`.
- Pillar value = completed items / total items.

### Energy Rule

The foundational rule for Pohyb is:
```
4 kcal of exercise energy = 1 minute of HLY
1 hour of intense exercise (~600 kcal) = 150 minutes = 2.5 hours HLY
```

The Activity Plan's completion percentage determines what fraction of the 150-minute maximum the user earns.

---

## 8. Life Expectancy Projection

### Baseline

The Czech population average for Healthy Life Years is **65 years**. This serves as the starting point.

### Adjusted Baseline (with Functional Age)

```
expectedHLY = 65 - (functionalAge - chronologicalAge)
```

If a user's functional age is higher than their chronological age, their expected HLY decreases, and vice versa.

### HLY Accumulation

```
currentHLY = expectedHLY + (totalBonusHours / (24 * 365))
```

All earned bonus hours since the user started using Elonga are accumulated and converted to years of additional healthy life.

### Future Projection

Based on the user's average daily HLY performance over the last 7-20 days:

```
projectedYears = averageDailyHLY * remainingDays / (24 * 365)
predictedHLY = expectedHLY + projectedYears
```

**Example for a 40-year-old:**
- Remaining years to average HLY: 65 - 40 = 25 years
- Average daily performance: 4 hours HLY
- Annual bonus: 4h * 365 = 1,460 hours = ~61 days
- 25-year bonus: 61 * 25 = 1,525 days = ~4.2 years
- **Prediction: HLY shifts from 65 to 69.2 years**

---

## 9. Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `habit_favorite` | User's active habits (`user_id`, `habit_id`, `color`, `users_weekly_goal`) |
| `habit` | Habit definitions (`id`, `category_id`) |
| `habit_translation` | Habit names (`habit_id`, `habit_name`, `language`) |
| `habit_category_translation` | Category names (`category_id`, `name`, `language`) |
| `user_habit_completion` | Daily habit completions (`user_id`, `habit_id`, `date`) |
| `app_users_physical_activity_plans` | User's activity plans (`usersId`, `start`, `end`) |
| `app_users_physical_activity_plan_items` | Daily activity items (`planId`, `typeId`, `completed`, `energyOutput`, `recommendedIntensity`, `recommendedMinutesDuration`, `recommendedStepsCount`) |
| `app_users_activity_detailed_type` | Activity type names (`id`, `description`) |
| `measurement_store` | HRV measurements (`usersId`, `readinessTrial`) |
| `measurement_store_relative_values` | HRV readiness values (`measurementId`, `myAgeReadiness`) |
| `app_users` | User profiles (`id`, `birthdate`) |

### Important Notes

- **Mixed naming conventions**: `user_habit_completion` uses snake_case, `measurement_store` uses camelCase. Always `DESCRIBE` before writing new queries.
- **Timezone handling**: DB stores dates in CET (UTC+1). Always use `DATE_FORMAT(date, '%Y-%m-%d')` in SQL to avoid JS timezone conversion errors.

---

## 10. API Endpoints

### GET `/api/user/:userId/today`

Returns the current day's HLY summary with pillar values and total hours.

### GET `/api/user/:userId/history?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns per-day HLY data for charting, including pillar breakdown, HRV state, and boosted hours.

### GET `/api/user/:userId/debug?date=YYYY-MM-DD`

Returns detailed debug information for a single day:
- Full pillar breakdown with calculation steps
- Individual habit completion status and weights
- Activity plan items with names and energy
- HRV application details (which HRV applies to which pillar)
- Age coefficient and functional age
- All user habits (HLY + user-created) with completion status

---

## 11. Architecture

```
React Frontend (Vite :5173)
  |
  |-- Vite proxy -->
  |
Express Backend (:3001)
  |
  |-- mysql2 pool -->
  |
MariaDB RDS (mysasy-measurement)
```

### Key Files

| File | Purpose |
|------|---------|
| `server/pillars.js` | Core algorithm: `computePillars()`, `buildHistory()`, `buildPillarHabits()`, `ageCoefficient()`, `getHrvState()` |
| `server/queries.js` | All SQL queries with timezone-safe date formatting |
| `server/index.js` | Express server with API endpoints (today, history, debug) |
| `src/App.jsx` | React frontend with chart views and debug panel |
| `src/api.js` | Frontend API client |

---

## 12. Debug Mode

The debug panel (accessible in the app) shows the complete calculation breakdown for any given day:

1. **Pillar table**: Shows each pillar's max minutes, habit count, and source
2. **Per-pillar detail**: For each pillar, shows:
   - Individual habits with weights and completion status
   - Weighted sum, max possible, and normalized value
   - Base hours, age coefficient application, HRV multiplier
   - Which HRV measurement (today vs yesterday) applies
3. **Activity Plan**: Lists all activities with names, completion status, energy (kcal)
4. **Habits overview**:
   - HLY habits grouped by category (Strava, Spanek, Stres, Vztahy)
   - User-created habits ("Moje navyky") shown separately
5. **HRV details**: Readiness value, state, multiplier, and functional age
6. **Final calculation**: Step-by-step from raw hours through age coefficient to HRV-boosted total
