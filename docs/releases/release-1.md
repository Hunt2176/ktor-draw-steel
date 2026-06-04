# Experimental Release 1 — "Foundations & Fidelity"

_Branch: `release/exp-1` → merges into `experimental`._

## Critical UX/Design Assessment (grounded in live screenshots)

The Rewrite 1.0 build is **functionally complete** but **visually unfinished**. Walking the
app at desktop and mobile widths surfaced one outright rendering bug, a broken-image layout
defect, and a pervasive lack of app-level structure (no shell, no landing, bare list pages).
Content hugs the top-left corner on every route; there is no brand identity, no navigation,
and no responsive discipline.

Severity-ordered findings:

1. **Gauge "box" rendering bug.** Every HP/recovery ring is wrapped in a 1px gray square. Root
   cause: the gauge wrapper uses `class="ring"`, which **collides with Tailwind v4's `ring`
   utility**, injecting `box-shadow: 0 0 0 1px #c1c2c5`. Appears on campaign-detail, combat, and
   character pages — the single most damaging visual defect.
2. **Empty portrait images.** `<img [src]="character().pictureUrl ?? ''">` renders a broken-image
   box when there's no portrait, and still reserves a 100px column, shoving rings sideways and
   forcing them to wrap. Badly degrades both desktop tile cards and mobile.
3. **Home is a placeholder.** Literally renders "Stuff Here" + a single text link. No brand, no nav.
4. **Campaigns page is bare.** Stacked blue buttons in the top-left, oceans of dead space, no card
   grid, no create affordance, no empty/loading state.
5. **No app shell.** No header, no navigation, no way back home, no centered max-width container.
   Every page free-floats in the top-left.
6. **Weak card hierarchy.** Character cards barely read as cards — the glass surface is invisible,
   name/rings/inventory crowd together, no hover affordance.
7. **Mobile is broken**, not just unstyled — empty img column offsets content, header text wraps
   ("Round: / 1"), no responsive grid.
8. **Flat typography & no identity.** Headings are flat gray, one weight; no logo/wordmark.
9. **Missing focus-visible / a11y.** Keyboard focus is invisible (and what little exists is eaten
   by the `.ring` collision). No semantic landmarks.
10. **Inconsistent surfaces & spacing** — section panels, buttons, and icon-buttons vary in radius,
    weight, and padding with no shared rhythm.

## Scope — 10 Medium/Large + 10 Small

### Medium / Large
- **ML1** — Fix the `.ring` Tailwind collision; gauges render clean with no box. _(ring-progress)_
- **ML2** — Portrait placeholder: render a styled fallback (silhouette/initials) when no
  `pictureUrl`; stop reserving a broken image column. _(character-card)_
- **ML3** — Global **app shell**: sticky header with wordmark + Home/Campaigns nav, centered
  `max-w` container, consistent page padding. _(app + new app-shell)_
- **ML4** — Real **Home** landing page: title, tagline, primary CTA into Campaigns. _(home)_
- **ML5** — **Campaigns** redesigned as a responsive card grid with create button + empty &
  loading states. _(campaigns)_
- **ML6** — Character-card **visual hierarchy**: legible glass surface, border, hover elevation,
  stronger name typography. _(character-card)_
- **ML7** — **Campaign-detail** layout: responsive card grid, header that doesn't wrap, tidy
  Combats/Characters sections + empty states. _(campaign-detail)_
- **ML8** — **Design tokens & a11y**: global `:focus-visible` ring, refined surface tokens,
  heading rhythm. _(styles.css)_
- **ML9** — **Empty states** for zero-campaign / zero-combat / zero-character. _(campaigns +
  campaign-detail)_
- **ML10** — **Brand identity & typography scale**: wordmark, heading scale, accent usage.
  _(app-shell + styles.css)_

### Small
- **S1** — Document `<title>`, theme-color meta, favicon. _(index.html)_
- **S2** — Hover/active/focus states on campaign cards & primary buttons. _(campaigns + styles.css)_
- **S3** — Loading states for `resource()` pending (campaigns + detail). _(campaigns + campaign-detail)_
- **S4** — Hero-token rendered as a badge/stat, not bare text. _(campaign-detail)_
- **S5** — Section "+" action buttons: consistent size/weight. _(campaign-detail)_
- **S6** — Fix scrollbar gutter / double-scroll from `ds-root { overflow:auto }`. _(styles.css)_
- **S7** — Character-card name/stat spacing refinements. _(character-card)_
- **S8** — Shared page max-width & padding rhythm tokens. _(app-shell + styles.css)_
- **S9** — Combats/Characters section panels: consistent card polish. _(campaign-detail)_
- **S10** — `theme-color` + body background refinement for seamless dark surface. _(styles.css)_

## Execution — agent dispatch (disjoint file ownership, no conflicts)

| Agent | Owns (only these files) | Improvements |
| ----- | ----------------------- | ------------ |
| A1 Gauge & Card | `ui/ring-progress.ts`, `features/shared/character-card.ts` | ML1, ML2, ML6, S7 |
| A2 Shell & Home | `app.ts`, `ui/app-shell.ts` (new), `features/home/home.page.ts`, `index.html` | ML3, ML4, ML10, S1 |
| A3 Campaigns | `features/campaigns/campaigns.page.ts` | ML5, ML9(a), S2(a), S3(a) |
| A4 Design tokens | `styles.css` (exclusive) | ML8, S2(b), S6, S8, S10 |
| A5 Campaign-detail | `features/campaign-detail/campaign-detail.page.ts` | ML7, ML9(b), S3(b), S4, S5, S9 |

Integration, full `pnpm build`, and visual re-verification owned by the orchestrator.

## Outcome

Shipped. `pnpm --filter @draw-steel/web build` green (only pre-existing NG8102 warnings in
untouched files). Visually verified at desktop: Home is now a branded landing; the global shell
adds a sticky header + centered container to every route; Campaigns is a card grid; the gauge
"box" bug and broken-portrait boxes are gone (initials placeholders); campaign-detail and combat
read as organized, bordered panels.

### Discovered / deferred to a later cycle
- **BUG (backend):** the campaign-list endpoint (`GET /api/campaigns` aggregation) returns *all*
  characters for every campaign — each card shows "10 characters" (5+3+2 seeded). The per-campaign
  character filter is missing in the list aggregation. Flagged for a later experimental release.
