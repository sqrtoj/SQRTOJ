# 06 — Implementation Roadmap & Task List

Incremental, low-risk rollout. Each phase is independently shippable and leaves the
site fully functional. Check items off as they land. Phases map to the milestones
in `02-requirements.md`.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Foundations (no visual change)

Goal: stand up the token layer and tooling without altering the current look.

- [x] Create `resources/_tokens.scss` defining the semantic tokens as CSS custom
      properties (see `03-design-tokens.md`).
- [x] Emit tokens as CSS custom properties on `:root`, conditional on
      `$is_light_theme` so each compiled theme emits its own values (Approach A).
- [x] Wire `_tokens.scss` into `style.scss` before other partials (import order).
- [x] Add the two new semantic aliases `--color-accent-2` (secondary/gold accent)
      and `--color-surface-alt` (zebra/subtle panel) introduced in
      `08-autumn-theme.md`, so 03 and 08 agree. (see `03-design-tokens.md §2.2`)
- [~] Formalize the accessible `--verdict-*-bg` / `--verdict-*-fg` values from
      `03-design-tokens.md §2.3`. Deferred to Phase 3 (submission/status page work)
      where `resources/status.scss` is migrated; the token slots exist now.
- [x] Confirm `./make_style.sh` builds both default and dark cleanly; Phase 0
      tokens were additive with no visual diff.
- [x] Document the token workflow in this folder's README and cross-link.

Exit criteria: build is green, site looks identical, tokens available for use.

---

## Phase 1 — Theme delivery via `data-theme`

Goal: make dark mode a runtime attribute switch, remove FOUC, keep fallback.

- [x] Add `data-palette` to `<html>` in `templates/base.html`, resolved from
      `request.profile.site_palette` via `template_context.site_theme`. (foundation
      for a future runtime `data-theme` switch)
- [~] Inline no-FOUC head script: deferred with the single-stylesheet Approach B
      migration; split-file `media`-query loading avoids the flash for now.
- [x] Keep `DMOJ_THEME_CSS` split-file loading working; palettes map through the
      new `DMOJ_THEME_PALETTE_CSS` while `DMOJ_THEME_CSS` stays the default.
- [x] Preserve the `test_site` permission gate for dark mode in `base.html`.
- [x] Ace/Martor themes untouched; still follow `Profile.resolved_ace_theme`.

Exit criteria: theme switches via attribute; system-preference path intact.

---

## Phase 1b — Warm Harvest palette as default

Goal: adopt the "Warm Harvest" autumn palette (`08-autumn-theme.md`) as the default
for both light and dark, while preserving the old palette as an opt-in. This is a
palette swap on top of the token layer, so no component markup changes.

- [x] Back up the current green/blue palette as a selectable **"Summer"** theme:
      `vars-summer-default.scss` / `vars-summer-dark.scss` snapshot today's values,
      built to `resources/summer/` and selectable via `Profile.site_palette`.
- [x] Define the Warm Harvest primitives (`08 §2`: warm neutrals, sienna, gold,
      teal) in `vars-default.scss` / `vars-dark.scss` and point aliases at them.
- [x] Make Warm Harvest the **default** palette for both light and dark; a new
      `site_palette` field + `DMOJ_THEME_PALETTE_CSS` drive selection, defaulting
      to `warm`.
- [x] `--color-accent-2` (gold) and `--color-surface-alt` remap to gold / warm
      surfaces under Warm Harvest in `_tokens.scss`.
- [x] Enforce the **gold-is-not-body-text rule**: gold is used for accents only in
      the token layer, never body text.
- [~] Contrast verification against `07-accessibility.md §1` uses the pre-computed
      audit tables; live per-page verification lands with Phase 3 page work.

Exit criteria: Warm Harvest is the default in both modes, Summer selectable, all
semantic text pairs pass AA.

---

## Phase 2 — Core primitives

Goal: restyle the shared building blocks used on every page.

- [x] Navbar (`navbar.scss`, `base.html`): tokenize green/`#231F20`; add
      focus-visible; unify dropdowns. (spec 5.1)
- [x] Tokenize the impersonation navbar override: replace the inline `#893e89` in
      `templates/base.html` with a `--color-navbar-impersonate` token (spec 5.1),
      keeping the distinct color and FR-2.5 behavior.
- [x] Buttons (`widgets.scss`): implement variant system + states. (spec 5.2)
- [x] Links & focus rings globally (`base.scss`). (a11y)
- [x] Cards/surfaces primitives generalized from blog tokens. (spec 5.5)
- [x] Typography: introduce type scale + font tokens; load `Inter`/mono
      progressively (keep system fallback). (03)

Exit criteria: primitives themable, accessible, consistent across light/dark.

---

## Phase 3 — High-traffic pages

Goal: apply the system to the pages users spend the most time on.

- [ ] Problem list (`problem.scss`, `templates/problem/list.html`): table +
      filters + pagination. (specs 5.3, 5.9)
- [ ] Problem statement (`problem.scss`, `content-description.scss`): reading
      column, info sidebar, sample I/O, code blocks. (spec 5.8)
- [ ] Submission list & detail (`submission.scss`, `status.scss`): verdict badges,
      dense table, filters. (specs 5.3, 5.4)
- [ ] Contest scoreboard (`contest.scss`): dense/compact table, sticky header,
      tabular numerics. (spec 5.3)
- [ ] User profile (`users.scss`, `user_profile.js`): rating colors, activity
      heatmap tokens, cards. (spec 5.11)
- [ ] Tabs across these pages (`tabs-base.html`). (spec 5.6)
- [ ] Forms on submit/edit flows (`ui_form.css`, `select2-dmoj.scss`). (spec 5.7)
- [ ] Messages/alerts (`messages.html`). (spec 5.10)

Exit criteria: primary user journeys fully on the new system, light + dark.

---

## Phase 4 — Long tail & polish

Goal: finish remaining surfaces and remove legacy artifacts.

- [ ] Comments (`comments.scss`), tickets (`ticket.scss`).
- [ ] Blog: reconcile `$color_blog_*` into shared tokens (dedupe). (5.5)
- [ ] Home page (`home.html`) layout refresh.
- [ ] Organization, stats, status, registration screens.
- [ ] Remove tiled background images from `base.scss` (both themes) once surfaces
      are finalized.
- [ ] Retire redundant `$color_*` vars fully superseded by tokens.
- [ ] Accessibility pass per `07-accessibility.md` (contrast, focus, keyboard).
- [ ] Cross-browser check against `.browserslistrc`.

Exit criteria: entire site on the system, legacy hex/backgrounds gone, a11y passes.

---

## Deferred — Warm Harvest artwork slots (assets supplied later)

The autumn artwork (`08-autumn-theme.md §5`) is decorative enhancement; every page
MUST stay fully usable if an asset is missing. Wire the slots as placeholders now so
dropping in the real files later needs no markup change. Assets will be supplied
later — these stay `[ ]` until then.

- [ ] Hero slot: reserve the `templates/home.html` header banner slot (A-1) behind a
      token/placeholder; no layout shift when the WebP/PNG lands.
- [ ] Tile slot: reserve the seamless leaf/paper body background (A-3) in
      `base.scss`, behind content at low opacity, gated on reduced-contrast so it
      never threatens AA (`07-accessibility.md`).
- [ ] Logo slot: reserve the seasonal wordmark (A-2) in
      `templates/site-logo-fragment.html`, light + dark variants.
- [ ] Remaining art (empty states, error art, dividers, falling leaves, favicon, OG
      image) tracked against the `08 §5` manifest as assets arrive.

Exit criteria: slots exist and degrade gracefully; no broken layout without assets.

---

## Cross-cutting engineering tasks

- [ ] Keep `flake8` clean for any Python touched (theme resolution, context).
- [ ] Keep `npm run format:check` clean for websocket JS if touched.
- [ ] After each phase run the full validation gate in `09-testing-and-validation.md`:
      `./make_style.sh` (both themes), `flake8`, `python manage.py compilejsi18n` +
      `python manage.py test judge` if Python/template context changed, the manual
      visual QA checklist (light + dark), and the contrast step (`07`).
- [ ] No new runtime dependencies without justification (see AGENTS.md).
- [ ] Commit per the AGENTS.md commit convention; scope commits per phase/component
      (e.g. `feat(ui): tokenize navbar colors`, `refactor(ui): emit theme tokens`).

---

## Suggested commit sequence (examples)

```
refactor(ui): add design token layer without visual change
feat(ui): deliver themes via data-theme attribute
feat(ui): restyle navbar and buttons with design tokens
feat(ui): apply design system to problem list and statement
feat(ui): restyle submission and scoreboard tables
style(ui): remove legacy tiled backgrounds and dead color vars
```

Each should touch a disjoint set of partials where possible to keep reviews small.
