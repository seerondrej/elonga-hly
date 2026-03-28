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

// All user's favorite habits with names and categories (for debug display)
export const USER_HABITS_WITH_NAMES = `
  SELECT hf.habit_id, hf.color,
    COALESCE(htcs.habit_name, hten.habit_name, CONCAT('Habit #', hf.habit_id)) as habit_name,
    h.category_id,
    hct.name as category_name
  FROM habit_favorite hf
  LEFT JOIN habit h ON h.id = hf.habit_id
  LEFT JOIN habit_translation htcs ON htcs.habit_id = hf.habit_id AND htcs.language = 'cs'
  LEFT JOIN habit_translation hten ON hten.habit_id = hf.habit_id AND hten.language = 'en'
  LEFT JOIN habit_category_translation hct ON hct.category_id = h.category_id AND hct.language = 'cs'
  WHERE hf.user_id = ?
  ORDER BY h.category_id, hf.created_at
`;

// All habit completions in date range (no filter on habit_id)
export const ALL_HABIT_COMPLETIONS = `
  SELECT habit_id, DATE_FORMAT(date, '%Y-%m-%d') as day
  FROM user_habit_completion
  WHERE user_id = ? AND DATE(date) BETWEEN ? AND ?
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
    api.id,
    api.completed,
    api.energyOutput,
    api.recommendedIntensity,
    api.recommendedMinutesDuration,
    api.recommendedStepsCount,
    adt.description as activityName,
    DATE_FORMAT(api.date, '%Y-%m-%d') as day
  FROM app_users_physical_activity_plan_items api
  JOIN app_users_physical_activity_plans ap ON ap.id = api.planId
  LEFT JOIN app_users_activity_detailed_type adt ON adt.id = api.typeId
  WHERE ap.usersId = ? AND DATE(api.date) BETWEEN ? AND ?
`;
