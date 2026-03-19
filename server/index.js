import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import * as Q from './queries.js';
import { computePillars, getHrvState, buildHistory } from './pillars.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

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
    ] = await Promise.all([
      pool.query(Q.HABIT_COMPLETIONS, [userId, today, today]),
      pool.query(Q.READINESS_VALUES, [userId, today, today]),
      pool.query(Q.MEASUREMENT_EXISTS, [userId, today, today]),
      pool.query(Q.ACTIVITY_PLAN_ITEMS, [userId, today, today]),
      pool.query(Q.USER_PROFILE, [userId]),
    ]);

    const todayHabitIds = new Set(habitRows.map(r => r.habit_id));
    const hasMeasurement = measurementRows.length > 0;
    const activity = { completed: 0, total: 0 };
    for (const row of activityRows) {
      activity.total++;
      if (row.completed) activity.completed++;
    }

    const { pillars, habitCounts } = computePillars(todayHabitIds, hasMeasurement, activity);
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

    res.json({ pillars, habitCounts, hrvState, readiness, age, funcAge });
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
    ] = await Promise.all([
      pool.query(Q.HABIT_COMPLETIONS, [userId, startStr, endStr]),
      pool.query(Q.READINESS_VALUES, [userId, startStr, endStr]),
      pool.query(Q.MEASUREMENT_EXISTS, [userId, startStr, endStr]),
      pool.query(Q.ACTIVITY_PLAN_ITEMS, [userId, startStr, endStr]),
    ]);

    const history = buildHistory(habitRows, readinessRows, measurementRows, activityRows, startStr, endStr);

    res.json({ history });
  } catch (err) {
    console.error('Error in /history:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
