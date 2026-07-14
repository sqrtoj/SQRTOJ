# 08 — Autumn Theme ("Warm Harvest")

The **Warm Harvest** autumn theme is a concrete palette + artwork layer that sits
on top of the token architecture in `03-design-tokens.md`. It does not change the
token taxonomy or component specs; it only supplies a warm, seasonal set of
**primitive** values and remaps the **semantic** aliases to them.

The guiding rule: autumn owns the **brand and surface layers** (navbar, buttons,
links, backgrounds, borders, text). It never touches the **protected status
layer** — verdict colors (AC/WA/TLE…) and rating tiers keep their meanings so the
judge stays readable and color-vision-safe.

## 1. Palette identity

Warm Harvest is built around amber gold, pumpkin, and burnt sienna over
warm-neutral (paper) surfaces. Surfaces stay near-white in light mode and deep
warm-charcoal in dark mode so dense tables remain legible; the warmth comes from
accents, borders, and subtle tints, not from saturating the whole page.

| Role                | Light         | Dark          |
| ------------------- | ------------- | ------------- |
| Primary brand       | Burnt sienna  | Pumpkin       |
| Secondary accent    | Amber gold    | Amber gold    |
| Page canvas         | Warm paper    | Warm charcoal |
| Text                | Warm near-black | Warm off-white |

## 2. Primitive palette (Warm Harvest)

These replace the neutral/green/blue primitives from `03-design-tokens.md §2.1`
when the autumn theme is active. Neutrals are intentionally *warm* (hue nudged
toward orange/brown) rather than cool gray.

### 2.1 Warm neutrals (0–1000)

| Primitive        | Value     | Notes                       |
| ---------------- | --------- | --------------------------- |
| `--neutral-0`    | `#ffffff` | pure white (cards, light)   |
| `--neutral-50`   | `#fbf6ef` | warm paper canvas (light)   |
| `--neutral-100`  | `#f4ebdd` | subtle warm surface (light) |
| `--neutral-200`  | `#e4d5c1` | borders (light)             |
| `--neutral-300`  | `#d3bfa4` |                             |
| `--neutral-400`  | `#a8907a` | muted text (light)          |
| `--neutral-500`  | `#8a7360` |                             |
| `--neutral-600`  | `#6e5d4e` | secondary text (light)      |
| `--neutral-700`  | `#4a3b2f` |                             |
| `--neutral-800`  | `#2e241c` | surface (dark)              |
| `--neutral-900`  | `#1a1512` | canvas (dark)               |
| `--neutral-1000` | `#120e0b` | deepest (dark)              |

### 2.2 Sienna (primary accent scale)

| Primitive       | Value     | Notes                        |
| --------------- | --------- | ---------------------------- |
| `--sienna-50`   | `#fbe9df` |                              |
| `--sienna-100`  | `#f6cdb6` |                              |
| `--sienna-300`  | `#e07b39` | pumpkin (bright accent)      |
| `--sienna-500`  | `#c1440e` | burnt sienna (brand)         |
| `--sienna-600`  | `#9e3609` | hover/active                 |
| `--sienna-700`  | `#7a2906` | navbar (light)               |
| `--sienna-800`  | `#551c04` |                              |

### 2.3 Gold (secondary accent scale)

| Primitive     | Value     | Notes                          |
| ------------- | --------- | ------------------------------ |
| `--gold-100`  | `#f7e6bd` |                                |
| `--gold-300`  | `#e9c46a` |                                |
| `--gold-500`  | `#e0a82e` | amber gold (the autumn yellow) |
| `--gold-600`  | `#c08d1e` |                                |

### 2.4 Info hue (teal-shifted)

The generic link/focus/info blue is shifted toward teal so it reads as
intentional against all the warm tones instead of clashing.

| Primitive     | Value     |
| ------------- | --------- |
| `--teal-300`  | `#5fb3c4` |
| `--teal-500`  | `#2c7a8c` |
| `--teal-600`  | `#1f5c6b` |

## 3. Semantic remapping

Same semantic tokens as `03-design-tokens.md §2.2`; only the primitive each one
points at changes for the autumn theme.

| Semantic token            | Role                     | Light → primitive | Dark → primitive |
| ------------------------- | ------------------------ | ----------------- | ---------------- |
| `--color-canvas`          | page background          | `--neutral-50`    | `--neutral-900`  |
| `--color-surface`         | cards, panels            | `--neutral-0`     | `--neutral-800`  |
| `--color-surface-raised`  | popovers, dropdowns      | `--neutral-0`     | `--neutral-700`  |
| `--color-surface-alt`     | zebra rows, subtle panel | `--neutral-100`   | `--neutral-700`  |
| `--color-border`          | default borders          | `--neutral-200`   | `--neutral-700`  |
| `--color-border-strong`   | emphasized borders       | `--neutral-300`   | `--neutral-600`  |
| `--color-text`            | primary text             | `--neutral-800`   | `--neutral-100`  |
| `--color-text-secondary`  | secondary text           | `--neutral-600`   | `--neutral-400`  |
| `--color-text-muted`      | hints, metadata          | `--neutral-400`   | `--neutral-500`  |
| `--color-text-inverse`    | text on accent bars      | `--neutral-0`     | `--neutral-0`    |
| `--color-accent`          | brand/action             | `--sienna-500`    | `--sienna-300`   |
| `--color-accent-hover`    | brand hover              | `--sienna-600`    | `--sienna-100`   |
| `--color-accent-contrast` | text/icon on accent      | `--neutral-0`     | `--neutral-1000` |
| `--color-accent-2`        | secondary accent (gold)  | `--gold-500`      | `--gold-300`     |
| `--color-navbar`          | top navigation bar       | `--sienna-700`    | `--neutral-1000` |
| `--color-link`            | link default             | `--teal-600`      | `--teal-300`     |
| `--color-link-hover`      | link hover               | `--sienna-500`    | `--gold-300`     |
| `--color-focus-ring`      | focus outline            | `--teal-500`      | `--teal-300`     |

Notes:
- `--color-accent-2` (gold) is a new semantic alias for the secondary accent used
  by badges, highlights, and hover glows. Add it to `03-design-tokens.md §2.2` when
  implemented.
- Link default is teal (not warm) so links stay distinguishable from the sienna
  brand actions; link **hover** warms toward sienna/gold for cohesion.

## 4. Protected layers (unchanged)

These are **not** recolored by the autumn theme. They keep the values in
`03-design-tokens.md`:

- **Verdict tokens** (`--verdict-ac`, `--verdict-wa`, …): AC stays green, WA stays
  red, TLE/MLE stay amber/blue. Warm-neutral surfaces keep them legible.
- **Rating tokens** (`--rating-newbie` … `--rating-grandmaster`): unchanged for
  cross-site recognizability.
- **Status semantics** (`--color-success-*`, `--color-danger-*`, etc.): success
  stays green, danger stays red. Only `--color-info-*` shifts to the teal family to
  fit the palette.

If a warm accent ever collides with a status color in context (e.g. gold badge next
to a warning), the status color wins and the accent is swapped for a neutral.

## 5. Artwork asset manifest

All decorative art is optional enhancement: pages MUST remain fully usable if an
asset fails to load. Store assets under `resources/autumn/`. Decorative art placed
behind text MUST be low-contrast/desaturated so it never threatens the WCAG AA
requirements in `07-accessibility.md`.

| ID   | Asset                     | Format         | Sizes / variants                 | Where used                          | Priority |
| ---- | ------------------------- | -------------- | -------------------------------- | ----------------------------------- | -------- |
| A-1  | Homepage hero banner      | WebP + PNG     | 2× retina; light + dark variants | `templates/home.html` header        | High     |
| A-2  | Logo / wordmark (seasonal)| SVG            | light + dark                     | `templates/site-logo-fragment.html` | High     |
| A-3  | Seamless leaf/paper tile  | WebP           | tileable; light + dark           | `resources/base.scss` body bg       | High     |
| A-4  | Empty-state illustrations | SVG            | one per state                    | list empty states, `error.html`     | Medium   |
| A-5  | Error page art (404/500)  | SVG or PNG     | light + dark                     | `error.html`, `502.html`            | Medium   |
| A-6  | Rank/badge icons          | SVG            | one per rank tier                | `resources/ranks.scss` consumers    | Medium   |
| A-7  | Section divider (vine)    | SVG            | horizontal                       | `<hr>` / section separators         | Low      |
| A-8  | Falling-leaves effect     | CSS/JS + SVG   | reduced-motion aware; homepage   | `templates/home.html`               | Low      |
| A-9  | Favicon / touch icons     | ICO + PNG set  | full favicon set (see base.html) | site-wide `<head>`                  | Low      |
| A-10 | OG / social share image   | PNG            | 1200×630                         | default `og:image` in `base.html`   | Low      |

### Artwork guidelines

- **Vector first.** Logo, icons, dividers, and empty states as SVG — small,
  crisp, and themeable via `currentColor` where practical.
- **Raster where needed.** Hero and textures as WebP with a PNG fallback, at 2×.
- **Two variants.** Any art with baked-in colors needs a light and a dark version;
  reference them the way `base.scss` already branches on `$is_light_theme`.
- **Keep it behind, not on top.** Backgrounds sit under content at low opacity;
  never reduce text contrast below AA.
- **Palette-locked.** Use the Warm Harvest primitives above so art matches the UI.

### A-8 falling leaves — constraints

- Homepage only; never on contest, submission, or problem-solving pages.
- MUST be disabled under `prefers-reduced-motion: reduce`.
- MUST be lightweight (CSS transforms / a small canvas) and pause when the tab is
  hidden; it is decorative and MUST NOT block interaction or input.

## 6. Implementation notes

- This theme is a **palette swap**, so it plugs into Phase 0/1 of
  `06-implementation-roadmap.md`: define the Warm Harvest primitives, point the
  semantic aliases at them, and both light and dark modes follow automatically.
- Because theming is driven by `Profile.site_theme` + `DMOJ_THEME_CSS`
  (`04-technical-design.md`), Warm Harvest can ship as the default palette for both
  the light and dark stylesheets without new plumbing.
- The `--color-accent-2` (gold) and `--color-surface-alt` aliases are the only new
  tokens introduced here; fold them into `03-design-tokens.md` when implemented.
- Verify every remapped semantic pair against `07-accessibility.md` before shipping;
  warm low-contrast neutrals are the highest-risk area for AA text contrast.
