import { type CreatePatientInput } from "@/schemas/patient.schema";
import { patients } from "@/db/schema";
import { db } from "@/db";

/**
 * To reuse in create/update
 */
const patientSelectFields = {
  id: patients.id,
  firstName: patients.firstName,
  lastName: patients.lastName,
  email: patients.email,
  dateOfBirth: patients.dateOfBirth,
  createdAt: patients.createdAt,
  updatedAt: patients.updatedAt,
};

export const createNewPatient = async (input: CreatePatientInput) => {
  const { firstName, lastName, email, dateOfBirth } = input;

  const [patient] = await db
    .insert(patients)
    .values({
      firstName,
      lastName,
      email,
      dateOfBirth,
    })
    .returning(patientSelectFields);

  if (!patient) {
    throw new Error("No database entry for created patient");
  }

  return patient;
};

const repository = {
  create: createNewPatient,
};

export default repository;
