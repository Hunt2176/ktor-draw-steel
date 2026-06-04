# Experimental Release 5 — "Motion, Consistency & Final Polish"

_Branch: `release/exp-5` → merges into `experimental`. Final cycle of the experimental program._

## Assessment (post-Release-4)

The app is functional, robust, accessible, and visually coherent. The remaining gaps are the
"finishing" details: motion, micro-consistency, onboarding, and platform metadata.

1. **No motion on value changes.** HP/recovery gauges snap to new values; combatant cards appear
   instantly; rounds advance with no feedback. A little tasteful motion adds polish and readability.
2. **Pluralization bugs.** "1 combatants", "1 characters" etc. read wrong (the campaigns page already
   does "1 hero token" correctly — bring the rest in line).
3. **No loading skeletons** — lists pop in; only spinners exist.
4. **Modal a11y** — no focus trap / focus return / body-scroll-lock.
5. **Empty campaign** (no characters and no combats) gives two tiny empty states but no real
   getting-started guidance.
6. **Home is static** — a hero with one CTA; could surface campaigns for one-click entry.
7. **No keyboard affordances in combat** (e.g. advance round).
8. **No web manifest / richer meta** for installability and link previews.
9. **Minor consistency drift** — button casing, heading sizes, spacing across pages.

## Scope — 10 Medium/Large + 10 Small

### Medium / Large
- **ML1** — Animate HP/recovery gauge arc + colour transitions on value change. _(ring-progress)_
- **ML2** — Card/list enter motion (combatants, characters) via CSS. _(campaign-detail + combat)_
- **ML3** — Pluralization audit (combatants / characters / minions). _(campaign-detail + campaigns + combat)_
- **ML4** — Shared loading **skeleton** component + use in the campaigns grid. _(new + campaigns)_
- **ML5** — Modal a11y: focus trap, initial focus, focus return, body-scroll-lock. _(modal)_
- **ML6** — Empty-campaign onboarding panel (no characters + no combats). _(campaign-detail)_
- **ML7** — Home enhancement: quick-launch list of campaigns. _(home)_
- **ML8** — Combat keyboard shortcut (advance round) + hint. _(combat)_
- **ML9** — Web manifest + richer meta tags (installable / link previews). _(index.html + public/manifest)_
- **ML10** — Consistency audit: heading scale, spacing, button casing, reduced-motion coverage. _(styles + modal)_

### Small
- **S1** — Tooltip (`title`) on truncated names. _(ring/skeleton via campaigns or card? → campaigns)_
- **S2** — Gauge colour transition + reduced-motion. _(ring-progress)_
- **S3** — Subtle "round advanced" pulse. _(combat)_
- **S4** — Reduced-motion coverage for all new animations. _(styles + ring)_
- **S5** — Manifest theme/name/icons. _(index.html + manifest)_
- **S6** — Campaigns: skeleton honours reduced-motion. _(campaigns)_
- **S7** — Home quick-launch reduced-motion + empty state. _(home)_
- **S8** — Modal scroll-lock cleanup on close/destroy. _(modal)_
- **S9** — Empty-campaign CTA wires to the existing new-character/new-combat flows. _(campaign-detail)_
- **S10** — Combat shortcut discoverability hint. _(combat)_

## Execution — agent dispatch (disjoint file ownership)

| Agent | Owns (only these files) | Improvements |
| ----- | ----------------------- | ------------ |
| E1 Gauges | `ui/ring-progress.ts` | ML1, S2, S4(ring) |
| E2 Modal + global | `ui/modal.ts`, `styles.css` | ML5, ML10, S8 |
| E3 Skeleton + campaigns | `ui/skeleton.ts` (new), `features/campaigns/campaigns.page.ts` | ML4, ML3(campaigns), S1, S6 |
| E4 Campaign-detail | `features/campaign-detail/campaign-detail.page.ts` | ML6, ML2(detail), ML3(detail), S9 |
| E5 Home + meta | `features/home/home.page.ts`, `index.html`, `public/manifest.webmanifest` (new) | ML7, ML9, S5, S7 |
| E6 Combat | `features/combat/combat.page.ts` | ML8, ML2(combat), ML3(combat), S3, S10 |

E3 owns the new `ds-skeleton`; no other agent depends on it (E4 keeps its existing spinner). Integration,
builds, and final visual verification owned by the orchestrator. After merge: update README, push, clean up.

## Outcome

Shipped. `pnpm --filter @draw-steel/web build` green after one integration fix. Verified:
- **Home quick-launch** lists the campaigns as glass chips + "All campaigns" link below the hero.
- **Combat keyboard shortcut**: pressing **N** opens the Next-Round modal (guarded against inputs /
  open modals); a muted "N" kbd badge advertises it; round number is emphasized.
- Modal **focus-trap + body-scroll-lock** render correctly (the shortcut-opened modal is accessible).
- Square combatant portraits, animated gauges (CSS transition), card enter motion, skeleton loaders,
  empty-campaign onboarding, web manifest + OG/Twitter meta — all built and compiling.

### Integration fix (orchestrator)
The first build failed: E2's modal focus-trap bound `(keydown.tab)`, whose `$event` the Angular
template type-checker types as `Event`, not `KeyboardEvent` (TS2345). Switched it to a plain
`(keydown)` binding (typed `KeyboardEvent`) with an `event.key !== 'Tab'` guard inside `onTab` — which
also makes Shift+Tab trapping work. Re-built green.

---

_This concludes the five-cycle experimental program. See [`../../README.md`](../../README.md) for the
release index._
