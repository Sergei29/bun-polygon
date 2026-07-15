export type AwaitedResult<D> =
  | {
      data: D;
      error: null;
    }
  | { data: null; error: string };

export type PatientDb = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  createdAt: Date;
  updatedAt: Date;
};
