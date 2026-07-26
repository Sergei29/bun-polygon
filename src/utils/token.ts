import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { type JwtPayload } from "@/types";

/**
 * JWT Design for Multi-Tenancy:
 * - Both tenantId and role go into the JWT payload.
 * - Everything downstream reads from these two fields
 * Generate a token (used for testing and your auth endpoint):
 */
export const generateToken = ({ userId, tenantId, email, role }: JwtPayload) =>
  jwt.sign({ userId, tenantId, email, role }, env.JWT_SECRET, {
    expiresIn: "24h",
  });

export const verify = (token: string) => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

  return {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    email: decoded.email,
    role: decoded.role,
  };
};
