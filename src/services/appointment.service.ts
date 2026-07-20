import { type CreateBookingInput } from "@/schemas/booking.schema";

import patientRepository from "@/repositories/patient.repository";
import bookingRepository from "@/repositories/booking.repository";
import appointmentRepository from "@/repositories/appointment.repository";

const createBookingService = async (input: CreateBookingInput) => {
  const { appointmentId, patientId } = input;
  const now = new Date();

  const [appointmentById, patientById] = await Promise.all([
    appointmentRepository.findById(appointmentId),
    patientRepository.findById(patientId),
  ]);
  if (!appointmentById) {
    throw new Error("Appointment not found");
  }
  if (appointmentById.startsAt < now) {
    throw new Error("Appointment is in the past");
  }
  if (!patientById) {
    throw new Error("Patient not found");
  }

  const existingBooking =
    await bookingRepository.findByAppointmentId(appointmentId);
  if (existingBooking) {
    throw new Error("Already booked");
  }

  return bookingRepository.create({
    appointmentId,
    patientId,
  });
};

const service = {
  booking: createBookingService,
};

export default service;
