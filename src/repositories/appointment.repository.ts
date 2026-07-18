import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appointments } from "@/db/schema";

const findById = async (appointmentId: string) => {
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  return appointment;
};

const repository = { findById };

export default repository;
