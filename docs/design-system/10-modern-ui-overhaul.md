# 10 — Modern UI Overhaul (Phase 6)

A page-level redesign pass that goes beyond tokenization to change *layout and
structure*, so the site reads as genuinely modern rather than recolored. Builds on
the token layer (`03`), Warm Harvest palette (`08`), and the primitive/component
work in phases 2–5.

Goal (from the request): "a much more modern interface" — redesigned home hero,
login/auth pages, shop page, about page (same content), and the judges page as
**cards instead of a table**, plus a cohesive modern feel across the site.

## 0. Guiding constraints (unchanged from the system)

- **Two palettes stay in sync.** Everything consumes semantic tokens; Warm Harvest
  (default) and Summer (classic) both keep working. Verify Summer stays classic.
- **Both themes** (light/dark) must pass; verify via `./make_style.sh` (all four
  builds) per `09-testing-and-validation.md`.
- **Accessibility is non-negotiable** (`07`): AA contrast, visible focus,
  `prefers-reduced-motion` honored, keyboard operability, no color-only meaning.
- **No new runtime deps**, no framework. Server-rendered templates + SCSS only
  (AGENTS.md).
- **Content preserved.** For flatpages (about/shop) the *words* do not change; only
  presentation.
- **Graceful degradation.** Any artwork/hero imagery is a token-driven slot that
  collapses cleanly when absent (matches the existing A-1/A-3 pattern).

## 1. Page inventory & source of truth

Grounded in the repo/server:

| Page | Route | Template | Nature |
| ---- | ----- | -------- | ------ |
| Home | `/` | `home.html` → `blog/list.html` | Server template; hero slot already reserved (`#autumn-hero`) |
| Login | `/accounts/login/` | `registration/login.html` | Server template; table-based form |
| Register | `/accounts/register/` | `registration/registration_form.html` | Server template |
| Password reset | `/accounts/password/reset/` | `registration/password_reset*.html` | Server template |
| Shop | `/shop/` | `flatpages/default.html` | **Flatpage** (DB markdown) |
| About | `/about/` | `flatpages/default.html` | **Flatpage** (DB markdown) |
| Judges | `/status/judge/` | `status/judge-status.html` + `judge-status-table.html` | Server template; `<table id="judge-status">` |
| Languages/version | `/status/` | `status/*` | Server template |

Key architectural fact: **shop and about share one flatpage template**. To
"redesign" them without touching content we restyle the flatpage *shell* and the
markdown renderer output (`.content-description`), and optionally add an opt-in
"landing" flatpage variant selected by URL. We do **not** rewrite the DB copy.

## 2. Cross-cutting foundations (do first)

These unlock the page redesigns and lift the whole site.

### 2.1 Layout tokens
Add to `03`/`_tokens.scss`:
- `--container-max` (e.g. `1120px`) and `--container-wide` (`1320px`) for content
  width control (today `#page-container` is a hard `100em`).
- `--section-gap` (e.g. `--space-7`) for vertical rhythm between page sections.
- `--card-pad` alias (`--space-5`) so cards share padding.

### 2.2 Reusable layout utilities (new `resources/_layout.scss`)
- `.u-container` — centered max-width wrapper with responsive side padding.
- `.u-grid-auto` — responsive auto-fill grid (`repeat(auto-fill, minmax(var, 1fr))`)
  used by card pages (judges, shop tiers, stats).
- `.u-stack` / `.u-cluster` — vertical/horizontal spacing helpers (gap-based).
- `.section-head` — standardized section title + optional "view all" action row.

### 2.3 Card system generalization (`widgets.scss`)
Extend the existing `.card` into a small family used everywhere:
- `.card` (surface + border + radius + `--card-pad`), `.card--interactive`
  (hover lift + `--shadow-2`, pointer, focus-within ring), `.card--media` (image
  header), `.card__title`, `.card__meta`, `.card__body`, `.card__footer`.
- All hover/lift transitions gated by `prefers-reduced-motion` (already global).

### 2.4 Iconography
Reuse existing FontAwesome (already loaded). No new icon dependency.

## 3. Page specs

### 3.1 Home — hero + modern landing (`home.html`, `blog.scss`)

Current: two-column blog + sidebar; hero slot is a dormant empty `#autumn-hero`.

Redesign:
- **Hero band** at the top of the home page (full content width, not the tiny
  reserved strip):
  - Left: site wordmark/tagline (`SITE_LONG_NAME` + short pitch), primary CTA
    buttons ("Solve problems" → `/problems/`, "Join a contest" → `/contests/`),
    and a compact stat row (users / problems / submissions — already passed to the
    template as `user_count`, `problem_count`, `submission_count`).
  - Right/background: the `--hero-image` artwork slot (autumn art), token-driven so
    it collapses gracefully when no asset is set. Gradient scrim behind text for
    contrast (AA over whatever art lands).
  - Height clamps (`clamp()`), rounded (`--radius-lg`), sits above the blog/sidebar.
- **Stat chips**: small cards using `--color-surface` + `--shadow-1`, tabular-nums.
- **Keep** the existing blog feed + sidebar below the hero (already carded in
  phase 4). Hero is additive; if `misc_config.home_page_top` exists it renders
  under the hero as today.
- Anonymous vs logged-in: show the CTA hero to guests; for logged-in users show a
  slimmer "welcome back" strip (name + quick links) instead of the marketing pitch.
- Fully responsive: hero collapses to a single column under ~760px.

### 3.2 Auth pages — login / register / reset (`registration/*`, new `auth.scss`)

Current: a bare `form-area` with a 2-row `<table>` for username/password.

Redesign (applies to login, register, password reset for consistency):
- **Centered auth card** (`max-width ~ 420px`, `--radius-lg`, `--shadow-2`,
  `--color-surface`) vertically centered in the viewport, on the page canvas.
- Brand lockup at the top of the card (logo + "Sign in to SQRTOJ").
- **Real form fields**, not a table: stacked label + input, full-width inputs using
  the modernized input styling (phase 5), icon affordances (user/key) inside or
  beside fields.
- Full-width primary submit button; secondary links ("Forgot password?", "Create
  account") in a footer row.
- OAuth block (`registration/oauth.html`) restyled as clear provider buttons with a
  "or continue with" divider.
- Error state: inline `.alert` (semantic danger token) above the fields, not the
  raw `#form-errors` red box.
- Markup change is minimal and localized to these templates; no view/logic changes.
- Accessibility: `<label for>` bound to inputs, `autocomplete` attributes,
  visible focus, error text associated with fields.

### 3.3 Shop page — pricing/landing (flatpage `/shop/`)

Current: markdown in the DB rendered into `.content-description`; includes pricing
tables (OJ hosting tiers) and prose. **Content must not change.**

Approach (content-preserving, ranked):
1. **Restyle the flatpage shell + markdown output** so the *existing* content looks
   modern: real card treatment for the wrapper, upgraded table styling (the pricing
   tables become clean modern tables with the token system — zebra, rounded, hover),
   better typography rhythm, and a flatpage hero header (title from `flatpage.title`
   in a branded band). This needs **zero DB edits** and instantly improves shop +
   about + any future flatpage.
2. **Optional enhancement (opt-in, no content rewrite):** add a flatpage "template
   class" hook — e.g. body class derived from the flatpage URL (`flatpage-shop`,
   `flatpage-about`) — so shop-specific CSS can turn its markdown pricing tables into
   card tiers via CSS only, without altering the stored markdown. If the markdown
   structure can't be carded by CSS alone, leave it as the upgraded table (still a
   big visual win) and note that a content restructure would be a separate,
   explicitly-approved task.
- Do **not** invent new prices, tiers, or copy.

### 3.4 About page (flatpage `/about/`)

Content unchanged. Same shell/markdown restyle as 3.3 gives it a modern reading
layout automatically:
- Flatpage hero header (title band).
- Constrained reading measure (~72ch) for prose, comfortable line-height, styled
  headings/lists/links/blockquotes/tables via `.content-description` tokens.
- Any images in the content get rounded corners + subtle border.
- This is presentation-only; the markdown copy is untouched.

### 3.5 Judges page — cards instead of table (`status/judge-status*.html`, `status.scss`)

Current: `<table id="judge-status">` with columns Judge / Online / Uptime / Ping /
Load / Runtimes.

Redesign:
- Replace the table with a **responsive card grid** (`.u-grid-auto`), one card per
  judge:
  - **Header**: judge name + an **online/offline status pill** (semantic success/
    danger tokens, with text label — not color only, per a11y).
  - **Body**: labeled metric rows — Uptime, Ping (ms, tabular-nums), Load — shown as
    compact stat pairs; a small load indicator bar is a nice-to-have.
  - **Footer**: runtimes as wrapping chips (reuse the existing `.runtime-label`
    hooks and JS data attributes so the runtime-version popup keeps working).
  - `.card--interactive` hover lift.
- Preserve behavior: admin link on the judge name when `perms.judge.change_judge`;
  `see_all_judges` gating for the online field; the empty state ("no judges
  available") becomes a centered empty card.
- Preserve the JS in `status/media-js.html` (runtime popovers) — keep the
  `data-judge`/`data-lang`/`data-runtime-info` attributes and `.runtime-label` class.
- Keep a table fallback consideration: if any script keys off `#judge-status`
  table structure, verify before removing; otherwise the markup swap is CSS-safe.

### 3.6 Site-wide modern polish (continues phase 5)

- **Content width**: adopt `--container-max` so long pages aren't full-bleed on wide
  screens; keep tables/scoreboards able to go wide where needed.
- **Section headers**: standardized `.section-head` with title + "view all" action.
- **Empty states**: consistent centered empty-card pattern (problems, submissions,
  tickets, judges) — icon + message, artwork slot optional.
- **Scroll polish**: subtle sticky headers on long tables (scoreboard/submissions),
  building on phase 5 table work.

## 4. Technical approach

- New partials: `resources/_layout.scss` (utilities), `resources/auth.scss` (auth
  pages), plus additions to `blog.scss` (hero), `status.scss` (judge cards),
  `content-description.scss` + a flatpage rule block (shop/about shell). Wire new
  partials into `style.scss` in dependency order (after `tokens`, near `widgets`).
- New tokens in `_tokens.scss` per §2.1 (palette-independent where possible).
- Template edits: `home.html` (hero block), `registration/login.html` +
  `registration_form.html` + reset templates (card + real fields),
  `flatpages/default.html` (hero header + body class hook),
  `status/judge-status.html` + `judge-status-table.html` (card grid markup).
- Standalone-compiled files unaffected; use the `var(--token, $legacy)` fallback if
  any shared partial is pulled into a no-`:root` build.
- No Python/model/migration changes expected. If a flatpage body-class needs a
  context var, prefer deriving it in-template from `flatpage.url` (no view change).

## 5. Phased delivery (each independently shippable + deployable to test)

| Phase | Scope | Risk |
| ----- | ----- | ---- |
| 6a | Foundations: layout tokens, `_layout.scss`, card family, flatpage shell + `.content-description` polish (instantly upgrades about **and** shop) | Low |
| 6b | Auth pages (login/register/reset) redesign | Low–med (markup) |
| 6c | Home hero + stat chips + logged-in variant | Med (markup/layout) |
| 6d | Judges page → card grid (preserve runtime JS) | Med (markup + JS check) |
| 6e | Shop-specific card tiers via CSS hook (only if achievable without content edits) + site-wide polish (containers, empty states, sticky headers) | Med |

Each phase: build all four variants → verify Summer unchanged + both themes →
deploy to `test.sqrtoj.edu.vn` → verify live + prod healthy → commit per AGENTS.md.

## 6. Acceptance criteria

1. Home shows a real hero with working CTAs + live stats; degrades with no artwork.
2. Login/register/reset are centered card forms with real labeled fields, OAuth
   buttons, inline errors, and visible focus.
3. About renders the **same content** in a modern reading layout.
4. Shop renders the **same content**, visibly modernized (at minimum upgraded shell
   + tables; card tiers if CSS-only feasible).
5. Judges page is a responsive card grid with status pills; runtime popovers still
   work; admin/empty/`see_all_judges` behaviors preserved.
6. Warm Harvest + Summer both correct in light and dark; `./make_style.sh` clean.
7. AA contrast, keyboard focus, and reduced-motion all satisfied (`07`).
8. No new runtime dependencies; no unrelated content changes.

## 7. Explicit non-goals / flags

- **No content rewrites** on about/shop. If the shop pricing genuinely can't be
  carded by CSS from the current markdown, that restructure is a separate task
  requiring explicit approval (it would edit DB content).
- No new JS framework, no build-tool change.
- The "shop" is a flatpage, not an e-commerce system; this is a presentation
  redesign, not commerce functionality.
- Artwork (hero image, illustrations) remains supplied later; slots degrade
  gracefully until then.
