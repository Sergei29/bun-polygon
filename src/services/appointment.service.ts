import { type CreateBookingInput } from "@/schemas/booking.schema";

import repositoryPatient from "@/repositories/patient.repository";
import repositoryBooking from "@/repositories/booking.repository";
import repositoryAppointment from "@/repositories/appointment.repository";

const createBookingService = async (input: CreateBookingInput) => {
  const { appointmentId, patientId } = input;

  const [appointmentById, patientById] = await Promise.all([
    repositoryAppointment.findById(appointmentId),
    repositoryPatient.findById(patientId),
  ]);
  if (!appointmentById) {
    throw new Error(`Appointment ${appointmentId} not found`);
  }
  if (!patientById) {
    throw new Error("Patient not found");
  }

  const existingBooking =
    await repositoryBooking.findByAppointmentId(appointmentId);
  if (existingBooking) {
    throw new Error(`Appointment ${appointmentId} already booked`);
  }

  return repositoryBooking.create({
    appointmentId,
    patientId,
  });
};

const service = {
  booking: createBookingService,
};

export default service;
