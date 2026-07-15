import { type RequestHandler } from "express";
import { type CreatePatientInput } from "@/schemas/patient.schema";
import type { PatientResponse } from "@/types";
import service from "@/services/patient.service";

const createPatientController: RequestHandler<
  Record<string, never>,
  PatientResponse,
  CreatePatientInput
> = async (req, res) => {
  const createPatientInput = req.body;
  const result = await service.create(createPatientInput);

  return res.status(201).json(result);
};

const controller = {
  create: createPatientController,
};

export default controller;
