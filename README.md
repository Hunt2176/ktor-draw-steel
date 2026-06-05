# Draw Steel — Grimoire (TypeScript rewrite)

A virtual-tabletop companion for the **Draw Steel** RPG: manage campaigns, hero
rosters, live combat encounters (HP/recovery/resource/surge tracking, conditions,
rounds), inventories, and a full-screen player-facing display screen with optional
[Kanka](https://kanka.io) worldbuilding integration.

This is a **100% TypeScript** rewrite of the original Kotlin/Ktor + React/Mantine
application, kept functionally identical and visually close to the original.

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

## Prerequisites

- **Node.js ≥ 20** (developed on Node 20–26). Check with `node -v`.
- **pnpm 11** — this repo pins `pnpm@11.5.1`. The easiest way to get the right
  version is Corepack (bundled with Node):
  ```bash
  corepack enable
  corepack prepare pnpm@11.5.1 --activate
  pnpm -v   # → 11.5.1
  ```
  (Or install pnpm any other way; any pnpm 11.x works.)
- A C toolchain is needed the first time you install, because `better-sqlite3`
  compiles a native module — on macOS install Xcode Command Line Tools
  (`xcode-select --install`); on Debian/Ubuntu `apt-get install build-essential python3`.
  No separate database server is required — SQLite is file-based and auto-created.

## Getting started

```bash
# 1. Clone and enter the repo
git clone https://github.com/Hunt2176/ktor-draw-steel.git
cd ktor-draw-steel
git switch claude-code-grimoire    # the branch this rewrite lives on

# 2. Install all workspaces (compiles better-sqlite3 on first run)
pnpm install

# 3. Build everything (shared → server → web)
pnpm build
```

### Run it

**Option A — production-style (one process, recommended for just trying it).**
The server builds-in nothing extra; it serves the compiled Angular SPA, the API,
and the WebSocket all on one port. Requires `pnpm build` to have run first.

```bash
pnpm --filter @draw-steel/server start    # → open http://localhost:8080
```

**Option B — development (two processes, live reload).** The Angular dev server
proxies `/api`, `/files`, and the `/watch` WebSocket to the API server, so you
use the web URL.

```bash
pnpm dev            # runs BOTH: API on :8080 + Angular on :5173
# open http://localhost:5173
```

(`pnpm dev:server` and `pnpm dev:web` run the two halves individually if you
prefer separate terminals.)

### Seed sample data

The seeder talks to the running server's REST API, so **start the server first**
(Option A or B above), then in another terminal:

```bash
pnpm seed                                  # 5 campaigns + players + heroes on :8080
pnpm seed -- --campaigns-only              # campaigns only (no heroes)
pnpm seed -- --dry-run                     # print what it would create, write nothing
node seed-campaigns.mjs --url http://localhost:3000   # point at a non-default URL/port
```

Seeding is **idempotent** — re-running skips anything that already exists, so it's
safe to run repeatedly. Then reload the app and you'll see five campaigns.

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
