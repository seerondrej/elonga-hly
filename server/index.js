import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import * as Q from './queries.js';
import { computePillars, getHrvState, buildHistory, ageCoefficient, buildPillarHabits, CATEGORY_TO_PILLAR, PILLAR_MAX_MIN, pillarMaxVal } from './pillars.js';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// CORS - allow frontend from any origin
app.use(cors());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
});

// Verify connection on startup
pool.getConnection()
  .then(conn => { console.log('Connected to MariaDB'); conn.release(); })
  .catch(err => { console.error('DB connection failed:', err.message); process.exit(1); });

// ─── Today endpoint ───
app.get('/api/user/:userId/today', async (req, res) => {
  const userId = Number(req.params.userId);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [
      [habitRows],
      [readinessRows],
      [measurementRows],
      [activityRows],
      [userRows],
      [userHabitsRows],
    ] = await Promise.all([
      pool.query(Q.HABIT_COMPLETIONS, [userId, today, today]),
      pool.query(Q.READINESS_VALUES, [userId, today, today]),
      pool.query(Q.MEASUREMENT_EXISTS, [userId, today, today]),
      pool.query(Q.ACTIVITY_PLAN_ITEMS, [userId, today, today]),
      pool.query(Q.USER_PROFILE, [userId]),
      pool.query(Q.USER_HABITS_WITH_NAMES, [userId]),
    ]);

    const pillarHabits = buildPillarHabits(userHabitsRows);
    const todayHabitIds = new Set(habitRows.map(r => r.habit_id));
    const hasMeasurement = measurementRows.length > 0;
    const activity = { completed: 0, total: 0 };
    for (const row of activityRows) {
      activity.total++;
      if (row.completed) activity.completed++;
    }

    const { pillars, habitCounts } = computePillars(todayHabitIds, hasMeasurement, activity, pillarHabits);
    const readiness = readinessRows.length > 0 ? readinessRows[readinessRows.length - 1].readiness : null;
    const hrvState = getHrvState(readiness);
    const lastCA5 = readinessRows.length > 0 ? readinessRows[readinessRows.length - 1].funcAge : null;
    const funcAge = (lastCA5 != null && lastCA5 > 10 && lastCA5 < 120) ? Math.round(lastCA5 * 10) / 10 : null;

    // Calculate age from birthdate
    const birthdate = userRows[0]?.birthdate;
    let age = 37; // default
    if (birthdate) {
      const bd = new Date(birthdate);
      const now = new Date();
      age = now.getFullYear() - bd.getFullYear();
      const m = now.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    }

    // Age coefficient: uses functional age if available, otherwise chronological
    const effectiveAge = funcAge != null ? funcAge : age;
    const ageCoef = Math.round(ageCoefficient(effectiveAge) * 100) / 100;

    res.json({ pillars, habitCounts, hrvState, readiness, age, funcAge, ageCoef });
  } catch (err) {
    console.error('Error in /today:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── History endpoint ───
app.get('/api/user/:userId/history', async (req, res) => {
  const userId = Number(req.params.userId);
  const days = Math.min(Number(req.query.days) || 90, 365);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  try {
    const [
      [habitRows],
      [readinessRows],
      [measurementRows],
      [activityRows],
      [userRows],
      [userHabitsRows],
    ] = await Promise.all([
      pool.query(Q.HABIT_COMPLETIONS, [userId, startStr, endStr]),
      pool.query(Q.READINESS_VALUES, [userId, startStr, endStr]),
      pool.query(Q.MEASUREMENT_EXISTS, [userId, startStr, endStr]),
      pool.query(Q.ACTIVITY_PLAN_ITEMS, [userId, startStr, endStr]),
      pool.query(Q.USER_PROFILE, [userId]),
      pool.query(Q.USER_HABITS_WITH_NAMES, [userId]),
    ]);

    const pillarHabits = buildPillarHabits(userHabitsRows);

    // Calculate age from birthdate
    const birthdate = userRows[0]?.birthdate;
    let age = 37; // default
    if (birthdate) {
      const bd = new Date(birthdate);
      const now = new Date();
      age = now.getFullYear() - bd.getFullYear();
      const m = now.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    }

    // Get functional age from latest readiness (if available)
    const lastReadiness = readinessRows.length > 0 ? readinessRows[readinessRows.length - 1] : null;
    const funcAge = (lastReadiness?.funcAge != null && lastReadiness.funcAge > 10 && lastReadiness.funcAge < 120)
      ? lastReadiness.funcAge : null;
    const effectiveAge = funcAge != null ? funcAge : age;
    const userAgeCoef = ageCoefficient(effectiveAge);

    const history = buildHistory(habitRows, readinessRows, measurementRows, activityRows, startStr, endStr, userAgeCoef, pillarHabits);

    res.json({ history, ageCoef: userAgeCoef });
  } catch (err) {
    console.error('Error in /history:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Debug endpoint ───
const HRV_MULTIPLIERS = { 0: 1.0, 1: 1.1, 2: 1.25 };
const HRV_LABELS = { 0: 'Pod průměrem', 1: 'V normě', 2: 'Nadprůměr' };

app.get('/api/user/:userId/debug', async (req, res) => {
  const userId = Number(req.params.userId);
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  // Calculate yesterday's date for activity HRV
  const dateObj = new Date(date + 'T00:00:00');
  const yesterdayObj = new Date(dateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterday = yesterdayObj.toISOString().slice(0, 10);

  try {
    const [
      [habitRows],
      [readinessRows],          // Today's readiness (for habits)
      [yesterdayReadinessRows], // Yesterday's readiness (for activity)
      [measurementRows],
      [activityRows],
      [userRows],
      [userHabitsRows],
    ] = await Promise.all([
      pool.query(Q.HABIT_COMPLETIONS, [userId, date, date]),
      pool.query(Q.READINESS_VALUES, [userId, date, date]),
      pool.query(Q.READINESS_VALUES, [userId, yesterday, yesterday]),
      pool.query(Q.MEASUREMENT_EXISTS, [userId, date, date]),
      pool.query(Q.ACTIVITY_PLAN_ITEMS, [userId, date, date]),
      pool.query(Q.USER_PROFILE, [userId]),
      pool.query(Q.USER_HABITS_WITH_NAMES, [userId]),
    ]);

    const pillarHabits = buildPillarHabits(userHabitsRows);
    const completedHabitIds = new Set(habitRows.map(r => r.habit_id));
    const hasMeasurement = measurementRows.length > 0;

    // Activity breakdown
    const INTENSITY_LABELS = { light: 'Lehká', moderate: 'Střední', high: 'Vysoká' };
    const activityItems = activityRows.map(r => {
      let name = r.activityName;
      if (!name) {
        // Build descriptive name from available fields
        const parts = [];
        if (r.recommendedIntensity) parts.push(INTENSITY_LABELS[r.recommendedIntensity] || r.recommendedIntensity);
        if (r.recommendedMinutesDuration) parts.push(`${r.recommendedMinutesDuration} min`);
        if (r.recommendedStepsCount) parts.push(`${r.recommendedStepsCount} kroků`);
        name = parts.length > 0 ? parts.join(', ') : `Aktivita #${r.id}`;
      }
      return {
        name,
        completed: !!r.completed,
        energy: r.energyOutput,
        intensity: r.recommendedIntensity,
        duration: r.recommendedMinutesDuration,
        steps: r.recommendedStepsCount,
      };
    });
    const activityCompleted = activityItems.filter(a => a.completed).length;
    const activityTotal = activityItems.length;

    // Calculate age
    const birthdate = userRows[0]?.birthdate;
    let age = 37;
    if (birthdate) {
      const bd = new Date(birthdate);
      const now = new Date();
      age = now.getFullYear() - bd.getFullYear();
      const m = now.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
    }

    // Today's HRV (for habits) - dnešní HRV → včerejší habits
    const todayReadiness = readinessRows.length > 0 ? readinessRows[readinessRows.length - 1].readiness : null;
    const todayHrvState = getHrvState(todayReadiness);
    const todayHrvMult = HRV_MULTIPLIERS[todayHrvState];

    // Yesterday's HRV (for activity) - včerejší HRV → včerejší pohyb
    const yesterdayReadiness = yesterdayReadinessRows.length > 0 ? yesterdayReadinessRows[yesterdayReadinessRows.length - 1].readiness : null;
    const yesterdayHrvState = getHrvState(yesterdayReadiness);
    const yesterdayHrvMult = HRV_MULTIPLIERS[yesterdayHrvState];

    // Func age from today's measurement
    const lastCA5 = readinessRows.length > 0 ? readinessRows[readinessRows.length - 1].funcAge : null;
    const funcAge = (lastCA5 != null && lastCA5 > 10 && lastCA5 < 120) ? Math.round(lastCA5 * 10) / 10 : null;
    const effectiveAge = funcAge != null ? funcAge : age;
    const ageCoef = ageCoefficient(effectiveAge);

    // Build detailed pillar breakdown
    const pillarsDebug = {};

    // Pohyb - včerejší HRV → včerejší aktivita
    // Pravidlo: 4 kcal = 1 min HLY, tj. 1h intenzivního pohybu (~600 kcal) = 150 min = 2.5h HLY
    const pohybVal = activityTotal > 0 ? Math.min(activityCompleted / activityTotal, 1.0) : 0;
    const pohybHrsBase = (PILLAR_MAX_MIN.pohyb * pohybVal * ageCoef) / 60;
    const pohybHrsWithHrv = pohybHrsBase * yesterdayHrvMult;
    pillarsDebug.pohyb = {
      label: 'Pohyb',
      value: pohybVal,
      percent: Math.round(pohybVal * 100),
      maxMin: PILLAR_MAX_MIN.pohyb,
      hours: Math.round(pohybHrsBase * 100) / 100,
      hoursWithHrv: Math.round(pohybHrsWithHrv * 100) / 100,
      source: 'activity',
      hrvApplication: 'yesterday→yesterday',
      hrvMult: yesterdayHrvMult,
      hrvState: yesterdayHrvState,
      hrvLabel: HRV_LABELS[yesterdayHrvState],
      hrvNote: `Včerejší HRV (${yesterday}) → včerejší pohyb`,
      activity: { completed: activityCompleted, total: activityTotal, items: activityItems },
      rule: {
        description: '4 kcal = 1 min HLY',
        example: '1h intenzivního pohybu (~600 kcal) = 150 min = 2.5h HLY',
        maxMinutes: PILLAR_MAX_MIN.pohyb,
        maxHours: PILLAR_MAX_MIN.pohyb / 60,
      },
    };

    // Build habit name lookup from DB data
    const habitNameMap = {};
    for (const h of userHabitsRows) habitNameMap[h.habit_id] = h.habit_name;

    // Habit-based pillars (dynamic per user)
    for (const [pillar, habitIds] of Object.entries(pillarHabits)) {
      const habits = habitIds.map((id, idx) => {
        const weight = Math.pow(0.5, idx);
        const completed = completedHabitIds.has(id);
        return {
          id,
          name: habitNameMap[id] || `Habit #${id}`,
          weight,
          completed,
          contribution: completed ? weight : 0,
        };
      });

      const weightedSum = habits.reduce((s, h) => s + h.contribution, 0);
      const maxPossible = pillarMaxVal(habitIds.length);
      const normalizedVal = maxPossible > 0 ? weightedSum / maxPossible : 0;
      const maxMin = PILLAR_MAX_MIN[pillar] || 30;
      const hours = (maxMin * normalizedVal * ageCoef) / 60;

      const hoursWithHrv = hours * todayHrvMult;
      // Calculate base minutes per habit (before diminishing returns)
      const baseMinPerHabit = maxMin / maxPossible;
      pillarsDebug[pillar] = {
        label: pillar.charAt(0).toUpperCase() + pillar.slice(1),
        value: normalizedVal,
        percent: Math.round(normalizedVal * 100),
        maxMin,
        hours: Math.round(hours * 100) / 100,
        hoursWithHrv: Math.round(hoursWithHrv * 100) / 100,
        source: 'habits',
        hrvApplication: 'today→yesterday',
        hrvMult: todayHrvMult,
        hrvState: todayHrvState,
        hrvLabel: HRV_LABELS[todayHrvState],
        hrvNote: `Dnešní HRV (${date}) → včerejší návyky`,
        habits,
        calculation: {
          weightedSum: Math.round(weightedSum * 100) / 100,
          maxPossible: Math.round(maxPossible * 100) / 100,
          normalized: Math.round(normalizedVal * 100) / 100,
        },
        rule: {
          description: 'Diminishing returns: každý další návyk má poloviční hodnotu',
          weights: '1. návyk = 100%, 2. = 50%, 3. = 25%, 4. = 12.5%...',
          baseMinPerHabit: Math.round(baseMinPerHabit * 100) / 100,
          example: `1. návyk = ${Math.round(baseMinPerHabit)}min, 2. = ${Math.round(baseMinPerHabit * 0.5)}min`,
        },
      };
    }

    // Ensure all standard habit pillars appear in debug (even with 0 habits)
    for (const pillar of ['spanek', 'strava', 'stres', 'vztahy']) {
      if (!pillarsDebug[pillar]) {
        pillarsDebug[pillar] = {
          label: pillar.charAt(0).toUpperCase() + pillar.slice(1),
          value: 0,
          percent: 0,
          maxMin: PILLAR_MAX_MIN[pillar] || 30,
          hours: 0,
          hoursWithHrv: 0,
          source: 'habits',
          hrvMult: todayHrvMult,
          hrvState: todayHrvState,
          hrvLabel: HRV_LABELS[todayHrvState],
          hrvNote: `Dnešní HRV (${date}) → včerejší návyky`,
          habits: [],
          calculation: { weightedSum: 0, maxPossible: 0, normalized: 0 },
          rule: { description: 'Žádné návyky v této kategorii', weights: '—', baseMinPerHabit: 0, example: '—' },
        };
      }
    }

    // Monitoring - dnešní HRV → dnešní měření
    const monitoringVal = hasMeasurement ? 1.0 : 0;
    const monitoringHrsBase = (PILLAR_MAX_MIN.monitoring * monitoringVal * ageCoef) / 60;
    const monitoringHrsWithHrv = monitoringHrsBase * todayHrvMult;
    pillarsDebug.monitoring = {
      label: 'Monitoring',
      value: monitoringVal,
      percent: Math.round(monitoringVal * 100),
      maxMin: PILLAR_MAX_MIN.monitoring,
      hours: Math.round(monitoringHrsBase * 100) / 100,
      hoursWithHrv: Math.round(monitoringHrsWithHrv * 100) / 100,
      source: 'measurement',
      hrvApplication: 'today→today',
      hrvMult: todayHrvMult,
      hrvState: todayHrvState,
      hrvLabel: HRV_LABELS[todayHrvState],
      hrvNote: `Dnešní HRV (${date}) → dnešní měření`,
      hasMeasurement,
    };

    // Totals - calculate with breakdown by HRV application
    const totalHrsWithAge = Object.values(pillarsDebug).reduce((s, p) => s + p.hours, 0);
    const totalHrsRaw = ageCoef > 0 ? totalHrsWithAge / ageCoef : 0;
    const totalHrsWithHrv = Object.values(pillarsDebug).reduce((s, p) => s + p.hoursWithHrv, 0);

    // Breakdown:
    // - Pohyb: včerejší HRV → včerejší pohyb
    // - Habits + Monitoring: dnešní HRV → včerejší habits / dnešní monitoring
    const pohybHrs = pillarsDebug.pohyb?.hoursWithHrv || 0;
    const habitsHrs = ['spanek', 'strava', 'stres', 'vztahy', 'monitoring'].reduce((s, k) => s + (pillarsDebug[k]?.hoursWithHrv || 0), 0);

    // All user's habits with completion status (dynamic from DB)
    const allHabits = userHabitsRows.map(h => ({
      id: h.habit_id,
      name: h.habit_name,
      color: h.color,
      categoryId: h.category_id,
      category: h.category_name,
      completed: completedHabitIds.has(h.habit_id),
    }));

    res.json({
      date,
      allHabits,
      user: {
        age,
        funcAge,
        effectiveAge: Math.round(effectiveAge * 10) / 10,
        ageCoef: Math.round(ageCoef * 100) / 100,
      },
      pillars: pillarsDebug,
      totals: {
        rawHours: Math.round(totalHrsRaw * 100) / 100,
        withAgeHours: Math.round(totalHrsWithAge * 100) / 100,
        withHrvHours: Math.round(totalHrsWithHrv * 100) / 100,
        ageCoef: Math.round(ageCoef * 100) / 100,
        formula: `${Math.round(totalHrsRaw * 100) / 100}h × Age(${Math.round(ageCoef * 100) / 100}) + různé HRV = ${Math.round(totalHrsWithHrv * 100) / 100}h`,
        breakdown: {
          pohyb: {
            label: `Včerejší HRV (${HRV_LABELS[yesterdayHrvState]} ×${yesterdayHrvMult}) → pohyb`,
            hours: Math.round(pohybHrs * 100) / 100,
            hrvMult: yesterdayHrvMult,
            hrvState: yesterdayHrvState,
          },
          habitsAndMonitoring: {
            label: `Dnešní HRV (${HRV_LABELS[todayHrvState]} ×${todayHrvMult}) → habits + monitoring`,
            hours: Math.round(habitsHrs * 100) / 100,
            hrvMult: todayHrvMult,
            hrvState: todayHrvState,
          },
        },
      },
      hrvInfo: {
        today: {
          date,
          state: todayHrvState,
          label: HRV_LABELS[todayHrvState],
          multiplier: todayHrvMult,
          readiness: todayReadiness,
        },
        yesterday: {
          date: yesterday,
          state: yesterdayHrvState,
          label: HRV_LABELS[yesterdayHrvState],
          multiplier: yesterdayHrvMult,
          readiness: yesterdayReadiness,
        },
      },
    });
  } catch (err) {
    console.error('Error in /debug:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
