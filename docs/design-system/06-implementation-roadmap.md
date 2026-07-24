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

- [x] Problem list (`problem.scss`): table + filters + pagination. (specs 5.3, 5.9)
- [x] Problem statement (`problem.scss`, `content-description.scss`): info sidebar,
      status colors, code blocks. (spec 5.8)
- [x] Submission list & detail (`submission.scss`, `status.scss`): verdict badges
      as solid-fill tokens, dense table, tabular numerics. (specs 5.3, 5.4)
- [x] Contest scoreboard (`contest.scss`): tokenized table, tabular numerics,
      right-aligned rank/points. (spec 5.3)
- [x] User profile (`users.scss`): rating tokens, card borders; heatmap left
      protected. (spec 5.11)
- [x] Tabs (`widgets.scss` `.tabs`): active underline + muted/active states. (5.6)
- [x] Forms on submit/edit flows (`ui_form.css`, `select2-dmoj.scss`,
      `widgets.scss` inputs). (spec 5.7)
- [x] Messages/alerts (`widgets.scss` `.alert*`): semantic tokens + accent bar.
      (spec 5.10)
- [x] Data-table primitive (`table.scss`): tokenized header/borders, tabular-nums.

Exit criteria: primary user journeys fully on the new system, light + dark.
Note: deeper markup/layout work (sample-I/O copy button, reading-measure column,
sticky scoreboard header) is deferred to Phase 4 as CSS-only follow-ups.

---

## Phase 4 — Long tail & polish

Goal: finish remaining surfaces and remove legacy artifacts.

- [x] Comments (`comments.scss`), tickets (`ticket.scss`): tokenized colors,
      borders, radii; focus-visible on interactive controls.
- [x] Blog: `blog.scss` migrated to shared link/border/surface tokens. (5.5)
- [x] Home page (`home.html`): hero artwork slot reserved (A-1); sidebox cards get
      token surface + radius + subtle elevation; contest-list titles match the brand
      heading color.
- [x] Retire redundant `$color_*` vars: migrated unambiguous border/surface/muted-text
      refs in the main-bundle partials to tokens. Aligned the Summer palette tokens to
      its classic legacy values first, verified both Summer builds keep their classic
      look (green count unchanged). Left as legacy by design: `rgba($color_*, ...)`
      calls (Sass needs a compile-time color), `$color_primary75` (palette-brand/widget
      color with no single semantic token), `$color_pageBg`/`$highlight_blue`/
      `$announcement_red` (protected vars), and the standalone-compiled
      `martor-description`/`ace-dmoj` files (no `:root` token layer).
- [x] Organization, stats, registration screens: no dedicated SCSS — inherit the
      already-tokenized shared components (tables, buttons, cards, forms). `misc.scss`
      tokenized.
- [x] Web fonts loaded: `Inter` (UI) + `JetBrains Mono` (code) via `font-display:
      swap`, prepended to the token stacks so type actually changes.
- [x] Warm Harvest uses a flat themed canvas (tiled photos already replaced in
      Phase 1 via `$flat_background`); Summer keeps its classic photos.
- [~] Accessibility: focus-visible + contrast-checked tokens applied; full manual
      AT pass still recommended per `07-accessibility.md`.
- [~] `status`/`task_status.css`: `status.scss` verdicts done (Phase 3);
      `task_status.css` left as a self-contained utility page.

Exit criteria: entire site on the system, legacy hex/backgrounds gone, a11y passes.

---

## Phase 5 — Visible modernization pass

Goal: move beyond "recolored" to a genuinely more modern, contemporary feel,
focusing on layout, depth, motion, and interaction polish. All token-driven and
applied to both palettes; verified no Summer drift.

- [x] Navbar: pill-style hover/active states, rounded dropdowns with soft shadow,
      smooth transitions, refined nav shadow.
- [x] Buttons: subtle hover-lift + shadow for depth (motion-guarded).
- [x] Inputs: larger padding, medium radius, soft focus-ring glow
      (`--color-focus-ring-soft` token added per palette).
- [x] Tables: rounded outer corners, softer header, animated row hover, lighter
      internal borders.
- [x] `#page-container` / `.title`: stronger heading hierarchy, contemporary
      elevation.
- [x] Global `prefers-reduced-motion` guard added (`base.scss`) for a11y.
- [x] Code blocks / problem info sidebar: card treatment (fallback-token pattern so
      the standalone martor build degrades gracefully).
- [x] User avatar, tabs, pagination, submission list, comment cards: modern radius,
      hover, and elevation polish.

Exit criteria: cohesive modern appearance across high-traffic pages, both palettes,
both themes; `prefers-reduced-motion` respected; no Summer regression.

---

## Phase 6 — Modern UI overhaul (page-level redesign)

Spec: `10-modern-ui-overhaul.md`. Page-level layout redesigns beyond tokenization.

- [x] 6a Foundations: layout tokens (`--container-max/-wide`, `--section-gap`,
      `--card-pad`), `_layout.scss` utilities (`.u-container`, `.u-grid-auto`,
      `.u-stack`, `.u-cluster`, `.section-head`), generalized `.card` family
      (`--interactive`/`--media`/`__title`/`__meta`/`__body`/`__footer`), and the
      flatpage shell (`flatpages/default.html` + `.flatpage-shell` in
      `content-description.scss`) that upgrades about **and** shop with no DB edits.
- [x] 6b Auth pages: `auth.scss` + redesigned `registration/login.html` (centered
      card, real labeled fields, icon affordances, inline `.alert` errors),
      modernized `registration/oauth.html` provider buttons, and a card shell for
      the registration form. No view/logic changes.
- [x] 6c Home hero: `home.html` hero band with CTAs + live stat chips, logged-in
      "welcome back" variant, autumn `--hero-image` slot, responsive; styled in
      `blog.scss`.
- [x] 6d Judges page → responsive card grid: `judge-status-table.html` renders
      `.judge-card`s with online/offline status pills + runtime chips; the
      `#judge-status` container and `.runtime-label` data attributes are preserved
      so the 10s AJAX refresh and runtime popovers keep working; tablesorter call
      removed (cards aren't sortable).
- [ ] 6e Shop-specific CSS-only card tiers + site-wide polish (containers on more
      pages, consistent empty states, sticky long-table headers). Shop currently
      gets the upgraded flatpage shell + modern tables (6a); CSS-only tier cards
      pending (may not be achievable without a content restructure — see spec §7).

Exit criteria: home/auth/judges redesigned; about+shop modernized with content
intact; both palettes + themes correct; no Summer regression.

---

## Deferred — Warm Harvest artwork slots (assets supplied later)

The autumn artwork (`08-autumn-theme.md §5`) is decorative enhancement; every page
MUST stay fully usable if an asset is missing. Wire the slots as placeholders now so
dropping in the real files later needs no markup change. Assets will be supplied
later — these stay `[ ]` until then.

- [x] Hero slot: `#autumn-hero` reserved in `templates/home.html`, styled in
      `base.scss` via the `--hero-image` token. Collapses to zero height until the
      token is set, so no layout shift and no request until the asset lands.
- [x] Tile slot: seamless leaf/paper body background (A-3) wired in `base.scss`
      behind content via the `--bg-texture` / `--bg-texture-opacity` tokens
      (default `none`, so no 404 until supplied).
- [ ] Logo slot: left as the current logo for now. Deliberately token-driven only
      (no eager `<img>` swap) to avoid a 404 on every page until the seasonal
      wordmark (A-2) is supplied.
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
