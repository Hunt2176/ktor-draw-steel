# ktor-draw-steel

Node + TypeScript monorepo using pnpm workspaces:

- Angular frontend: `src/app`
- Hono backend: `src/backend`
- Database/ORM: Drizzle

## Setup

```bash
npx pnpm install
```

If native modules are blocked on first install, approve build scripts once:

```bash
npx pnpm approve-builds
```

## Common Commands

| Task                     | Description                     |
| ------------------------ | ------------------------------- |
| `pnpm dev`               | Run Angular dev server          |
| `pnpm backend:dev`       | Run backend in watch mode       |
| `pnpm backend:start`     | Run backend once                |
| `pnpm backend:typecheck` | Type-check backend              |
| `pnpm build`             | Build Angular app to `dist/app` |
| `pnpm db:generate`       | Generate Drizzle migration SQL  |
| `pnpm db:migrate`        | Apply Drizzle migrations        |
| `pnpm lint`              | Run workspace lint scripts      |

## Notes

- Backend config defaults are in `src/backend/application-base.yaml`.
- Local overrides can be placed in root `application.yaml`.
- The backend serves frontend static files from `dist/app` when available.
