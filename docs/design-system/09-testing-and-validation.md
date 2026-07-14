# 09 — Testing & Validation

The gates every UI change MUST clear before it ships, and the manual QA checklist
for each roadmap phase (`06-implementation-roadmap.md`). Requirements use
`MUST` / `SHOULD` per RFC 2119. These steps mirror the CI jobs in
`.github/workflows/build.yml` (`lint`, `unit`, `styles`) so what passes locally
passes in CI.

Quick reference — which gate applies to which change:

| You touched…                        | Gates that MUST pass                                  |
| ----------------------------------- | ----------------------------------------------------- |
| SCSS / CSS in `resources/`          | 1 (style build), 5 (visual QA), 6 (contrast), 7 (browsers) |
| Python (theme resolution, context)  | 2 (flake8), 3 (Django tests)                          |
| Templates / template context        | 3 (Django tests), 5 (visual QA)                       |
| Websocket JS (`websocket/`)         | 4 (prettier)                                          |

---

## 1. Style build gate (`./make_style.sh`)

Every frontend change MUST build **both** themes cleanly.

```sh
npm ci            # installs pinned postcss / sass / autoprefixer (devDependencies)
./make_style.sh   # builds default (light) then dark
```

- `make_style.sh` first runs `scripts/check-package-installed.js postcss sass
  autoprefixer`; if `npm ci` was skipped it aborts. Run `npm ci` (not `npm
  install`) so versions match the lockfile and CI.
- It compiles twice: `vars-default.scss` → `resources/style.css`, then
  `vars-dark.scss` → `resources/dark/style.css`, each post-processed by
  `autoprefixer`. Both MUST complete with no `sass`/`postcss` errors.
- Because both themes share one token layer, confirm the change compiled into
  **both** outputs, not just light.
- The CI `styles` job runs exactly `npm ci` then `./make_style.sh`; a red build
  here is a red PR.

Exit: both stylesheets build with no errors or unexpected warnings.

---

## 2. Python lint (`flake8`)

Any Python touched (theme resolution, `judge/template_context.py`, context
processors) MUST pass `flake8`.

```sh
flake8
```

- Config is in `.flake8`: `max-line-length = 120`, `pycharm` import order,
  `flake8-import-order` / `flake8-future-import` / `flake8-commas` /
  `flake8-logging-format` / `flake8-quotes` extensions (install these to match
  CI; see the `lint` job).
- `dmoj/local_settings.py`, `dmoj/local_urls.py`, `.ci.settings.py`, and `fc_*`
  are excluded; migrations ignore `E501`. Do not add per-file ignores to dodge a
  real violation.

Exit: `flake8` reports no findings.

---

## 3. Django tests (`python manage.py test judge`)

Run when Python or template **context** changes (a new context variable, a
changed `site_theme` resolution, anything that alters what templates receive).
Pure SCSS changes do not require this gate.

```sh
python manage.py compilejsi18n
python manage.py test judge
```

- `compilejsi18n` MUST run first — the JS i18n catalog is a prerequisite the CI
  `unit` job collects before testing.
- Tests need a **MySQL** database. CI uses `mysql:8.0` with database `dmoj`
  (see the `unit` job service block) and copies `.ci.settings.py` to
  `dmoj/local_settings.py`. Locally, point `dmoj/local_settings.py` at a MySQL
  instance with an empty test database before running.
- If MySQL is unavailable locally, say so in the PR and rely on CI, but do not
  claim the suite passed without running it.

Exit: `test judge` passes; `compilejsi18n` succeeded first.

---

## 4. Websocket JS format check (`npm run format:check`)

Only if websocket JS under `websocket/` is touched.

```sh
npm run format:check   # prettier --check websocket
```

Fix with `npm run format` (`prettier --write websocket`). This gate does not
apply to SCSS-only or template-only changes.

Exit: prettier reports no formatting differences.

---

## 5. Per-phase manual visual QA checklist

Automated gates do not catch layout regressions or theme mismatches. For each
roadmap phase, walk the surfaces it touched in **both light and dark** (use the
`data-theme` switch / `site_theme`, and test `auto` against
`prefers-color-scheme`). Confirm no hardcoded hex leaked through, spacing/radius
come from tokens, and nothing regressed against the current look.

| Surface            | What to check (light **and** dark)                                              |
| ------------------ | ------------------------------------------------------------------------------- |
| Navbar             | Brand background from token; hover/active; dropdowns; focus-visible ring visible on the bar; **impersonation bar** still distinct; mobile-collapsed. |
| Buttons            | All variants (primary/secondary/danger/ghost); hover/active/disabled; focus ring. |
| Tables             | Header, zebra (`--color-surface-alt`), row hover, borders, tabular numerics.    |
| Problem list       | Table + filters + pagination; verdict/points cells; empty state.                |
| Problem statement  | Reading column width, info sidebar card, sample I/O blocks, code + MathJax intact. |
| Submission list    | Verdict badges legible (all verdicts incl. partial/queued), dense rows, filters. |
| Scoreboard         | Compact/sticky header, tabular numerics, rating colors, long-name wrapping.     |
| Profile            | Rating tier colors, activity heatmap levels, cards.                             |
| Forms              | Inputs, labels, focus, error state; Select2/Martor/Ace chrome matches tokens.   |
| Alerts / messages  | info/success/warning/error map to the right tokens; icon + text (never color-only). |

Also verify longer translated strings (e.g. Vietnamese) do not clip (NFR-5.2),
and that the gold `--color-accent-2` is never used for small body text
(decoration / large-text / non-text-UI only — see §6 and `07-accessibility.md`).

Exit: every touched surface reviewed in both themes with no regression.

---

## 6. Contrast verification

Before closing a phase, verify text/background pairings meet WCAG AA per
`07-accessibility.md §1` and its contrast-verification table:

- Semantic pairings (text on canvas/surface, links, accent-contrast, gold) —
  use the computed table in `07-accessibility.md`.
- Verdict badge label vs. its badge background — targets **≥ 4.5:1** in both
  themes; values are specified in `03-design-tokens.md §2.3`.
- Any pair that fails MUST be fixed at the token level (`03-design-tokens.md`),
  not patched per component.
- **Gold (`#e0a82e`) is decoration / large-text / non-text-UI only** — it fails
  AA as small text on paper/white and MUST NOT be used for body text.

Record findings in the phase PR (mirrors `07-accessibility.md §7`).

Exit: no AA failure among the pairings the phase introduced or changed.

---

## 7. Cross-browser check (`.browserslistrc`)

`make_style.sh` runs `autoprefixer` against `.browserslistrc` (current coverage
target ~97% of browsers). Before closing a phase:

- Spot-check the phase's surfaces on the browser families in `.browserslistrc`
  (evergreen Chromium, Firefox, Safari/WebKit; check the resolved list with
  `npx browserslist`).
- Confirm CSS custom properties, `:focus-visible`, and `prefers-color-scheme`
  behave across them (all are within the target range; no polyfill is added by
  this initiative).
- Do not add vendor-prefixed CSS by hand — let `autoprefixer` handle it so the
  `.browserslistrc` stays the single source of truth.

Exit: no layout or token-resolution breakage across the target browsers.

---

## 8. Definition of done (validation)

A change is validation-complete when every gate that applies to it (per the quick
reference above) passes, the visual QA checklist is clear in both themes, contrast
is verified per `07-accessibility.md`, and results are recorded in the PR. Any AA
failure or a red CI job is a blocker.
