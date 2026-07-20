import { Router } from "express";

import { createPatientValidation } from "@/middleware/patient.middleware";
import controller from "@/controllers/patient.controller";

const patientRouter = Router();

patientRouter.post("/", createPatientValidation, controller.create);

export default patientRouter;
