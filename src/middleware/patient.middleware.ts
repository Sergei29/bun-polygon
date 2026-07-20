import type { RequestHandler } from "express";

import { createPatientSchema } from "@/schemas/patient.schema";

export const createPatientValidation: RequestHandler = (req, res, next) => {
  const validation = createPatientSchema.safeParse(req.body);

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
