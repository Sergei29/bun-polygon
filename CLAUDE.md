# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this repo

A Bun-based TypeScript playground ("polygon") for experimentation, algorithms, and interview prep, organized by topic on separate branches (`algorithms-ds`, `interview-prep-udemy`, `design-patterns`, etc.).

This branch (`multi-tenant-app-example`) is a concrete project: a multi-tenant Express + Drizzle ORM REST API demonstrating four SaaS security patterns — tenant isolation, RBAC, tamper-proof audit logging, and per-tenant rate limiting. Backed by Postgres and Redis. The real entry point is `src/server.ts` (there is no root `index.ts` despite `package.json`'s `module` field naming one).

## Commands

```bash
bun install             # install dependencies
bun run dev              # run src/server.ts (entry point; no file watching configured)
bun test                  # run all tests (bun:test)
bun run format            # format with Prettier
bun run check:format       # check formatting without writing
bun run check:types        # tsc --noEmit
```

Infra (Postgres on :5432, Redis on :6379 — `docker compose up -d`):

```bash
bun run db:generate    # generate a migration from schema changes
bun run db:migrate      # apply migrations
bun run db:push          # push schema directly (no migration file)
bun run db:studio        # open Drizzle Studio
bun run db:check          # sanity-check migrations
bun run db:seed           # run src/db/seed.ts
```

## Environment

`src/config/env.ts` loads `.env` and validates it with Zod at startup (`envSchema.parse`). Required vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (min 32 chars), `NODE_ENV`; `PORT` defaults to 3000. Adding a new env var means adding it to `envSchema`, not just `.env`.

## Architecture: the four pillars

The README describes the intended design in depth — read it for rationale (why row-level isolation over schema/db-per-tenant, why per-tenant over per-IP rate limiting, etc). The load-bearing rules:

1. **Tenant isolation** — every table with tenant data carries `tenant_id`. `tenantId` is read once, in `auth.middleware.ts`, from the verified JWT (`req.user.tenantId`) and threaded through service → repository. It never comes from `req.body` or `req.params`. Every repository query in `src/repositories/` filters `where(eq(table.tenantId, tenantId))` (see `projects.repository.ts`) — new repositories must follow this even for lookups by id.
2. **RBAC** — four roles with numeric levels in `src/config/roles.ts` (`SuperAdmin` 4 > `TenantAdmin` 3 > `Member` 2 > `Viewer` 1). `requireRole(...)` in `src/middleware/rbac.middleware.ts` computes the *minimum* required level across the roles passed in and compares against `req.user.role`'s level, rejecting with 403 if too low. Applied per-route after `authMiddleware`.
3. **Audit logging** — writes and sensitive reads insert a row into `audit_logs` via `createAuditLog` (`src/repositories/auditLogs.repository.ts`), called fire-and-forget from the service layer (not awaited — see `projects.service.ts`). The README and a comment in `schema.ts` state the intent that immutability be enforced in Postgres (revoking `UPDATE`/`DELETE` on `audit_logs` from the app's DB role) rather than in app code — but as of the current migrations (`drizzle/0000_lethal_mongoose.sql`, `0001_fearless_white_tiger.sql`) no such `REVOKE` exists yet. Don't assume that protection is already in place.
4. **Per-tenant rate limiting** — `src/middleware/rateLimiter.middleware.ts` builds an `express-rate-limit` limiter backed by `RedisStore`, keyed by `` `tenant:${req.user?.tenantId}` `` (falls back to IP only when unauthenticated), not by IP. Limits are plan-based (`free`/`pro`/`enterprise`) in `src/config/rateLimits.ts`. `createTenantRateLimiter(plan)` builds a limiter for a given plan; `defaultLimiter` is the `free`-tier instance currently wired into routes.

## Request flow and layering

```
Route → Middleware (auth → rate limit → RBAC) → Service → Repository → Drizzle → Postgres
```

- **`src/routes/`** — Express routers per resource, wired in `src/routes/index.ts`, mounted in `src/app.ts`. Middleware order matters: `authMiddleware` is registered before `defaultLimiter` (see `projects.route.ts`), because the rate limiter's `keyGenerator` reads `req.user?.tenantId`, which only exists once auth has run — despite the README's diagram showing rate-limiting first. RBAC (`requireRole`) is applied last, per-route.
- **`src/middleware/`** — cross-cutting concerns only (auth, RBAC, rate limiting). There is no per-resource Zod-validation middleware yet.
- **`src/services/`** — currently the de facto controller layer: exports `RequestHandler`s directly (e.g. `getProjectsService`), doing input extraction, calling repositories, firing audit logs, and shaping the HTTP response. `src/controllers/` and `src/schemas/` exist as empty directories — if you introduce Zod validation or split controllers out from services, that's where they go, but don't assume they're already wired into the request path.
- **`src/repositories/`** — the only layer that imports `src/db`. Owns Drizzle queries; every query takes and filters on `tenantId`.
- **`src/db/`** — `schema.ts` defines Drizzle pgTables + relations; `index.ts` creates the Drizzle/postgres client; `redis.ts` creates the ioredis client used by the rate limiter.
- **`src/config/`** — static config tables: `roles.ts` (RBAC hierarchy), `rateLimits.ts` (plan → limit mapping).
- **`src/types/`** — `JwtPayload`/`Role`/`Action` types; `express.d.ts` augments `Express.Request` with `user?: JwtPayload`.
- **`src/utils/token.ts`** — `generateToken`/`verify` for the JWT described above; use `generateToken` to mint test tokens rather than hand-rolling JWTs.

Each layer's public surface is a set of named exports (services export individual `RequestHandler`s, repositories export individual query functions) — not a class or a default-exported object.

## JWT shape

`tenantId` and `role` are the two fields everything downstream depends on:

```json
{ "userId": "...", "tenantId": "...", "email": "...", "role": "TenantAdmin", "iat": ..., "exp": ... }
```

## Testing

`tests/tenantIsolation.test.ts` is the designated place for proving cross-tenant data can't leak (currently an empty placeholder — filling it in is expected, not a sign it's unused). Use `bun:test` conventions; `supertest` is available for hitting the Express app directly.

## Path alias

`@/*` maps to `./src/*` (`tsconfig.json`); use it instead of relative imports across layers.

## TypeScript

Strict mode is on. Notable non-defaults enabled:
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
- `noImplicitOverride` — class overrides must use `override` keyword
- `noFallthroughCasesInSwitch`

`noUnusedLocals` and `noUnusedParameters` are intentionally disabled (polygon context).
