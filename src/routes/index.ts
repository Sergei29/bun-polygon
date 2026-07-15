import { Router } from "express";

import patientRouter from "./patient.routes";
import healthRouter from "./health.routes";

const rootRouter = Router();

rootRouter.use("/patients", patientRouter);
rootRouter.use("/health", healthRouter);

export default rootRouter;
