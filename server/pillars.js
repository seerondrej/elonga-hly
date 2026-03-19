// Pillar computation: maps raw DB data to per-day HLY fractions

// Habit IDs per pillar (exported for debug)
export const PILLAR_HABITS = {
  spanek: [8, 9],     // Sleep 7.5h + Blue light
  strava: [3, 265],   // Protein shake + Fasting 16:8
  stres: [325, 851],  // Gratitude + no after-hours work
  vztahy: [20],       // Rodina/partner
};

// Habit names for debug display
export const HABIT_NAMES = {
  8: 'Sleep 7.5h',
  9: 'Blue light block',
  3: 'Protein shake',
  265: 'Fasting 16:8',
  325: 'Gratitude',
  851: 'No after-hours work',
  20: 'Rodina/partner',
};

// Max minutes per pillar
export const PILLAR_MAX_MIN = {
  pohyb: 150,
  spanek: 90,
  strava: 90,
  stres: 45,
  vztahy: 30,
  monitoring: 30,
};

/**
 * Compute geometric weight for the n-th habit (0-indexed): 1, 0.5, 0.25, ...
 */
function habitWeight(index) {
  return Math.pow(0.5, index);
}

/**
 * Compute max possible pillar value for a given number of habits.
 * Sum of geometric series: 1 + 0.5 + 0.25 + ... = 2 * (1 - 0.5^n)
 */
export function pillarMaxVal(habitCount) {
  if (habitCount <= 0) return 0;
  if (habitCount === 1) return 1;
  let sum = 0;
  for (let i = 0; i < habitCount; i++) sum += habitWeight(i);
  return sum;
}

/**
 * Compute pillar values for a SINGLE DAY based on which habits were completed that day.
 * Uses geometric weighting: 1st habit = full value, 2nd = 50%, 3rd = 25%, etc.
 *
 * @param {Set<number>} todayHabitIds - set of habit IDs completed TODAY
 * @param {boolean} hasMeasurement - whether an HRV measurement exists today
 * @param {{ completed: number, total: number }} activity - activity plan item counts for today
 * @returns {{ pillars: Object, habitCounts: Object }}
 */
export function computePillars(todayHabitIds, hasMeasurement, activity) {
  const pillars = {};
  const habitCounts = {};

  // Pohyb: completed / total activity plan items (single source, always max 1.0)
  pillars.pohyb = activity.total > 0 ? Math.min(activity.completed / activity.total, 1.0) : 0;
  habitCounts.pohyb = 1;

  // Habit-based pillars: geometric weighting, daily check
  for (const [pillar, habitIds] of Object.entries(PILLAR_HABITS)) {
    let weightedSum = 0;
    for (let i = 0; i < habitIds.length; i++) {
      const id = habitIds[i];
      const completed = todayHabitIds.has(id) ? 1 : 0;
      weightedSum += completed * habitWeight(i);
    }
    const maxPossible = pillarMaxVal(habitIds.length);
    pillars[pillar] = maxPossible > 0 ? weightedSum / maxPossible : 0;
    habitCounts[pillar] = habitIds.length;
  }

  // Monitoring: 1 if HRV measurement exists, 0 otherwise
  pillars.monitoring = hasMeasurement ? 1.0 : 0;
  habitCounts.monitoring = 1;

  return { pillars, habitCounts };
}

/**
 * Compute age coefficient for HLY calculation.
 * At age < 45: coefficient = 1.0 (baseline)
 * At age 45-54: coefficient = 1.2
 * At age >= 55: coefficient = 1.5 (max)
 * @param {number} age - chronological or functional age
 * @returns {number} coefficient
 */
export function ageCoefficient(age) {
  if (age < 45) return 1.0;
  if (age < 55) return 1.2;
  return 1.5;
}

/**
 * Determine HRV state from myAgeReadiness
 * @param {number|null} readiness - myAgeReadiness value (0-100)
 * @returns {number} 0=Pod prumerem, 1=V norme, 2=Nadprumer
 */
export function getHrvState(readiness) {
  if (readiness == null) return 0;
  if (readiness < 33) return 0;
  if (readiness <= 66) return 1;
  return 2;
}

// HRV multipliers matching frontend
const HRV_MULTIPLIERS = { 0: 1.0, 1: 1.1, 2: 1.25 };

/**
 * Process bulk query results into per-day pillar data with split HRV logic
 * - Yesterday's HRV → pohyb (activity)
 * - Today's HRV → habits + monitoring
 */
export function buildHistory(habitRows, readinessRows, measurementDays, activityRows, startDate, endDate, userAgeCoef = 1.0) {
  // Index habits by day
  const habitsByDay = {};
  for (const row of habitRows) {
    const day = formatDate(row.day);
    if (!habitsByDay[day]) habitsByDay[day] = new Set();
    habitsByDay[day].add(row.habit_id);
  }

  // Index readiness by day
  const readinessByDay = {};
  for (const row of readinessRows) {
    const day = formatDate(row.day);
    readinessByDay[day] = row.readiness;
  }

  // Index measurement existence by day
  const measurementSet = new Set(measurementDays.map(r => formatDate(r.day)));

  // Index activity by day
  const activityByDay = {};
  for (const row of activityRows) {
    const day = formatDate(row.day);
    if (!activityByDay[day]) activityByDay[day] = { completed: 0, total: 0 };
    activityByDay[day].total++;
    if (row.completed) activityByDay[day].completed++;
  }

  // Build per-day entries
  const history = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayStr = d.toISOString().slice(0, 10);

    // Get yesterday's date for activity HRV
    const yesterday = new Date(d);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const todayHabits = habitsByDay[dayStr] || new Set();
    const hasMeasurement = measurementSet.has(dayStr);
    const activity = activityByDay[dayStr] || { completed: 0, total: 0 };
    const { pillars, habitCounts } = computePillars(todayHabits, hasMeasurement, activity);

    // Today's HRV (for habits + monitoring)
    const todayReadiness = readinessByDay[dayStr] ?? null;
    const todayHrvState = getHrvState(todayReadiness);
    const todayHrvMult = HRV_MULTIPLIERS[todayHrvState];

    // Yesterday's HRV (for pohyb)
    const yesterdayReadiness = readinessByDay[yesterdayStr] ?? null;
    const yesterdayHrvState = getHrvState(yesterdayReadiness);
    const yesterdayHrvMult = HRV_MULTIPLIERS[yesterdayHrvState];

    // Calculate hours with split HRV logic
    // Pohyb: uses yesterday's HRV
    const pohybRaw = (PILLAR_MAX_MIN.pohyb * (pillars.pohyb || 0)) / 60;
    const pohybBoosted = pohybRaw * userAgeCoef * yesterdayHrvMult;

    // Habits + Monitoring: use today's HRV
    const habitsRaw = ['spanek', 'strava', 'stres', 'vztahy', 'monitoring'].reduce((sum, key) => {
      return sum + (PILLAR_MAX_MIN[key] * (pillars[key] || 0)) / 60;
    }, 0);
    const habitsBoosted = habitsRaw * userAgeCoef * todayHrvMult;

    const hrsRaw = pohybRaw + habitsRaw;
    const hrsBoosted = pohybBoosted + habitsBoosted;

    history.push({
      date: dayStr,
      pillars,
      habitCounts,
      hrvIdx: todayHrvState,
      readiness: todayReadiness,
      // New fields with correct split HRV calculation
      hrsRaw: Math.round(hrsRaw * 100) / 100,
      hrsBoosted: Math.round(hrsBoosted * 100) / 100,
      // Additional HRV info
      yesterdayHrvIdx: yesterdayHrvState,
    });
  }

  return history;
}

function formatDate(d) {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === 'string') return d.slice(0, 10);
  return String(d).slice(0, 10);
}
