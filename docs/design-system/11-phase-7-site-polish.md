# 11 — Phase 7: Site-wide Polish & Legacy Cleanup

Phases 0–6 stood up the token layer, delivered the Warm Harvest palette, restyled
the core primitives, and redesigned the highest-traffic page shells. This phase
closes the gap between the modern tokenized layer (home hero, comment cards, blog
sidebar, judges grid) and the **legacy layer** that still carries hardcoded hex,
skeuomorphic gradients, `<br>`-based layout, `float` positioning, em/px magic
spacing, and missing empty states.

The goal is a **cohesive, modern feel on every page** with no behavior/logic
changes — SCSS plus surgical template edits only, both palettes (Warm Harvest +
Summer), both themes (light + dark).

## 1. Requirements

### Functional (FR)

- **FR-7.1** Every list surface that can be empty MUST render a tokenized empty
  state (icon + message), reusing the `.empty-state` utility from `_layout.scss`.
  Targets: problem list, submission list, user ranking, blog newsfeed, ticket
  list, organization list.
- **FR-7.2** Verdict/case colors MUST come from the protected `--verdict-*` token
  layer. No page may define a parallel verdict palette (submission case
  breakdown, contest ranking).
- **FR-7.3** Interactive controls (comment action icons, judge cards) MUST have
  visible hover + `:focus-visible` affordances.
- **FR-7.4** The user profile sidebar MUST present identity + stats as a
  tokenized card with a label/value grid, not a `<br>`-separated stack.
- **FR-7.5** Skeuomorphic gradient buttons (tickets close/vote) MUST be replaced
  with the flat token button system.

### Non-functional (NFR)

- **NFR-7.1** No hardcoded hex/rgba for anything that has a semantic token. Raw
  colors only where a token genuinely does not exist (and then documented).
- **NFR-7.2** Spacing SHOULD use the `--space-*` 4px scale; retire ad-hoc px/em
  where it does not fight an existing layout constraint.
- **NFR-7.3** `./make_style.sh` builds all four variants cleanly; no Summer drift
  (Summer keeps its classic look).
- **NFR-7.4** All interactive affordances respect `prefers-reduced-motion` (the
  global guard in `base.scss` covers transitions/transforms).
- **NFR-7.5** No view, model, or JS-logic changes. Presentation only.

## 2. Technical approach

Same pipeline as prior phases: edit `resources/*.scss` (token-consuming) and the
minimum template markup needed to attach classes or add `{% else %}` empty-state
blocks. Lift inline `<style>` blocks out of templates into the owning SCSS
partial and remap to tokens. Keep the `--verdict-*` / `--rating-*` protected
layers as the single source of truth for status color.

## 3. Task list

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

### 7a — High-traffic list polish
- [ ] Problems: fix `<td class="p">` → `points` (restores tabular-nums), add
      `.empty-state` row, drop the redundant 5%-opacity hover override, tokenize
      `.pdf-icon` and the dark header-link `#ccc`, tokenize `.errorlist`.
- [ ] Submissions: remap `.case-*` colors to `--verdict-*` tokens, fix
      `#statistics-table` `white` borders → `--color-border`, add `.empty-state`,
      tokenize the source highlight rgba.

### 7b — Contest de-hardcoding
- [ ] Lift the inline `<style>` verdict/badge/notification palette out of
      `contest/ranking.html` into `contest.scss` mapped to `--verdict-*` /
      semantic tokens; drop the manual `data-theme='dark'` overrides.
- [ ] Tokenize `contest/list.html` inline tag chip hex and the register-button
      gradient; tokenize `contest.scss` `#0F0` hover, `#fff`/`#ccc` sort links.

### 7c — Profile & user ranking
- [ ] Rebuild the profile sidebar as a tokenized card with a `.user-sidebar-stat`
      label/value grid; remove `<br>` spacers and inline styles.
- [ ] Fix user-list header links `#ccc` → `--color-text-secondary`; tokenize
      hover/target; re-skin `#rating-tooltip` with surface/shadow tokens; add a
      ranking empty state.

### 7d — Blog, comments, tickets, org, misc
- [ ] Blog: consolidate `.meta` into one tokenized post-footer; strengthen the
      body accent bar; tokenize the RSS/Atom badge and the lock icon.
- [ ] Comments: hover + `:focus-visible` + hit-area padding on
      `.comment-operation` icons; tokenize/center the empty state.
- [ ] Tickets: replace the close/vote gradient buttons with token buttons; add a
      list empty state.
- [ ] Organizations + misc: tokenize `.version-*` badges; move `home.html` inline
      `<style>` into `misc.scss`; give the org list an empty state.

## 4. Definition of done

- All FR-7.* implemented; the six empty states exist and are tokenized.
- No parallel verdict palettes remain; case + ranking colors use `--verdict-*`.
- `./make_style.sh` builds all four variants with no errors; Summer green count
  unchanged (no drift).
- `flake8` clean for any Python touched (expected: none).
- Deployed to `test.sqrtoj.edu.vn`; prod untouched.
