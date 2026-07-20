import { eq } from "drizzle-orm";

import type { CreateBookingInput } from "@/schemas/booking.schema";

import { db } from "@/db";
import { bookings } from "@/db/schema";

const findById = async (bookingId: string) => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  return booking;
};

export const findByAppointmentId = async (appointmentId: string) => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.appointmentId, appointmentId));

  return booking;
};

export const create = async ({
  appointmentId,
  patientId,
}: CreateBookingInput) => {
  const [booking] = await db
    .insert(bookings)
    .values({
      appointmentId,
      patientId,
    })
    .returning();

  if (!booking) {
    throw new Error("No database entry for created booking");
  }

  return booking;
};

const repository = { findById, findByAppointmentId, create };

export default repository;
