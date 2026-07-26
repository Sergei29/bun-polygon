import { type RequestHandler } from "express";
import { ROLE_HIERARCHY } from "@/config/roles";
import { type JwtPayload } from "@/types";

export const requireRole = (...roles: JwtPayload["role"][]): RequestHandler => {
  return (req, res, next) => {
    const userLevel = req.user?.role ? ROLE_HIERARCHY[req.user.role] : 0;
    const requiredLevel = Math.min(
      ...roles.map((r) => ROLE_HIERARCHY[r] ?? 999),
    );

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.user?.role,
      });
    }

    next();
  };
};
