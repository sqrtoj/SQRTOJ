# 22 — Modern refresh pass (fluent, warm, easy to use)

A focused polish pass on top of the shipped Warm Harvest design system. The token
layer, palette, homepage, profile, and navbar rebuild are already in place; this
pass targets the primitives and surfaces that still read as "classic DMOJ" and
cascade across every page. Goal: a noticeably more modern, fluent, warm, and
easy-to-scan SQRTOJ on `test.sqrtoj.edu.vn`, with no markup rewrites and no logic
changes.

## Diagnosis of what still feels dated

Grounded in the current SCSS:

1. **Tables** (`table.scss`) — the single biggest offender. Every `td`/`th` carries
   a full 1px grid (`border-width: 0 1px 1px 0`), and headers are heavy solid
   `$color_navbar_bg` bars. Dense internal grid lines + slab headers read as a
   spreadsheet, not a modern app. Tables are everywhere (problem list, ranking,
   submissions, contests, stats), so this is the highest-leverage change.
2. **Inputs** (`widgets.scss`) — flat 1px border, no soft focus glow; focus relies
   only on the global outline. Feels utilitarian.
3. **Buttons** — solid and fine, but there is no pill/soft variant and hover is a
   flat color swap. Small refinement opportunity.
4. **Depth** — surfaces use a single shadow step; the UI is a bit flat and the
   layering hierarchy (canvas → card → raised → popover) is not always legible.
5. **Motion** — tasteful entrance exists for the homepage but stops at a handful of
   selectors; row/list content and tables snap in.
6. **Scrollbars / selection / details** — browser defaults; a themed scrollbar and
   selection color are cheap, high-impact "designed" cues.

## Principles (unchanged from `01-vision-and-principles.md`)

- Density stays. This is a judge; scoreboards and submission tables must remain
  compact and scannable. Modernize the chrome, not the information density.
- Token-driven. Every value consumes `var(--...)`; no new hardcoded colors. Both
  palettes (Warm Harvest / Summer) and both modes inherit automatically.
- No markup rewrites, no framework, no logic changes. Presentation only.
- Respect `prefers-reduced-motion`; all motion ends in the visible state.
- Maintain AA contrast (`07-accessibility.md`).

## Tasks

### T1 — Table refresh (highest leverage)
- Drop the internal vertical grid; keep only soft horizontal row separators
  (`--color-border`) so rows read as rows, not cells.
- Keep a branded header for identity but make it lighter and more refined: a subtle
  vertical gradient on the brand navbar color, a crisp accent hairline under the
  header, sticky-feeling weight, comfortable padding.
- Warmer, clearer hover + zebra striping using surface tokens.
- Preserve the rounded, clipped outer frame and `tabular-nums` on numeric columns.

### T2 — Input & select polish — ALREADY SATISFIED
- On audit, `widgets.scss` inputs and textareas already carry the token border,
  `--radius-md`, a `--color-border-strong` hover border, and the soft focus glow
  (`0 0 0 3px var(--color-focus-ring-soft)` + accent border). No change needed.

### T3 — Button refinement
- Keep the accent primary. Add an optional `.btn-pill` radius and a `.btn-ghost`
  text variant for low-emphasis actions.
- Warmer hover: keep the lift, add a faint accent-tinted shadow on the primary.

### T4 — Depth & surface hierarchy
- Give `.card` a real resting shadow by default (currently only `.card-raised`
  has one) so cards separate from canvas; keep `.card-flat` opt-out.
- Popover/dropdown elevation already handled in the navbar pass; align tokens.

### T5 — Motion extension
- Add a gentle single-shot entrance to the main `#content-body` block on first
  paint under `prefers-reduced-motion: no-preference`, ending visible.
- Deliberately NOT applied to table rows: live scoreboard/submission tables swap
  `<tr>`s via websocket and would re-animate on every tick.

### T6 — Themed chrome details
- Themed scrollbar (webkit + Firefox) using surface/border tokens.
- Warm `::selection` using the accent.
- Smooth `scroll-behavior` and a sensible `scroll-margin-top` offset for the fixed
  navbar so in-page anchors are not hidden under the bar.

## Rollout & validation

Incremental, one task per commit, following the established test-server recipe:
`git fetch/reset` → `./make_style.sh` → `collectstatic --noinput` →
`systemctl restart dmoj-site-test`, then verify the built `style.css` and an HTTP
200 from the test host. `make_style.sh` compiling all four variants cleanly is the
build gate. Prod (`main`) is untouched.
