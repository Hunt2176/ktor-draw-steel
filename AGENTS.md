# AGENTS.md

## Purpose

This file provides implementation guidance for coding agents working in this
repository.

## Project Overview

- Monorepo: pnpm workspaces
- Frontend: Angular 21 app in src/app
- Backend: Hono + TypeScript in src/backend
- Database: Drizzle ORM + SQLite

## Repository Map

- Frontend source: src/app/src
- Frontend entry: src/app/src/main.ts
- Frontend routes: src/app/src/ng/app/app.routes.ts
- Frontend pages: src/app/src/ng/pages
- Frontend services: src/app/src/services
- Frontend models/types: src/app/src/types
- Backend entry: src/backend/index.ts
- Backend app wiring: src/backend/app.ts
- Backend routes: src/backend/routes
- Drizzle migrations: drizzle
- Root config override: application.yaml

## Standard Commands

From repository root:

- Install dependencies: pnpm install
- Frontend dev server: pnpm dev
- Frontend build: pnpm build
- Frontend lint: pnpm lint
- Backend watch mode: pnpm backend:dev
- Backend one-shot start: pnpm backend:start
- Backend typecheck: pnpm backend:typecheck
- Generate DB migration: pnpm db:generate
- Apply DB migration: pnpm db:migrate

## Frontend TypeScript Import Conventions

Use aliases instead of deep relative imports.

Configured aliases:

- @app/* -> src/app/src/*
- @services/* -> src/app/src/services/*

Preferred examples:

- import { appRoutes } from '@app/ng/app/app.routes';
- import { CampaignService } from '@services/campaign.service';
- import { CampaignDetails } from '@app/types/models';

Avoid patterns like:

- ../../../services/...
- ../types/...

## Frontend API Layer Conventions

- Use Angular HttpClient-based services in src/app/src/services.
- Keep endpoint ownership by domain service.

Current domain split:

- Campaign endpoints: campaign.service.ts
- Character endpoints: character.service.ts
- Character condition endpoints: character-condition.service.ts
- Inventory endpoints: inventory-item.service.ts
- Combat endpoints: combat.service.ts
- Combatant endpoints: combatant.service.ts
- Display entry endpoints: display-entry.service.ts
- File endpoints: file.service.ts

## Angular Conventions

- Standalone components are used.
- App bootstrap uses provideRouter, provideAnimations, provideHttpClient.
- RxJS Observables are used in services; components may use firstValueFrom where
  promise-style flow is preferred.

## Angular State and Reactivity Preferences

- Prefer Angular signals for component state where practical.
- Prefer rxResource for API-backed state and async data loading in components.
- Use effect sparingly; avoid using effect when computed state, resource
  lifecycles, or explicit event handlers are a better fit.
- Use toSignal and toObservable only when bridging is necessary.
- Avoid unnecessary signal/observable bouncing (do not convert back and forth
  repeatedly in the same flow).
- If a flow is naturally stream-heavy (complex composition, cancellation,
  multicasting, or operator-driven logic), keep it in RxJS end-to-end.
- Keep service APIs Observable-based (HttpClient defaults) and adapt at the
  component boundary when needed.

## Backend Notes

- Hono server and websocket hub are in src/backend.
- Backend config defaults: src/backend/application-base.yaml.
- Root application.yaml can override defaults for local environment.
- Backend can serve frontend static files from dist/app when available.

## Database Notes

- Drizzle config: drizzle.config.ts.
- SQL snapshots/migrations are tracked in drizzle/.

## Runtime Pitfalls

- better-sqlite3 is a native module. If Node version changes, ABI mismatch may
  occur.
- If backend startup fails with module mismatch, reinstall/rebuild dependencies
  for the current Node runtime.

## Change Workflow For Agents

1. Read relevant feature/page/service files first.
2. Keep changes scoped; avoid broad refactors unless requested.
3. Preserve existing API contracts and route shapes.
4. Prefer alias imports in frontend TS files.
5. Validate with typecheck/lint for touched area when practical.
6. Summarize changed files and behavior impact.

## Testing Guidance

When modifying frontend data flow:

- Verify each touched page still loads route params correctly.
- Verify service call payloads and endpoint paths.
- Verify error-state UI fields are still set on failures.

When modifying backend routes:

- Verify endpoint path consistency with frontend service methods.
- Verify schema/type assumptions at boundaries.

## Out of Scope Unless Requested

- Do not redesign UI structure/themes by default.
- Do not rename public endpoints without coordinated frontend/backend updates.
- Do not remove migrations or alter historical SQL snapshots.
