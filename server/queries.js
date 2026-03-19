// SQL queries for HLY data retrieval (batch-optimized)
// All date outputs use DATE_FORMAT to return 'YYYY-MM-DD' strings (avoids timezone issues)

export const USER_PROFILE = `
  SELECT birthdate FROM app_users WHERE id = ?
`;

// Habit completions in date range — presence of row = completed
export const HABIT_COMPLETIONS = `
  SELECT habit_id, DATE_FORMAT(date, '%Y-%m-%d') as day
  FROM user_habit_completion
  WHERE user_id = ? AND DATE(date) BETWEEN ? AND ?
  AND habit_id IN (8, 9, 3, 265, 325, 851, 20)
`;

// HRV readiness values in date range (JOIN measurement_store + relative_values)
export const READINESS_VALUES = `
  SELECT DATE_FORMAT(ms.date, '%Y-%m-%d') as day, msrv.myAgeReadiness as readiness, msrv.CA5 as funcAge
  FROM measurement_store ms
  JOIN measurement_store_relative_values msrv ON msrv.measurementId = ms.id
  WHERE ms.usersId = ? AND DATE(ms.date) BETWEEN ? AND ?
  ORDER BY ms.date
`;

// Check measurement existence per day
export const MEASUREMENT_EXISTS = `
  SELECT DISTINCT DATE_FORMAT(date, '%Y-%m-%d') as day
  FROM measurement_store
  WHERE usersId = ? AND DATE(date) BETWEEN ? AND ?
`;

// User's weekly goals per habit
export const HABIT_WEEKLY_GOALS = `
  SELECT habit_id, users_weekly_goal
  FROM habit_favorite
  WHERE user_id = ? AND habit_id IN (8, 9, 3, 265, 325, 851, 20)
`;

// Activity plan items in date range
export const ACTIVITY_PLAN_ITEMS = `
  SELECT
    api.completed,
    DATE_FORMAT(api.date, '%Y-%m-%d') as day
  FROM app_users_physical_activity_plan_items api
  JOIN app_users_physical_activity_plans ap ON ap.id = api.planId
  WHERE ap.usersId = ? AND DATE(api.date) BETWEEN ? AND ?
`;
