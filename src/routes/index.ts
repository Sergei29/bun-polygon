import { Router } from "express";
import healthRouter from "./health.routes";

const rootRouter = Router();

rootRouter.use("/health", healthRouter);

export default rootRouter;
