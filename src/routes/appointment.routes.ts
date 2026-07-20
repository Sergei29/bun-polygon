import { Router } from "express";

import { bookAppointmentValidation } from "@/middleware/appointment.middleware";
import controller from "@/controllers/appointment.controller";

const appointmentRouter = Router();

appointmentRouter.post("/:id/book", bookAppointmentValidation, controller.book);

export default appointmentRouter;
