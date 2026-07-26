import { type ErrorRequestHandler } from "express";
import { logger } from "@/utils/logger";

export const topLevelErrorhandler: ErrorRequestHandler = async (
  err,
  req,
  res,
  next,
) => {
  logger.error(err.stack);

  res.status(500).json({ error: "Internal server error" });
};
