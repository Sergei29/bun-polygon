import { type createPatientInput } from "@/schemas/patient.schema";
import type { PatientDb, AwaitedResult } from "@/types";
import { logger } from "@/utils/logger";
import repository from "@/repositories/patient.repository";

const CREATE_ERROR = "Failed to create database entry for new patient";

export const createPatientService = async (
  input: createPatientInput,
): Promise<AwaitedResult<PatientDb>> => {
  try {
    const data = await repository.create(input);
    return { data, error: null };
  } catch (error) {
    logger.error(error, CREATE_ERROR);

    return {
      data: null,
      error: error instanceof Error ? error.message : CREATE_ERROR,
    };
  }
};

const service = {
  create: createPatientService,
};

export default service;
