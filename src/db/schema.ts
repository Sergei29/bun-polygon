import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const doctors = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).$onUpdate(() => new Date()),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("doctor_id_starts_at_unique").on(table.doctorId, table.startsAt),
  ],
);

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .unique()
    .references(() => appointments.id, { onDelete: "restrict" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  booking: one(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  appointment: one(appointments, {
    fields: [bookings.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [bookings.patientId],
    references: [patients.id],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  bookings: many(bookings),
}));
