import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const redisClient = new Redis(env.REDIS_URL);

redisClient.on("error", (err) => logger.error(`Redis error: ${err.message}`));

export { redisClient };
