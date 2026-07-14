import { app } from "./app";
import { env } from "@/config/env";

app.listen(env.port, () => {
  console.log(`🚀 Bun/express server at http://localhost:${env.port}`);
});
