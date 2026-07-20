import { type CreatePatientInput } from "@/schemas/patient.schema";

import repository from "@/repositories/patient.repository";

export const createPatientService = async (input: CreatePatientInput) => {
  return repository.create(input);
};

const service = {
  create: createPatientService,
};

export default service;
