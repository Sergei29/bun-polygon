export type PatientResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type BookingCreateResponse = {
  appointmentId: string;
  patientId: string;
  id: string;
  createdAt: Date;
};
