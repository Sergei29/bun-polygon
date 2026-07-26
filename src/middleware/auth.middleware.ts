import { type RequestHandler } from "express";
import { verify } from "@/utils/token";

export const authMiddleware: RequestHandler = async (req, res, next) => {
  /** `tenantId` always comes from the verified token — never req.body or req.params */
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { userId, tenantId, email, role } = verify(token);
  req.user = {
    userId,
    tenantId,
    email,
    role,
  };

  return next();
};
