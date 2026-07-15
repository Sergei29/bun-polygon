import { type RequestHandler } from "express";
import { type createPatientInput } from "@/schemas/patient.schema";
import service from "@/services/patient.service";

const createPatientController: RequestHandler = async (req, res) => {
  const createPatientInput = req.body as createPatientInput;
  const result = await service.create(createPatientInput);

  if (result.data) {
    return res.status(201).json({
      data: result.data,
    });
  }

  return res.status(500).json({
    error: "Server error, failed to create new patient",
  });
};

const controller = {
  create: createPatientController,
};

export default controller;
