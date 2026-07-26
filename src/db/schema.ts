import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  inet,
  unique,
  index,
  pgPolicy,
  pgRole,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Created outside Drizzle's migration diffing, in drizzle/0002_create_app_user_role.sql —
// `.existing()` tells drizzle-kit not to try to generate CREATE ROLE for it.
export const appUser = pgRole("app_user").existing();

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // 'free', 'pro', 'enterprise'
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("Member"), // 'SuperAdmin','TenantAdmin','Member','Viewer'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique().on(table.tenantId, table.email),
    index("idx_users_tenant").on(table.tenantId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_projects_tenant").on(table.tenantId),
    // DB-level backstop on top of the app-level tenant_id filtering in projects.repository.ts.
    // Requires `app.tenant_id` to be set via set_config() in the same transaction (see
    // src/db/tenantContext.ts); with it unset, current_setting(..., true) is NULL and every
    // query/write is rejected (or, for SELECT, simply sees zero rows).
    //
    // SELECT is included alongside the writes — not just as its own concern, but because
    // INSERT/UPDATE ... RETURNING implicitly re-checks the affected row against the SELECT
    // policy, and errors ("new row violates row-level security policy") if none applies. A
    // write-only policy set breaks every write in this codebase, since all of them use
    // .returning(). This forecloses SuperAdmin's documented cross-tenant reads under RLS —
    // nothing in the app implements that path today, so treat it as a deferred limitation:
    // a future cross-tenant query would need its own DB role/bypass, not this policy.
    pgPolicy("tenant_isolation_projects_read", {
      for: "select",
      to: appUser,
      using: sql`${table.tenantId} = current_setting('app.tenant_id', true)::uuid`,
    }),
    pgPolicy("tenant_isolation_projects_write", {
      for: "insert",
      to: appUser,
      withCheck: sql`${table.tenantId} = current_setting('app.tenant_id', true)::uuid`,
    }),
    pgPolicy("tenant_isolation_projects_update", {
      for: "update",
      to: appUser,
      using: sql`${table.tenantId} = current_setting('app.tenant_id', true)::uuid`,
      withCheck: sql`${table.tenantId} = current_setting('app.tenant_id', true)::uuid`,
    }),
    pgPolicy("tenant_isolation_projects_delete", {
      for: "delete",
      to: appUser,
      using: sql`${table.tenantId} = current_setting('app.tenant_id', true)::uuid`,
    }),
  ],
).enableRLS();

// Append-only — never UPDATE or DELETE rows here (enforced in DB via migration grant revocation).
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    userEmail: text("user_email").notNull(),
    userRole: text("user_role").notNull(), // role at time of action
    action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    resource: text("resource").notNull(), // table name
    resourceId: text("resource_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_audit_tenant").on(table.tenantId),
    index("idx_audit_created").on(table.createdAt.desc()),
  ],
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  projects: many(projects),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
}));
