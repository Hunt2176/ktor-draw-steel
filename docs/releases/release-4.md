# Experimental Release 4 — "Navigation, Feedback & Edge Cases"

_Branch: `release/exp-4` → merges into `experimental`._

## Assessment (post-Release-3)

The core flows are polished and robust. This cycle fills the gaps around the edges: what happens when
a URL is wrong, how the app gives feedback, and the supporting components (selector, upload,
confirmation) that haven't had a pass yet.

1. **No 404 route.** An unknown URL (e.g. `/nope`) renders a blank content area — there's no wildcard
   route or NotFound page.
2. **Icon-only buttons are unlabeled.** Release 3 added `ariaLabel` support to `ds-icon-btn`, but no
   callers pass it — the arrows/edit/briefcase/burger/+/trash buttons are still invisible to screen
   readers.
3. **Feedback is a blocking modal.** All errors surface via a single centered error modal; there are no
   non-blocking toasts for success/error, so routine actions give no lightweight confirmation.
4. **Character selector is bare** — a plain checkbox list + "Select All"; no search, no count, no
   select-none, no empty state. Painful with many characters.
5. **Confirmation popover** predates the Release-3 glass-popover restyle and looks plainer than the rest.
6. **Upload modal** has no drag-and-drop and a minimal layout (it does preview images).
7. **Mobile combat tile portrait** stretches into a tall, thin avatar bar.

## Scope — 10 Medium/Large + 10 Small

### Medium / Large
- **ML1** — 404 NotFound page + wildcard route. _(routes + new page)_
- **ML2** — App-wide icon-button `aria-label`s. _(page/shared components)_
- **ML3** — Searchable, counted character selector with select-all/none + empty state. _(character-selector)_
- **ML4** — Toast notification system (service + toaster) for transient feedback. _(new + app)_
- **ML5** — Campaign-detail combat cards show combatant count / status. _(campaign-detail)_
- **ML6** — Confirmation popover restyled to match the glass popover system. _(confirmation-popover)_
- **ML7** — Upload modal: drag-and-drop dropzone + clearer preview/layout. _(upload-modal)_
- **ML8** — Mobile combat/tile portrait fix (no tall-thin avatar). _(character-card)_
- **ML9** — Modal field polish across Quick Add / Modify / New Combat. _(combat + selector)_
- **ML10** — Error UX: route errors (and key successes) to non-blocking toasts. _(error.service + app)_

### Small
- **S1** — 404 page styling + Home CTA. _(not-found)_
- **S2** — Selector "Select All" ↔ "Select None" toggle. _(character-selector)_
- **S3** — Selector empty state. _(character-selector)_
- **S4** — Toast auto-dismiss + manual dismiss + stacking. _(toaster)_
- **S5** — Confirmation popover: focus confirm, escape cancels. _(confirmation-popover)_
- **S6** — Upload: accepted-type/size hint. _(upload-modal)_
- **S7** — Tile name truncation on mobile. _(character-card)_
- **S8** — Combat-detail card View/Delete aria-labels + hover. _(campaign-detail)_
- **S9** — Inventory add/delete aria-labels. _(inventory-list)_
- **S10** — Conditions/display/character icon-button aria-labels. _(conditions/display/character)_

## Execution — agent dispatch (disjoint file ownership)

| Agent | Owns (only these files) | Improvements |
| ----- | ----------------------- | ------------ |
| D1 Routing/404 | `app.routes.ts`, `features/not-found/not-found.page.ts` (new) | ML1, S1 |
| D2 Selector | `features/shared/character-selector.ts` | ML3, ML9(sel), S2, S3 |
| D3 Popover/Upload | `ui/confirmation-popover.ts`, `features/shared/upload-modal.ts` | ML6, ML7, S5, S6 |
| D4 Toasts | `core/toast.service.ts` (new), `ui/toaster.ts` (new), `app.ts`, `core/error.service.ts` | ML4, ML10, S4 |
| D5 Card mobile | `features/shared/character-card.ts` | ML8, S7 |
| D6 A11y sweep + meta | `features/campaign-detail/campaign-detail.page.ts`, `features/combat/combat.page.ts`, `features/display/display.page.ts`, `features/shared/inventory-list.ts`, `features/shared/character-conditions.ts`, `features/character/character.page.ts` | ML2, ML5, ML9(combat), S8, S9, S10 |

Integration, builds, and visual re-verification owned by the orchestrator.

## Outcome

Shipped. `pnpm --filter @draw-steel/web build` green (pre-existing NG8102 warnings only). Verified:
- **404 page** renders for unknown URLs (branded "404", message, Back-to-Home / Browse-campaigns CTAs)
  inside the shell.
- **Character selector** now has a search field, "Select All" toggle, and a live "0 of 5 selected"
  count.
- **Combat cards** on campaign-detail show combatant count ("Round: 1 · 3 combatants").
- **aria-labels** wired throughout (verified "New combat" etc.).
- **Toaster** mounts globally (`aria-live="polite"`); the blocking error modal was replaced by
  non-blocking toasts.
- Upload dropzone (drag-and-drop), confirmation-popover restyle + focus/escape, and the mobile tile
  portrait fix all built and compiling.
