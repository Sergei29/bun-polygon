import { Router } from "express";
import healthRouter from "./health.routes";
import projectsRouter from "./projects.route";

const rootRouter = Router();

rootRouter.use("/health", healthRouter);

rootRouter.use("/projects", projectsRouter);

export default rootRouter;
