export const PLAN_LIMITS = {
  free: { max: 100, windowMs: 15 * 60 * 1000 }, // 100 req / 15 min
  pro: { max: 500, windowMs: 15 * 60 * 1000 }, // 500 req / 15 min
  enterprise: { max: 2000, windowMs: 15 * 60 * 1000 }, // 2000 req / 15 min
} as const;
