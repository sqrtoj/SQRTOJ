# 02 — Requirements

Requirements use `MUST` / `SHOULD` / `MAY` per RFC 2119. Each has a stable ID so
tasks (`06-implementation-roadmap.md`) and tests can reference it.

## 1. Functional requirements

### FR-1 — Design token layer
- **FR-1.1** The system MUST expose a single set of design tokens (color, spacing,
  radius, elevation, typography, motion) as the source of truth for all styling.
- **FR-1.2** Tokens MUST be emitted as CSS custom properties on a root scope so they
  are available to every stylesheet and to runtime.
- **FR-1.3** Every token MUST have a value in both the light and dark themes.
- **FR-1.4** Component and page styles MUST reference tokens rather than literal
  color/spacing values, except for values that are intrinsically fixed (e.g. `0`,
  `100%`, `1px` hairlines where a token is not meaningful).

### FR-2 — Theming
- **FR-2.1** The site MUST support at least three theme modes, preserving the
  existing `SITE_THEMES` choices: `auto` (follow system), `light`, and `dark`.
- **FR-2.2** `auto` MUST resolve via `prefers-color-scheme` without a server round
  trip.
- **FR-2.3** A logged-in user's saved `site_theme` MUST take precedence over the
  system preference, matching current behavior.
- **FR-2.4** Theme resolution MUST NOT cause a flash of the wrong theme (FOUC/FOWT)
  on first paint.
- **FR-2.5** The impersonation navbar override (purple bar) MUST continue to work.

### FR-3 — Core primitives
The following primitives MUST be redesigned against the token layer and documented
in `05-component-specs.md`: color/link styles, buttons, form controls, cards,
tables, badges/pills (including verdict and rating variants), tabs, pagination,
alerts/messages, and the navbar.

### FR-4 — High-traffic pages
The following pages MUST be restyled using only the new primitives and tokens:
home, problem list, problem statement, submission list, submission detail, contest
list, scoreboard/ranking, and user profile.

### FR-5 — Verdict and rating semantics
- **FR-5.1** Submission verdicts (AC, WA, TLE, MLE, RTE, CE, IR, etc.) MUST have a
  dedicated, consistent visual treatment derived from tokens.
- **FR-5.2** Rating tiers MUST map to named tokens (newbie … grandmaster) rather
  than scattered literals.
- **FR-5.3** Where color conveys meaning (verdict, rating, contest status), a
  non-color cue (label, icon, or shape) MUST also be present.

### FR-6 — Typography
- **FR-6.1** The system MUST define a UI font stack, a monospace stack (for code),
  and a documented type scale (sizes + line-heights).
- **FR-6.2** Web fonts, if used, MUST load progressively (system font first, no
  render-blocking) and MUST NOT break math (MathJax) or code highlighting layout.

## 2. Non-functional requirements

### NFR-1 — Accessibility
- **NFR-1.1** Body text and meaningful UI text MUST meet WCAG 2.1 AA contrast
  (≥ 4.5:1; ≥ 3:1 for large text) in both themes.
- **NFR-1.2** All interactive elements MUST have a visible, token-defined focus
  indicator.
- **NFR-1.3** Motion MUST respect `prefers-reduced-motion: reduce`.
- **NFR-1.4** Interactive controls MUST preserve semantic HTML and keyboard
  operability; restyling MUST NOT remove focusability or semantics.

### NFR-2 — Performance
- **NFR-2.1** The redesign MUST NOT introduce render-blocking resources beyond what
  exists today; the token layer adds no extra network request (it ships inside the
  existing compressed CSS bundle).
- **NFR-2.2** Compiled CSS size growth SHOULD stay modest; net additions beyond a
  small budget SHOULD be justified in the phase that introduces them.
- **NFR-2.3** Theme switching MUST NOT require re-downloading a separate full
  stylesheet per theme once the token model is adopted (long-term target;
  see `04-technical-design.md` for the migration path).

### NFR-3 — Compatibility
- **NFR-3.1** The build MUST continue to work through `./make_style.sh`
  (`sass` + `postcss`/autoprefixer) and honor `.browserslistrc`.
- **NFR-3.2** Both `style.css` (light/default) and `dark/style.css` MUST continue to
  be produced so `DMOJ_THEME_CSS` mappings remain valid during migration.
- **NFR-3.3** Changes MUST NOT break `django-compressor` CSS/JS compression in
  `base.html`.

### NFR-4 — Maintainability
- **NFR-4.1** Token and component definitions MUST live in clearly named partials
  with a documented import order.
- **NFR-4.2** New styles MUST follow existing SCSS conventions in `resources/` and
  pass the project's frontend checks.
- **NFR-4.3** The documentation set MUST be kept in sync when tokens or component
  contracts change.

### NFR-5 — Internationalization
- **NFR-5.1** All new user-facing strings introduced by UI work MUST be wrapped for
  translation (`gettext_lazy as _`).
- **NFR-5.2** Layouts MUST tolerate longer translated strings (e.g. Vietnamese)
  without breaking (no fixed-width text containers that clip).

## 3. Constraints

- **C-1** Django 3.2 templates with `django_jinja`; no frontend framework is being
  introduced.
- **C-2** SCSS compiled by `sass`, post-processed by `postcss`/autoprefixer; this
  pipeline stays.
- **C-3** Theme selection persists on `Profile.site_theme` with values from
  `SITE_THEMES`; the data model for theming is not being changed by the UI work
  itself (any change requires a migration and is called out explicitly).
- **C-4** `dmoj/local_settings.py` is user-owned and git-ignored; defaults live in
  `dmoj/settings.py`.
- **C-5** Vendored widgets (`martor/`, `django_ace/`) and third-party CSS
  (select2, fontawesome) are integrated but not rewritten; the system themes them
  via tokens where feasible.

## 4. Out of scope (for this initiative)

- Rewriting JavaScript behavior or introducing a SPA/framework.
- Changing backend data models, APIs, or business logic.
- Redesigning the Django admin (`wpadmin`) internals beyond token-level theming.
- Content/IA changes (which pages exist, navigation structure) beyond visual
  restyling.
- Replacing MathJax, Ace, Pygments, or select2.

## 5. Assumptions

- The existing `test_site` permission gate for experimental theming can be used to
  roll out the new system to staff before general release.
- `prefers-color-scheme` support in target browsers (per `.browserslistrc`) is
  sufficient for `auto` mode.
- Design decisions can be validated on the live-representative templates already in
  `templates/` without new fixtures.

## 6. Acceptance criteria (initiative-level)

The initiative is accepted when:

1. All `MUST` functional requirements (FR) are implemented for the primitives
   (FR-3) and high-traffic pages (FR-4).
2. All `MUST` non-functional requirements (NFR) are verified per
   `07-accessibility.md` and the gates in `09-testing-and-validation.md`.
3. `./make_style.sh` builds both themes cleanly and `python manage.py test judge`
   passes (see `09-testing-and-validation.md`).
4. The documentation set reflects the shipped tokens and components.
