import type { RequestHandler } from "express";

import { createBookingSchema } from "@/schemas/booking.schema";

export const bookAppointmentValidation: RequestHandler<{ id: string }> = (
  req,
  res,
  next,
) => {
  const validation = createBookingSchema.safeParse({
    patientId: req.body.patientId,
    appointmentId: req.params.id,
  });

  if (validation.success) {
    req.body = validation.data;
    return next();
  }

  const fieldErrors = validation.error.issues
    .flatMap((current) => {
      return current.path + ": " + current.message;
    })
    .join(", ");

  return res.status(400).json({
    error: "Incorrect information provided: " + fieldErrors,
  });
};
