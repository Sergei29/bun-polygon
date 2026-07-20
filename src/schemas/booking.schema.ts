import { z } from "zod";

export const createBookingSchema = z.object({
  appointmentId: z.string().trim().min(1),
  patientId: z.string().trim().min(1),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
