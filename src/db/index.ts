import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/config/env";

const client = postgres(env.databaseUrl);

export const db = drizzle(client);
