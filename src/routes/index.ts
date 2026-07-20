import { Router } from "express";

import patientRouter from "./patient.routes";
import healthRouter from "./health.routes";
import appointmentRouter from "./appointment.routes";

const rootRouter = Router();

rootRouter.use("/appointments", appointmentRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/health", healthRouter);

export default rootRouter;
