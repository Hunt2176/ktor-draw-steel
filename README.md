# Draw Steel — Grimoire (TypeScript rewrite)

A virtual-tabletop companion for the **Draw Steel** RPG: manage campaigns, hero
rosters, live combat encounters (HP/recovery/resource/surge tracking, conditions,
rounds), inventories, and a full-screen player-facing display screen with optional
[Kanka](https://kanka.io) worldbuilding integration.

This is a **100% TypeScript** rewrite of the original Kotlin/Ktor + React/Mantine
application, kept functionally identical and visually close to the original. The
canonical original lives at `../../Original/ktor-draw-steel`.

## Stack

| Layer      | Original                     | This rewrite                          |
|------------|------------------------------|---------------------------------------|
| Backend    | Ktor (Kotlin)                | **Hono** (TypeScript)                 |
| Database   | Exposed + SQLite             | **Drizzle ORM** + SQLite (better-sqlite3) |
| Frontend   | React 19 + Mantine + Vite    | **Angular** (standalone, signals)     |
| Styling    | Mantine + Tailwind           | **Tailwind** utilities + a small Mantine-flavoured component kit |
| Validation | arktype                      | **zod**                               |
| Tooling    | Gradle + Bun                 | **pnpm** monorepo                     |

## Monorepo layout

```
packages/
  shared/   @draw-steel/shared  — zod schemas + inferred DTO/request/socket types (the API contract)
  server/   @draw-steel/server  — Hono app, Drizzle schema, generic CRUD repositories, WebSocket, Kanka proxy, uploads
  web/      @draw-steel/web     — Angular SPA (7 routes), reactive store + WebSocket live updates
```

The server serves the built Angular SPA at `/`, the REST API under `/api`,
uploaded files under `/files`, the Kanka proxy under `/kanka`, and the campaign
live-update WebSocket at `/watch/{campaignId}`.

## Getting started

```bash
pnpm install          # install all workspaces (compiles better-sqlite3)
pnpm build            # build shared → server → web

# Development (two processes, web proxies /api and /watch to the server):
pnpm dev:server       # Hono on http://localhost:8080
pnpm dev:web          # Angular dev server on http://localhost:5173

# Or run the production server (serves the built SPA itself):
pnpm --filter @draw-steel/server start   # http://localhost:8080
```

### Seed sample data

With the server running:

```bash
pnpm seed                       # 5 campaigns + players + heroes on :8080
node seed-campaigns.mjs --url http://localhost:8099   # custom URL
```

## Configuration (server env vars)

| Variable           | Default                      | Purpose                                  |
|--------------------|------------------------------|------------------------------------------|
| `PORT`             | `8080`                       | HTTP port                                |
| `DATABASE_URL`     | `./draw_steel.sqlite`        | SQLite file (auto-created on first run)   |
| `FILES_DIR`        | `./files`                    | Upload storage, served at `/files`        |
| `STATIC_DIR`       | `packages/web/dist/web/browser` | Built SPA directory                    |
| `KANKA_API_KEY`    | _unset_ → `/kanka` returns 503 | Kanka bearer token                      |
| `KANKA_CACHE_DELAY`| `60`                         | Kanka proxy cache TTL (seconds)           |

## Notes on fidelity

- The REST surface, payload shapes, and the campaign live-update WebSocket are a
  1:1 port of the original, so the existing data model and client expectations are
  preserved (including quirks such as the campaign-list aggregate).
- The generic `BaseRepository` reproduces the original Exposed/Ktor repository
  abstraction (auto-registered CRUD routes + per-entity customisation).
- The UI reproduces the Mantine dark theme (charcoal background, glass cards,
  green/blue HP & recovery rings, accent buttons) with Tailwind; exact pixel
  parity was not a goal where it would have been disproportionately costly.
