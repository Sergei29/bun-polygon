import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  port: z.number().min(3000),
  databaseUrl: z.string().min(1),
  jwtSecret: z.string().min(1),
});

export const env = envSchema.parse({
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
});
