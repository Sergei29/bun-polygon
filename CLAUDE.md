# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this repo

A Bun-based TypeScript playground ("polygon") for experimentation, algorithms, and interview prep, organized by topic on separate branches (`algorithms-ds`, `interview-prep-udemy`, `design-patterns`, etc.).

This branch (`appointments-nhs-app`) is a concrete project: an Express + Drizzle ORM API for managing clinic patients (an "NHS-style" appointments system), backed by Postgres.

## Commands

```bash
bun install           # install dependencies
bun run dev            # run src/server.ts (entry point; no file watching configured)
bun test                # run all tests (bun:test, built-in — no test files exist yet)
bun run format          # format with Prettier
bun run check:format     # check formatting without writing
bun run check:types      # tsc --noEmit
```

Database (Drizzle + Postgres, local Postgres via `docker-compose.yml` — `docker compose up -d` starts it on port 5432):

```bash
bun run db:generate    # generate a migration from schema changes
bun run db:migrate      # apply migrations
bun run db:push          # push schema directly (no migration file)
bun run db:studio        # open Drizzle Studio
bun run db:check          # sanity-check migrations
```

Root `index.ts` is leftover `bun init` boilerplate — the real app entry point is `src/server.ts`.

## Environment

`src/config/env.ts` loads `.env` and validates it with Zod at startup (`envSchema.parse`). Required vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars); `PORT` defaults to 3000. Adding a new env var means adding it to `envSchema`, not just `.env`.

## Architecture

Request flow follows a strict layered pattern — each layer only talks to the one directly below it:

```
Route → Middleware (Zod validation) → Controller → Service → Repository → Drizzle → Postgres
```

- **`src/routes/`** — Express routers per resource, wired together in `src/routes/index.ts` and mounted in `src/app.ts`. Routes attach validation middleware before the controller.
- **`src/middleware/`** — per-resource Zod validation (`<resource>.middleware.ts`). Parses `req.body` with `safeParse`, reassigns the validated/coerced data back onto `req.body`, and responds `400` with joined field errors on failure.
- **`src/schemas/`** — Zod schemas per resource, plus the inferred TS input types (e.g. `CreatePatientInput`) consumed by middleware, controllers, and services.
- **`src/controllers/`** — thin `RequestHandler`s, typed with `RequestHandler<Params, ResBody, ReqBody>`. Extract input from `req`, call the matching service, set the HTTP response. No business logic.
- **`src/services/`** — business logic layer; currently pass-through to repositories but is where non-persistence logic belongs.
- **`src/repositories/`** — the only layer that imports `src/db`. Owns Drizzle queries and `.returning()` field selection.
- **`src/db/`** — `schema.ts` defines Drizzle pgTables; `index.ts` creates the `postgres` client and exports `db`.
- **`src/types/`** — shared response types not derived from a Zod schema (e.g. `PatientResponse`).
- **`src/errors/`** — currently empty; no custom error hierarchy exists yet.

Each layer's public surface is a default-exported object of named handlers (e.g. `export default { create: createPatientController }`), not a class — follow this pattern when adding new resource verbs.

Path alias `@/*` maps to `./src/*` (`tsconfig.json`); use it instead of relative imports across layers.

## TypeScript

Strict mode is on. Notable non-defaults enabled:
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
- `noImplicitOverride` — class overrides must use `override` keyword
- `noFallthroughCasesInSwitch`

`noUnusedLocals` and `noUnusedParameters` are intentionally disabled (polygon context).
