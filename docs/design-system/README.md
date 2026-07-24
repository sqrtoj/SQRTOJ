# SQRTOJ Modern Competitive-Programming Design System

This directory contains the specification, requirements, technical design, and
task breakdown for the **Modern Competitive-Programming (MCP)** UI overhaul of
SQRTOJ.

The goal is a clean, content-dense, token-driven flat design that keeps the
information density a judge needs (scoreboards, submission tables, verdicts,
problem lists) while modernizing the look, unifying the color system, and making
dark mode a first-class, instantly switchable feature.

## Reading order

| # | Document | What it covers |
|---|----------|----------------|
| 1 | [`01-vision-and-principles.md`](01-vision-and-principles.md) | The design philosophy, target users, and the principles every decision is measured against. |
| 2 | [`02-requirements.md`](02-requirements.md) | Functional and non-functional requirements, scope, and acceptance criteria. |
| 3 | [`03-design-tokens.md`](03-design-tokens.md) | The token layer: color scales, typography, spacing, radius, elevation, motion. The single source of visual truth. |
| 4 | [`04-technical-design.md`](04-technical-design.md) | How the system is implemented in the existing SCSS + `django_jinja` + `django_compressor` pipeline, theming architecture, and migration strategy. |
| 5 | [`05-component-specs.md`](05-component-specs.md) | Per-component visual and behavioral specs (navbar, buttons, tables, badges, forms, etc.). |
| 6 | [`06-implementation-roadmap.md`](06-implementation-roadmap.md) | Phased, checkbox task list with dependencies and estimates. |
| 7 | [`07-accessibility.md`](07-accessibility.md) | Contrast, focus, motion, and semantics requirements plus a verification checklist. |
| 8 | [`08-autumn-theme.md`](08-autumn-theme.md) | The "Warm Harvest" autumn palette (light + dark) mapped onto the token layer, plus the custom artwork asset manifest. |
| 9 | [`09-testing-and-validation.md`](09-testing-and-validation.md) | The build/lint/test gates and the per-phase manual visual QA, contrast, and cross-browser checklists that must pass before a phase ships. |
| 10 | [`10-modern-ui-overhaul.md`](10-modern-ui-overhaul.md) | Page-level modern redesign spec: home hero, auth pages, flatpage (shop/about) cards, and the judge status page as cards. |

## Current state (baseline)

Grounded in the repository as of this writing:

- **Styles** live in `resources/*.scss`, aggregated by `resources/style.scss`, and
  built into `style.css` (light) and `dark/style.css` (dark) by `make_style.sh`.
- **Theme values** are duplicated across `resources/vars-default.scss` (light) and
  `resources/vars-dark.scss` (dark), with shared tokens in
  `resources/vars-common.scss`. Both `@forward "vars-common"`.
- **Theme selection** is driven by `Profile.site_theme` (`auto` / `light` / `dark`,
  see `judge/models/choices.py`), surfaced to templates by
  `judge.template_context.site_theme`, and mapped to files via
  `DMOJ_THEME_CSS` in `dmoj/settings.py`. `templates/base.html` links the light
  and/or dark stylesheet, currently gated behind the `judge.test_site` permission.
- **Brand color** is a hardcoded green (`#045c20`) in `resources/navbar.scss`; the
  navigation bar background is set inline in `templates/base.html` (`#231F20`).
- **Link palette** is a separate blue scale, unrelated to the green brand color.
- **Typography** relies on system fonts (`Segoe UI`, `Lucida Grande`, `Arial`) with
  `Source Sans Pro` for the navbar; monospace uses a long fallback stack in
  `resources/vars-common.scss`.
- **Blog** already has a modern, well-considered token set (`$color_blog_*` in the
  `vars-*.scss` files) that is siloed to that feature. The MCP system generalizes
  that direction to the whole site.

## Non-goals

- No markup rewrite of every template in one pass. The rollout is incremental and
  ships value at each phase.
- No new frontend framework (no React/Vue/build-tool swap). We stay on
  server-rendered templates + SCSS + `django_compressor`.
- No change to the judging, contest, or submission *logic*. This is presentation
  only.
- No visual trend that harms readability (glassmorphism, neumorphism) — see
  `01-vision-and-principles.md`.

## How to contribute to this effort

Follow the conventions in the repository root `AGENTS.md`: match existing
DMOJ/VNOJ patterns, keep changes minimal and focused, run `flake8` for Python and
`npm run format:check` for websocket JS, and build styles with `./make_style.sh`
before finishing frontend work.
