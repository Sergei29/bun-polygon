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
