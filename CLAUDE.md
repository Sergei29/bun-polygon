# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this repo

A Bun-based TypeScript playground ("polygon") for experimentation, algorithms, and interview prep. Work is organized by topic on separate branches (`algorithms-ds`, `interview-prep-udemy`).

## Commands

```bash
bun run dev          # run src/index.ts with file watching
bun test             # run all tests
bun test src/tests/demo.test.ts  # run a single test file
bun run format       # format with Prettier
```

## Testing

Tests use `bun:test` (built-in, no separate test runner). Import from `"bun:test"`:

```ts
import { describe, it, expect } from "bun:test";
```

Test files live in `src/tests/`.

## TypeScript

Strict mode is on. Notable non-defaults enabled:
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
- `noImplicitOverride` — class overrides must use `override` keyword
- `noFallthroughCasesInSwitch`

`noUnusedLocals` and `noUnusedParameters` are intentionally disabled (polygon context).
