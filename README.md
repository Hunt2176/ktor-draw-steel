# draw-steel (Bun + TypeScript backend)

The backend has been rewritten to run on Bun HTTP with:

- Drizzle ORM
- SQLite (`draw_steel.sqlite`)
- Zod request validation
- WebSocket campaign updates at `/watch/:id`

## Run

1. Install dependencies:

```bash
bun install
```

2. Start backend (port 8080 by default):

```bash
bun run server:dev
```

3. Start frontend (Vite):

```bash
bun run dev
```

## Backend entrypoint

- [src/server/index.ts](src/server/index.ts)

## Database schema

- [src/server/db.ts](src/server/db.ts)

Tables are initialized automatically on startup.

## Environment variables

- `PORT` (default: `8080`)
- `KANKA_API_KEY` (optional, enables `/kanka/*` proxy)
- `KANKA_CACHE_DELAY` seconds (optional, default `60`)

