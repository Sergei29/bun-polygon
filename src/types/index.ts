import { ROLE_HIERARCHY } from "@/config/roles";

export type Role = keyof typeof ROLE_HIERARCHY;
export type Action = "CREATE" | "UPDATE" | "DELETE" | "VIEW";
export type Resource = "tenants" | "users";

export type JwtPayload = {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
};
