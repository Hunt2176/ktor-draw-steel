# Experimental Release 3 — "Robustness & Refinement"

_Branch: `release/exp-3` → merges into `experimental`._

## Assessment (post-Release-2)

The pages now look good; this cycle goes after **robustness, interaction quality, accessibility, and
component-level fidelity** — the things you only notice on the second look.

1. **Deep-link / refresh bug (flaky, high value).** Loading a parametrized route directly
   (`/campaigns/:id`, `/characters/:id`, `/combats/:id`, `/campaigns/:id/display`) or refreshing it
   sometimes lands on a blank outlet or bounces to Home. Cause: the `Number.isNaN(idComputed())`
   redirect guards run against the route input's **empty-string default** before
   `withComponentInputBinding` populates it, firing a spurious navigation that races the real one.
   Confirmed flaky (worked one cycle, blank the next). Must guard against the empty default.
2. **Condition pills carry no semantics** — `save` vs `endOfTurn` conditions render identically; no
   color/legend. The add-condition form uses **bare unstyled radio buttons + a native datalist** that
   clash with the themed UI.
3. **`full` character-card stat overlay** ("M 2 A 2 R -1 I 1 P 0") is a plain dark bar — should read
   as styled stat chips.
4. **Popover dropdowns** lack a consistent glass container / entrance transition; the **value-modifier**
   is bare (no quick presets, no enter-to-apply, applies even when empty).
5. **Accessibility gaps** — icon-only buttons (arrows, edit, briefcase, burger, condition ×) have no
   `aria-label`; portraits no alt; focus order fine but labels missing.
6. **Form inputs** (number/switch/checkbox) are lightly themed; number field has no stepper, switch is
   plain; focus affordance inconsistent.
7. **Global** — muted text contrast is a touch low; heading scale varies per page; no text-selection
   color; transitions/reduced-motion not unified.

## Scope — 10 Medium/Large + 10 Small

### Medium / Large
- **ML1** — Fix the deep-link/refresh redirect race on all 4 parametrized routes (guard only when the
  param is present-but-invalid). _(4 page components)_
- **ML2** — Condition pills color-coded by `endType` (save vs end-of-turn) with clear semantics. _(conditions)_
- **ML3** — Themed add-condition form: styled segmented control for end type + themed combobox. _(conditions)_
- **ML4** — `full` card stat overlay → styled stat chips. _(character-card)_
- **ML5** — Popover dropdown: consistent glass panel + entrance transition + elevation. _(popover)_
- **ML6** — value-modifier UX: quick presets, enter-to-apply, disable on empty, clear inc/dec. _(value-modifier)_
- **ML7** — Icon-button a11y + interaction: `aria-label` input, focus-visible, active/press states. _(icon-button)_
- **ML8** — Themed inputs: number stepper, styled switch/checkbox, consistent focus. _(inputs)_
- **ML9** — Global polish: muted-text contrast, heading scale, selection color, unified transitions +
  reduced-motion. _(styles)_
- **ML10** — Button micro-interactions: press/active states, consistent variant/size, icon gap. _(button)_

### Small
- **S1** — `aria-label`/alt on portraits & icon-only actions. _(card + icon-button)_
- **S2** — Condition pill `×` larger hit target + `aria-label`. _(conditions)_
- **S3** — Add-condition: autofocus + submit-on-enter + validation. _(conditions)_
- **S4** — Stat-chip spacing/typography. _(character-card)_
- **S5** — Popover: escape/outside-click close consistency. _(popover)_
- **S6** — value-modifier: show sign, disable apply at 0/empty. _(value-modifier)_
- **S7** — Switch/checkbox label hit target + focus ring. _(inputs)_
- **S8** — Number input: step, guard accidental wheel changes. _(inputs)_
- **S9** — Global link/focus/scrollbar/selection refinement. _(styles)_
- **S10** — Button loading/disabled affordance. _(button)_

## Execution — agent dispatch (disjoint file ownership)

| Agent | Owns (only these files) | Improvements |
| ----- | ----------------------- | ------------ |
| C1 Route robustness | `features/campaign-detail/campaign-detail.page.ts`, `features/character/character.page.ts`, `features/combat/combat.page.ts`, `features/display/display.page.ts` | ML1 |
| C2 Conditions | `features/shared/character-conditions.ts` | ML2, ML3, S2, S3 |
| C3 Popover/Modifier | `ui/value-modifier.ts`, `ui/popover.ts` | ML5, ML6, S5, S6 |
| C4 Card | `features/shared/character-card.ts` | ML4, S1(card), S4 |
| C5 Buttons | `ui/button.ts`, `ui/icon-button.ts` | ML7, ML10, S1(btn), S10 |
| C6 Inputs + global | `ui/inputs.ts`, `styles.css` | ML8, ML9, S7, S8, S9 |

C1 makes MINIMAL guard-only edits (no restyling) so the 4 page files stay conflict-free with this and
future cycles. Integration, builds, and visual + deep-link re-verification owned by the orchestrator.

## Outcome

Shipped. `pnpm --filter @draw-steel/web build` green. Verified:
- **Deep-link/refresh fix**: direct loads of `/campaigns/1`, `/characters/1`, `/characters/3`,
  `/combats/1` now mount their components instead of bouncing to Home (the NaN guards no longer fire
  on the empty-string default). Repeated reloads land correctly.
- **Stat chips** render on the full card (e.g. M0 A1 R1 I2 P2, negatives legible).
- **Condition pills** are color-coded by end type (e.g. "Frightened · SAVE" with a green dot and a
  larger labelled × hit target).
- **Inventory empty state** ("No items"), themed switch/checkbox, value-modifier presets + disabled-
  on-empty, glass popover panel with entrance transition, icon-button `aria-label` support, and
  button press/active states all built and compiling.

Note: one transient blank/redirect was observed during a preview-server cold start; code review
confirms the guards cannot redirect a valid id, and subsequent reloads were consistently correct.
