import type { RequestHandler } from "express";
import type { CreateBookingInput } from "@/schemas/booking.schema";
import type { BookingCreateResponse } from "@/types";

import service from "@/services/appointment.service";

const createBookingController: RequestHandler<
  { id: string },
  BookingCreateResponse,
  CreateBookingInput
> = async (req, res) => {
  const newBooking = await service.booking(req.body);

  return res.status(201).json(newBooking);
};

const controller = {
  book: createBookingController,
};

export default controller;
