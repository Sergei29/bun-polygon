import { type RequestHandler } from "express";
import rateLimitExpress from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { redisClient } from "@/db/redis";
import { PLAN_LIMITS } from "@/config/rateLimits";

const createTenantRateLimiter = (plan: keyof typeof PLAN_LIMITS = "free") => {
  const limits = PLAN_LIMITS[plan];

  return rateLimitExpress({
    windowMs: limits.windowMs,
    limit: limits.max,
    // Key = tenant_id from verified JWT — NOT the IP address
    keyGenerator: (req) => `tenant:${req.user?.tenantId || req.ip}`,
    store: new RedisStore({
      sendCommand: (...args) =>
        redisClient.call(
          ...(args as [string, ...string[]]),
        ) as Promise<RedisReply>,
    }),
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil(limits.windowMs / 1000),
      });
    },
  });
};

// Default limiter for all API routes
const defaultLimiter = createTenantRateLimiter("free");

export { defaultLimiter, createTenantRateLimiter };
