# Draw Steel

A campaign / combat manager for the **Draw Steel** TTRPG.

This is a full rewrite of the original Ktor (Kotlin) + React/Mantine application,
kept **functionally identical** and visually close to the original, on a modern
TypeScript stack:

| Layer     | Original                    | This rewrite                          |
| --------- | --------------------------- | ------------------------------------- |
| Backend   | Ktor + Exposed + SQLite     | **Hono** + **Drizzle** + better-sqlite3 |
| Frontend  | React 19 + Mantine          | **Angular** (standalone, signals, zoneless) + **Tailwind v4** |
| Validation| arktype                     | **zod**                               |
| Tooling   | Gradle + Bun + Vite         | **pnpm** workspace                    |

Everything is **100% TypeScript**.

## Experimental UX program (`experimental` branch)

The `Rewrite-1.0` tag marks the functional-parity rewrite. The `experimental` branch then
carries five iterative UX/design releases on top of it — each one a critical design pass that
files 10 medium/large + 10 small improvements, implements them, and ships. Release notes live in
[`docs/releases/`](docs/releases):

| Release | Theme |
| ------- | ----- |
| [1](docs/releases/release-1.md) | Foundations & Fidelity — app shell, landing, card grids, the `.ring`/Tailwind gauge-box fix |
| [2](docs/releases/release-2.md) | Polish & Presentation — fullscreen display route, character sheet, combat polish, per-campaign data fix |
| [3](docs/releases/release-3.md) | Robustness & Refinement — deep-link/refresh fix, condition semantics, popovers, inputs, a11y |
| [4](docs/releases/release-4.md) | Navigation, Feedback & Edge Cases — 404 page, toasts, searchable selector, icon-button labels |
| [5](docs/releases/release-5.md) | Motion, Consistency & Final Polish — gauge/list animation, modal focus-trap, skeletons, home quick-launch |

## Layout

```
.
├── packages/
│   └── shared/        # zod schemas + inferred DTO/socket/Kanka types (the server↔web contract)
├── apps/
│   ├── server/        # Hono REST API + WebSockets + Kanka proxy + file uploads + static SPA host
│   └── web/           # Angular SPA
└── legacy/            # the original Ktor + React project, kept for reference
```

## Requirements

- **Node 22.22.3+ / 24.15+ / 26+** — Angular 22's CLI rejects older or
  odd-numbered (non-LTS) releases. On Node 26, `better-sqlite3` has no prebuilt
  binary yet and compiles from source on install, so the Xcode Command Line
  Tools (`xcode-select --install`) are needed on macOS.
- **pnpm** — Node 24 ships it via `corepack enable pnpm`; Node 25+ dropped the
  bundled corepack, so install it directly with `npm install -g pnpm`.

## Install

```bash
pnpm install
```

This also downloads the native `better-sqlite3` binary. The first install asks
to approve build scripts; they are pre-approved in `pnpm-workspace.yaml`.

## Develop

Run the API and the Angular dev server together (the dev server proxies
`/api`, `/files`, `/kanka`, `/static` and `/watch` to the API on port 8080):

```bash
pnpm dev
# API:  http://localhost:8080
# Web:  http://localhost:4200
```

Or individually: `pnpm dev:server` / `pnpm dev:web`.

## Build & run (production)

```bash
pnpm build          # builds shared → web → server
pnpm start          # serves the built SPA + API on http://localhost:8080
```

The server serves the compiled Angular app at `/`, so a single process hosts
everything in production.

## Configuration (environment variables)

| Variable           | Default               | Purpose                                  |
| ------------------ | --------------------- | ---------------------------------------- |
| `PORT`             | `8080`                | HTTP port                                |
| `DATABASE_URL`     | `draw_steel.sqlite`   | SQLite file path                         |
| `FILES_DIR`        | `./files`             | Upload storage / served at `/files`      |
| `KANKA_API_KEY`    | _(unset)_             | Enables the cached Kanka proxy at `/kanka` |
| `KANKA_CACHE_DELAY`| `60`                  | Kanka cache TTL (seconds)                |

On first run the database schema is created and a default user (`id = 1`) is
seeded, matching the original deployment's assumption.

## API surface

The REST API is preserved verbatim under `/api` (camel-cased entity routes:
`campaigns`, `characters`, `combats`, `combatants`, `inventoryItem`, `users`,
`characterConditions`, `displayEntry`), including the original custom routes —
`/combats/create`, `/combats/{id}/nextRound`, `/characters/{id}/modify/health`,
`/campaigns/{id}/modify/heroTokens`, etc. — and the same HP / temporary-HP
damage-absorption logic.

Live updates use a WebSocket at `/watch/{campaignId}` that broadcasts the same
`CampaignSocketUpdate` payload the original emitted, so the UI refreshes
reactively on every change.
