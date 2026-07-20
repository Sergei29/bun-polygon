import { db } from ".";
import { doctors, patients, appointments } from "./schema";

const mockDoctors = [
  { firstName: "John", lastName: "Wilkinson" },
  { firstName: "Margaret", lastName: "Pierce" },
  { firstName: "Alan", lastName: "Dice" },
];

const mockPatients = [
  {
    firstName: "Jerry",
    lastName: "Cane",
    email: "jerry.cane@gmail.com",
    dateOfBirth: "2006-07-18",
  },
  {
    firstName: "Robert",
    lastName: "Pumpkins",
    email: "r.pump@gmail.com",
    dateOfBirth: "1996-01-14",
  },
  {
    firstName: "Anna",
    lastName: "Willard",
    email: "anna.w@yahoo.com",
    dateOfBirth: "1990-01-10",
  },
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@hotmail.co.uk",
    dateOfBirth: "1980-09-03",
  },
  {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.d@gmail.com",
    dateOfBirth: "1985-12-12",
  },
  {
    firstName: "Lucy",
    lastName: "Barracuda",
    email: "lucy.barracuda@hotmail.co.uk",
    dateOfBirth: "1976-12-24",
  },
];

const schedule = {
  1: [
    [9, 0, 0],
    [9, 30, 0],
  ],
  2: [
    [9, 30, 0],
    [10, 0, 0],
  ],
  3: [
    [10, 0, 0],
    [10, 30, 0],
  ],
  4: [
    [10, 30, 0],
    [11, 0, 0],
  ],

  5: [
    [13, 0, 0],
    [13, 30, 0],
  ],
  6: [
    [13, 30, 0],
    [14, 0, 0],
  ],
  7: [
    [14, 0, 0],
    [14, 30, 0],
  ],
  8: [
    [14, 30, 0],
    [15, 0, 0],
  ],
};

const getNextWorkingDay = (today = new Date()) => {
  const next = new Date(today);
  next.setDate(next.getDate() + 1);

  // 0 = Sunday, 6 = Saturday
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

const getAppointmentsDatetime = (order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
  const [start, end] = schedule[order] as [
    [number, number, number],
    [number, number, number],
  ];
  const startsAt = getNextWorkingDay();
  const endsAt = getNextWorkingDay();
  startsAt.setHours(...start);
  endsAt.setHours(...end);

  return { startsAt, endsAt };
};

const appointmentOrders = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const seedDoctors = () =>
  Promise.all(
    mockDoctors.map(async ({ firstName, lastName }) => {
      const [doctor] = await db
        .insert(doctors)
        .values({ firstName, lastName })
        .returning();

      if (!doctor) {
        throw new Error("No doctor inserted");
      }

      return doctor;
    }),
  );

const seedPatients = () =>
  Promise.all(
    mockPatients.map(async ({ firstName, lastName, email, dateOfBirth }) => {
      const [patient] = await db
        .insert(patients)
        .values({ firstName, lastName, email, dateOfBirth })
        .returning();

      if (!patient) {
        throw new Error("No patient inserted");
      }

      return patient;
    }),
  );

const getDoctorsList = () => db.select().from(doctors);
const getPatientsList = () => db.select().from(patients);

async function main() {
  /** initial seed for the first time: doctors & patients */
  // const [doctorsList, patientsList] = await Promise.all([
  //   seedDoctors(),
  //   seedPatients(),
  // ]);

  const [doctorsList, patientsList] = await Promise.all([
    getDoctorsList(),
    getPatientsList(),
  ]);

  const doctorsListWithTimings: {
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
  }[] = [];

  doctorsList.forEach((doctor) => {
    appointmentOrders.forEach((order) => {
      const { startsAt, endsAt } = getAppointmentsDatetime(order);
      doctorsListWithTimings.push({
        doctorId: doctor.id,
        startsAt,
        endsAt,
      });
    });
  });

  const appointmentsCreated = await Promise.all(
    doctorsListWithTimings.map(async ({ doctorId, startsAt, endsAt }) => {
      const [newAppointment] = await db
        .insert(appointments)
        .values({
          doctorId,
          startsAt,
          endsAt,
        })
        .returning();

      if (!newAppointment) {
        throw new Error("Failed to add appointment");
      }

      return newAppointment;
    }),
  );

  console.log(`✅ - ${appointmentsCreated.length} Appointments`);

  process.exit(0);
}

main().catch(console.error);
