import { type createPatientInput } from "@/schemas/patient.schema";
import { patients } from "@/db/schema";
import { db } from "@/db";

export const createNewPatient = async (input: createPatientInput) => {
  const { firstName, lastName, email, dateOfBirth } = input;

  const rows = await db
    .insert(patients)
    .values({
      firstName,
      lastName,
      email,
      dateOfBirth,
    })
    .returning();

  const result = rows[0];

  if (!result) {
    throw new Error("No database entry for created patient");
  }

  return result;
};

const repository = {
  create: createNewPatient,
};

export default repository;
