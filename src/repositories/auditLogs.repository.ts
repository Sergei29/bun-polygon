import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export const createAuditLog = async (input: {
  tenantId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) => {
  const result = await db.insert(auditLogs).values(input).returning();

  return result[0] || null;
};
