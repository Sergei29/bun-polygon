import { logger } from "@/utils/logger";
import { app } from "./app";
import { env } from "@/config/env";

app.listen(env.PORT, () => {
  logger.info(`🚀 Bun/express server at http://localhost:${env.PORT}`);
});
