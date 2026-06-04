# Experimental Release 2 — "Polish & Presentation"

_Branch: `release/exp-2` → merges into `experimental`._

## Assessment (grounded in live screenshots, post-Release-1)

Release 1 fixed the foundations; walking the deeper routes surfaced a **regression** and several
underdeveloped views:

1. **Display page is broken by the shell (REGRESSION).** The player/projector presentation route
   (`/campaigns/:id/display`) uses `h-full`/fixed layout expecting the full viewport, but Release 1's
   shell wraps it in an in-flow centered `max-w` container, collapsing the carousel to a sliver
   (faded title, stray scrollbar, floating burger). Fullscreen routes must opt out of the shell.
2. **Character detail page is a lone card** floating in a vast empty page — no conditions, no
   inventory, no resource/surges; just a 15rem card top-left. Needs to be a real character sheet.
3. **Combat page is functional but unpolished** — ghost "Modify/Quick Add" buttons, a heavy blue
   per-combatant action stack, plain resource/surge counters, plain column headers, no empty state,
   constrained to a narrow container though it's a wide tactical view.
4. **Campaign character counts are wrong** — the list endpoint pairs every campaign with the
   *global* character list (each card reads "10 characters"). Faithful to an original quirk, but
   misleading; scope it per-campaign now that we're improving.
5. **`full`-variant portrait placeholder** is a big bland gray box; the tile placeholder is
   unbalanced next to stacked rings on mobile.
6. **Display entries without images** render near-empty slides (faded title only) — need a graceful
   titled fallback.
7. **Condition pills / inventory list** are minimal and could be more legible/consistent.

## Scope — 10 Medium/Large + 10 Small

### Medium / Large
- **ML1** — Route-data-driven shell chrome: fullscreen (`bare`) routes hide the header and fill the
  viewport; wide routes get a full-width container. Fixes the display regression. _(app-shell + routes)_
- **ML2** — Fix campaign-list character scoping so each campaign reports its own characters/entries. _(server)_
- **ML3** — Character detail → real character sheet: centered layout with stats, HP/recoveries,
  resource, conditions panel, inventory panel. _(character.page)_
- **ML4** — Combat page polish: refined header, column headers, combatant action affordances,
  resource/surge stat blocks, wide layout, empty state. _(combat.page)_
- **ML5** — Display page presentation polish: graceful titled fallback for image-less entries,
  legible captions, polished drawer + add-entry. _(display.page)_
- **ML6** — Condition pills: color-coded by end type, clearer remove affordance. _(character-conditions
  via combat usage / shared)_ — implemented where owned this cycle.
- **ML7** — Empty/loading states for combat & display. _(combat.page + display.page)_
- **ML8** — Portrait placeholder refinement (gradient, balanced sizing, nicer initials) in both
  variants. _(character-card)_
- **ML9** — Inventory list polish (legible rows, spacing, hover). _(inventory-list)_
- **ML10** — Shell nav robustness + wide-route support + hover polish. _(app-shell + routes)_

### Small
- **S1** — Character-card name no longer wraps awkwardly in dense grids. _(character-card)_
- **S2** — Combat header buttons unified variant/sizing. _(combat.page)_
- **S3** — Combat "Hero Tokens" → badge consistent with detail page. _(combat.page)_
- **S4** — Lighter per-combatant action icon-buttons. _(combat.page)_
- **S5** — Resource/Surges as styled stat blocks. _(combat.page)_
- **S6** — Display drawer entry buttons + Add Entry affordance polish. _(display.page)_
- **S7** — Modal entrance transition / backdrop consistency. _(modal)_
- **S8** — Character sheet edit action clarity. _(character.page)_
- **S9** — Display image-less slide spacing/typography. _(display.page)_
- **S10** — Inventory empty state. _(inventory-list)_

## Execution — agent dispatch (disjoint file ownership)

| Agent | Owns (only these files) | Improvements |
| ----- | ----------------------- | ------------ |
| B1 Shell/Routing | `ui/app-shell.ts`, `app.routes.ts` | ML1, ML10 |
| B2 Display | `features/display/display.page.ts` | ML5, ML7(disp), S6, S9 |
| B3 Character sheet | `features/character/character.page.ts` | ML3, S8 |
| B4 Combat | `features/combat/combat.page.ts` | ML4, ML6, ML7(combat), S2, S3, S4, S5 |
| B5 Card/Modal | `features/shared/character-card.ts`, `ui/modal.ts` | ML8, S1, S7 |
| B6 Inventory + Backend | `features/shared/inventory-list.ts`, `apps/server/src/routes/campaigns.ts` | ML9, S10, ML2 |

Route-data contract (B1↔B2/B4): display route → `data:{ shell:'bare' }` (no header, viewport-fill
wrapper with `h-screen`); combat route → `data:{ shell:'wide' }` (header kept, full-width container).
Integration, builds, and visual re-verification owned by the orchestrator.

## Outcome

Shipped. Server `tsc` + `pnpm --filter @draw-steel/web build` both green. Visually verified:
campaign character counts now correct per-campaign (5 / 3 / 2); the **display regression is fixed**
(fullscreen presentation with monogram fallbacks + framed captions); character page is a real
two-column sheet (card + Conditions + Inventory); combat is a full-width tracker with a balanced
header, counted column badges, "None" empty state, lighter action buttons, and resource/surge stat
blocks; modal transitions + refined avatar placeholders confirmed.

### Integration fix (orchestrator)
The first build exposed a content-projection bug in B1's shell: it placed a **separate
`<ng-content/>` in each `@if` branch**. Angular only distributes projected content to one slot, so
`bare` routes rendered blank (the display page never mounted). Reworked `app-shell.ts` to a **single
`<ng-content/>`** with only the header toggled by `@if`, and the container styled per mode
(`--bare` fills the viewport so child `h-full` resolves). Re-verified green.
