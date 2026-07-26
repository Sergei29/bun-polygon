import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.url(),
  NODE_ENV: z.string().min(1),
});

export const env = envSchema.parse(process.env);
