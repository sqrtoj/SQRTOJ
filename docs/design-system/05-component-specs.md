# 05 — Component Specifications

Design specs for the highest-traffic components, expressed in terms of the tokens
in `03-design-tokens.md`. Each spec lists the source partial(s), anatomy, states,
and token usage. Specs are implementation guidance, not pixel-exact mandates.

Legend: token names use the CSS custom-property form (`var(--color-surface)`),
which maps to the SCSS/primitive values per theme.

---

## 5.1 Navbar

**Source:** `resources/navbar.scss`, `templates/base.html` (`#navigation`,
`#nav-container`, `#user-links`), `site-logo-fragment.html`.

Today the navbar is a hardcoded green (`#045c20`) with `#231F20` in `base.html`
inline styles and a purple override for impersonation. Unify these under tokens.

- **Background:** `var(--color-navbar-bg)` (brand green primary in both themes).
- **Height:** 48px (unchanged, matches sticky offset in `base.html`).
- **Item text:** `var(--color-navbar-fg)`; uppercase label styling preserved.
- **Active/hover:** `var(--color-navbar-item-hover-bg)` + accent underline.
- **Dropdowns:** surface `var(--color-surface-raised)`, border
  `var(--color-border)`, shadow `var(--shadow-md)`.
- **Impersonation state:** keep the distinct color but source it from a token
  (`var(--color-navbar-impersonate-bg)`) instead of the inline `#893e89`.
- **User avatar:** radius `var(--radius-sm)`, 6px right margin (unchanged).

States: default, hover, active/current-section, focus-visible (2px accent ring),
mobile-collapsed.

---

## 5.2 Buttons

**Source:** `resources/widgets.scss` (button styles), used site-wide.

Define a single button system with variants driven by tokens:

| Variant     | Background                     | Text                          | Border                        |
| ----------- | ------------------------------ | ----------------------------- | ----------------------------- |
| Primary     | `var(--color-accent)`          | `var(--color-on-accent)`      | none                          |
| Secondary   | `var(--color-surface-raised)`  | `var(--color-text)`           | `var(--color-border)`         |
| Danger      | `var(--color-danger)`          | `var(--color-on-accent)`      | none                          |
| Ghost/link  | transparent                    | `var(--color-link)`           | none                          |

- **Radius:** `var(--radius-md)`.
- **Padding:** `var(--space-2) var(--space-4)` (compact: `--space-1 --space-3`).
- **Focus:** visible ring `var(--color-focus-ring)`, never remove outline.
- **Disabled:** reduce opacity via a token, `cursor: not-allowed`.
- **States:** default, hover (darken accent one step), active, focus-visible,
  disabled, loading (optional spinner).

---

## 5.3 Data tables (scoreboard, submissions, problem list)

**Source:** `resources/table.scss`, `status.scss`, `submission.scss`,
`contest.scss`, `problem.scss`.

Tables are the core of a judge; optimize for scannability.

- **Header:** background `var(--color-surface-sunken)`, text
  `var(--color-text-muted)`, weight 600, sticky where the page scrolls long lists.
- **Row height:** comfortable default; provide a compact modifier for dense
  scoreboards (`--space` driven).
- **Zebra striping:** `var(--color-surface)` / `var(--color-surface-alt)`.
- **Row hover:** `var(--color-surface-hover)`.
- **Borders:** horizontal separators `var(--color-border-subtle)`; avoid heavy
  full grids.
- **Numeric columns:** right-aligned, tabular figures (`font-variant-numeric:
  tabular-nums`) so scores/times line up.
- **Rounded header corners:** keep existing `$table_header_rounding` as
  `var(--radius-md)`.
- **Sort indicators:** the existing `▴`/`▾` affordance, colored with
  `var(--color-text-muted)`.

---

## 5.4 Verdict / status badges

**Source:** `resources/status.scss`, `submission.scss`, `jinja2/submission.py`.

Verdicts (AC, WA, TLE, MLE, RTE, CE, IR, etc.) must stay instantly
distinguishable and accessible. Use the semantic verdict tokens from 03, each with
a text/background pair meeting contrast requirements.

- **Shape:** pill, `var(--radius-pill)`, padding `--space-1 --space-2`.
- **Do not rely on color alone:** always pair color with the verdict abbreviation
  text (already the case) — this is the required non-color channel for a11y.
- **Partial score:** gradient/graded background remains, but endpoints come from
  `var(--color-success)` → `var(--color-warning)` tokens.

---

## 5.5 Cards & surfaces

**Source:** new usage across `home.html`, blog, problem/contest detail.

- **Card:** background `var(--color-surface-raised)`, border
  `var(--color-border-subtle)`, radius `var(--radius-lg)`, padding `--space-4`,
  optional `var(--shadow-sm)`.
- **Section headers inside cards:** `var(--color-text)`, weight 600.
- Generalize the blog's already-modern card treatment (`$color_blog_card_bg`) into
  these shared tokens so all features share one card style.

---

## 5.6 Tabs

**Source:** `templates/tabs-base.html`, `resources` tab styles.

- **Container:** bottom border `var(--color-border)`.
- **Tab:** text `var(--color-text-muted)`; active tab text `var(--color-text)`
  with a 2px `var(--color-accent)` underline.
- **Hover:** `var(--color-surface-hover)`.
- **Focus-visible:** accent ring.

---

## 5.7 Forms & inputs

**Source:** `resources/ui_form.css`, `widgets.scss`, `select2-dmoj.scss`,
`martor-description.scss`.

- **Input:** background `var(--color-surface)`, border `var(--color-border)`,
  radius `var(--radius-md)`, text `var(--color-text)`, placeholder
  `var(--color-text-muted)`.
- **Focus:** border `var(--color-accent)` + ring `var(--color-focus-ring)`.
- **Error:** border `var(--color-danger)`, helper text `var(--color-danger)`.
- **Labels:** `var(--color-text)`, weight 500, consistent spacing above input.
- **Select2 / Martor / Ace:** align their chrome (borders, backgrounds) to the same
  tokens so third-party widgets stop looking foreign. Ace editor theme continues to
  follow `Profile.resolved_ace_theme`.

---

## 5.8 Problem statement layout

**Source:** `resources/problem.scss`, `content-description.scss`,
`base-description.scss`, `templates/problem/`.

- **Reading column:** constrain measure (~72ch) for prose; keep sample I/O and
  math full-width where needed.
- **Typography:** body token scale; code blocks use `var(--font-mono)` and
  `var(--color-code-bg)`; math (MathJax) left visually intact.
- **Info sidebar** (time/memory limits, types, points): card treatment with
  `var(--color-surface-raised)` and clear label/value pairing.
- **Sample I/O blocks:** distinct surface `var(--color-surface-sunken)`, copy
  button using the button ghost variant.

---

## 5.9 Pagination

**Source:** pagination partials used by list views.

- **Page item:** `var(--radius-md)`, text `var(--color-link)`.
- **Current page:** background `var(--color-accent)`, text
  `var(--color-on-accent)`.
- **Hover:** `var(--color-surface-hover)`; **disabled:** muted, non-interactive.

---

## 5.10 Alerts / messages

**Source:** `templates/messages.html`, announcement styles in `base.scss`.

Map Django message levels to semantic tokens:

| Level   | Background                  | Text/Icon                   |
| ------- | --------------------------- | --------------------------- |
| info    | `var(--color-info-bg)`      | `var(--color-info-fg)`      |
| success | `var(--color-success-bg)`  | `var(--color-success-fg)`   |
| warning | `var(--color-warning-bg)`  | `var(--color-warning-fg)`   |
| error   | `var(--color-danger-bg)`   | `var(--color-danger-fg)`    |

- Radius `var(--radius-md)`, left accent bar in the level color, icon + text
  (never color-only).
- Keep the existing `#announcement` behavior but source its colors from tokens.

---

## 5.11 Rating & rank colors

**Source:** `resources/ranks.scss`, `judge/ratings.py`, `$color_rating_*`.

Rating tier colors (newbie → grandmaster) are semantic and must not be casually
re-hued — competitive users rely on them. Keep the established hues, but:

- Move them into the token layer as `--color-rating-<tier>` so light/dark each
  tune for contrast (dark already brightens them).
- Verify each tier meets contrast against its background per `07-accessibility.md`.

---

## Component migration checklist

For each component partial touched:

1. Replace hardcoded hex and legacy `$color_*` with `var(--...)` tokens.
2. Apply the spacing/radius scale.
3. Add `:focus-visible` styling.
4. Verify light + dark via `./make_style.sh` and visual check.
5. Verify contrast for text/interactive elements.
6. Keep markup changes minimal; prefer CSS-only where possible.
