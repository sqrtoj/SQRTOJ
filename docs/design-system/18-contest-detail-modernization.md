# 18 — Contest Detail Page Modernization

Presentation-only refresh of the contest detail page (`templates/contest/contest.html`)
and its shared CSS (`resources/contest.scss`). No view, model, or countdown-JS
logic was touched.

## Problems with the old page

- The `#banner` was a plain text-centered block: an oversized link with the
  countdown, a line of time-window text, and a long bulleted list of contest
  rules with default list markers. It read as a wall of text, not a hero.
- Section headers (`Problems`, `Announcements`, `Clarifications`) used inline
  `style="margin-bottom:0.2em; float:..."` and inconsistent icons.
- The `Register` pseudo-tab used a hardcoded green gradient
  (`#87ab69 → #4b6043`), off-palette in Warm Harvest and not theme-aware.

## Changes

### `templates/contest/contest.html`
- Wrapped the countdown link + time window in a `.contest-countdown` block so it
  can render as a branded accent band (like the home hero).
- Replaced the three inline-styled `<h2>` headers with `.contest-section-head`
  blocks and clearer FontAwesome icons (`fa-list-ol`, `fa-bullhorn`,
  `fa-question-circle`).

### `templates/contest/contest-tabs.html`
- Register pseudo-tab: dropped the inline green gradient; added
  `.contest-register-tab` which uses `--color-accent`.

### `resources/contest.scss`
- `#banner .contest-countdown`: brand accent gradient card, prominent
  `clamp()`-scaled countdown, muted time window, rounded + shadowed.
- `#banner #details > ul`: tokenized surface card with `fa-check-circle` accent
  bullets for top-level rules and `fa-angle-right` for sub-points (replaces raw
  list markers).
- `.contest-section-head h2`: flex title + accent icon, no inline margins.
- `.contest-problems / -announcements / -clarifications`: consistent
  `--space-6` bottom spacing so sections read as distinct blocks.
- `.contest-register-tab`: accent background + contrast text, themed hover.

All colors/spacing/radii come from design-system tokens, so the page stays in
sync across warm/summer and light/dark.
