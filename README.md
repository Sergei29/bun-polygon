# bun-polygon

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## About the App

A multi-tenant Express REST API that enforces:

1. Tenant isolation: every database query scopes to the tenant_id from the verified JWT. The client can't influence which tenant the query runs against.
2. RBAC: four roles, each with a numeric level (SuperAdmin is highest, Viewer lowest). Middleware checks the level before the handler runs.
3. Audit logging: any write or sensitive read appends a row to the audit table. The app can't modify those rows afterward. The database enforces this directly. If a bug in the app tries to UPDATE an audit row, the database refuses it. Application-level enforcement alone can't give you that guarantee.
4. Per-tenant rate limiting: request counts in Redis, keyed to the tenant. I've seen IP-based limiting break an enterprise rollout when fifty users came through a single corporate proxy.
5. Tenant isolation tests: a dedicated test file that proves cross-tenant data can't leak. Wire it into CI and it catches broken isolation before it ships.

## Folder structure

The request flow should look like

```sh
HTTP Request

↓

Route

↓

Controller

↓

Service

↓

Repository

↓

Database
```

## Overview

This branch uses a shared database with row-level isolation: a `tenant_id` for every table.

To mention that two other approaches exist: schema-per-tenant and database-per-tenant.

- `schema-per-tenant` overhead on engineering time on migration tooling than on the actual product
- `database-per-tenant` gives stronger guarantees but a connection pool that balloons with every new customer signup: pools growing up casing `pgbouncer` or other conn management overhead eventually running out of resources, and additionally the costs.
- `row-per-tenant` shared database and tables with row-level isolation comes as easiest in terms of maintenance, though it has it's own tradeoffs in terms of security and how to assure the necessary segregation is achieved.
- row-level isolation `tenant_id` - that can't be optional: `tenant_id` must always come from the verified JWT at authentication level. Not from the request body, not from the URL. Users control what they put in both of those. They don't control what gets signed into a JWT on your server.

## Architecture

```md
HTTP Request
│
▼
┌─────────────────────────────────────────┐
│ Express Middleware Stack │
│ │
│ 1. Rate Limiter (per tenant_id) │
│ 2. Auth Middleware (verify JWT) │
│ └─► Extracts: userId, tenantId, │
│ role, permissions │
│ 3. RBAC Middleware (check role) │
└──────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ Route Handler │
│ │
│ 1. Call Repository (tenant-safe query) │
│ 2. Call Audit Service (fire & forget) │
│ 3. Return response │
└──────────────┬──────────────────────────┘
│
┌─────────┴──────────┐
▼ ▼
┌─────────┐ ┌────────────┐
│ Projects│ │ Audit Logs │
│ Table │ │ Table │
│(+tenant)│ │(append only│
└─────────┘ └────────────┘
```

1. Rate limiting,
2. auth
3. Then RBAC

All run before any handler sees the request. Writes pass through the audit service. The repository takes `tenantId` from `req.user` and the handler never touches tenant scoping directly, so there's no path around it.

## Database design

- will be implemented by use of ORM(drizzle or prisma):

```sql
-- Tenants table
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  plan        VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'Member', -- 'SuperAdmin','TenantAdmin','Member','Viewer'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- Projects table (example resource — replace with your domain entity)
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- Audit log table (append-only — never UPDATE or DELETE rows here)
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID NOT NULL,
  user_email  TEXT NOT NULL,
  user_role   TEXT NOT NULL,        -- role at time of action
  action      TEXT NOT NULL,        -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
  resource    TEXT NOT NULL,        -- table name
  resource_id TEXT,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Protect audit log at database level
-- Use a DO block so this runs safely in Docker where app_user is the superuser
DO $$
BEGIN
  IF current_user <> 'app_user' THEN
    REVOKE DELETE, UPDATE ON audit_logs FROM app_user;
  END IF;
END $$;
```

## Row-Level Security on `projects`

Tenant isolation above is enforced at the app layer: every repository query filters `WHERE tenant_id = ...`. That's one place a bug can slip through — a missing `.where()` in a new query and cross-tenant data leaks. Postgres Row-Level Security (RLS) adds a second, independent backstop directly on the `projects` table: even if the app forgot to filter, the database itself refuses to return or touch a row that doesn't belong to the current tenant.

RLS only means something if the connecting role isn't a superuser or the table owner — both bypass RLS unconditionally, policies or not. Since `DATABASE_URL` originally pointed at the `postgres` superuser created by the Docker image, the first step was creating a dedicated, unprivileged `app_user` role (`drizzle/0002_create_app_user_role.sql`) with only the grants the app needs, and pointing the app's connection at it instead.

In Drizzle, this is expressed directly in `src/db/schema.ts`:

- `pgRole("app_user").existing()` declares the role for reference in policies, without Drizzle trying to manage its creation (that's handled by the hand-written migration above).
- `.enableRLS()` on the `projects` table turns RLS on.
- `pgPolicy(...)` entries in the table's config define one policy per command (`select`, `insert`, `update`, `delete`), each checking `tenant_id = current_setting('app.tenant_id', true)::uuid` — i.e., the row's tenant must match a Postgres session variable, not anything the request itself supplies.

That `app.tenant_id` session variable is the missing piece: Postgres has no idea what "the current tenant" means on its own. `src/db/tenantContext.ts` sets it via `set_config('app.tenant_id', tenantId, true)` inside a `db.transaction(...)`, with `is_local = true` so it only applies for that one transaction — required because the connection pool reuses connections across requests from different tenants, and a session-wide (non-local) setting would leak between them. Every `projects.repository.ts` function now runs through this `withTenantContext(tenantId, ...)` wrapper, sourcing `tenantId` from the same verified-JWT value the app-level filter already uses.

One non-obvious wrinkle: the `select` policy isn't just about reads. Postgres checks `INSERT ... RETURNING` and `UPDATE ... RETURNING` output against the table's `SELECT` policy too, and — rather than silently dropping rows the caller can't see — raises `"new row violates row-level security policy"` if none applies. Since every write in this repository uses `.returning()`, a write-only policy set would have broken every write, not just reads. The tradeoff: this closes off `SuperAdmin`'s documented cross-tenant reads under the current single-role RLS setup, since the policy can't distinguish RBAC roles, only the Postgres role and the session variable. Nothing in the app implements that cross-tenant path today, so it's a deferred limitation, not a regression — it would need its own mechanism (a separate role, or a query path that bypasses RLS) if built later.

## JWT Design for Multi-Tenancy

- Both `tenantId` and `role` go into the JWT payload.
- Everything downstream reads from these two fields.
- Get them wrong, and nothing behaves correctly.

```json
// Example JWT payload
{
  "userId": "usr_abc123",
  "tenantId": "ten_xyz789",
  "email": "alice@google.com",
  "role": "TenantAdmin",
  "iat": 1720000000,
  "exp": 1720086400
}
```

#### RBAC, The roles in order of privilege:

1. SuperAdmin: cross-tenant access for your internal team only
2. TenantAdmin: full access within their tenant
3. Member: read and write within their tenant
4. Viewer: read-only within their tenant

## Per-Tenant Rate Limiting

Motivation why per tenant: IP-based rate limiting breaks down in SaaS. A corporate customer might route hundreds of users through a single NAT gateway, sharing one IP address. One heavy tenant throttles everyone else on that IP address.

Scope limits to `tenant_id` instead
