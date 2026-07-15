import { z } from "zod";

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  dateOfBirth: z.iso.date().refine((value) => {
    const date = new Date(value);

    return date <= new Date();
  }, "Date of birth cannot be in the future"),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
