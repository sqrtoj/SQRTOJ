# 07 — Accessibility Standards

Target: **WCAG 2.1 AA**. Accessibility is a hard requirement (NFR-2 in
`02-requirements.md`), not a finishing touch. This document is the checklist the
redesign is measured against.

> Full WCAG conformance can only be confirmed through manual testing with assistive
> technologies and expert review. The automated checks below catch the common
> failures but do not by themselves prove compliance.

---

## 1. Color & contrast

- Body text vs. background: contrast ratio **≥ 4.5:1**.
- Large text (≥ 18.66px bold or ≥ 24px) and UI component boundaries: **≥ 3:1**.
- Verify both light and dark themes independently — a token that passes in light
  may fail in dark.
- Verdict/status colors (AC, WA, TLE, RTE, CE, IE) must be distinguishable by more
  than hue alone. Pair color with a label or icon (see spec 5.4). This also covers
  color-blind users.
- Rating colors (`$color_rating_*`) are decorative accents; never rely on them
  alone to convey required information — always keep the numeric/text label.
- Submission-activity heatmap: ensure adjacent levels differ enough to read; do not
  encode meaning in color only (provide tooltips/labels).

Tokens that fail contrast must be adjusted at the token level (`03-design-tokens.md`),
not patched per-component.

### 1.1 Warm Harvest contrast audit

The ratios below are computed directly from the Warm Harvest hexes in
`08-autumn-theme.md §2` (primitives) and `§3` (semantic remapping). Each critical
text/background pairing is checked against **AA** (≥ 4.5:1 normal text, ≥ 3:1 large
text / non-text UI). This is the source-of-truth audit referenced by
`03-design-tokens.md §2.2`.

**Light theme** (canvas `#fbf6ef`, surface `#ffffff`):

| Pairing (fg on bg)                                   | Hexes             | Ratio   | AA (normal) | AA (large/UI) |
| ---------------------------------------------------- | ----------------- | ------- | ----------- | ------------- |
| `--color-text` on `--color-canvas`                   | `#2e241c`/`#fbf6ef` | 14.10:1 | PASS        | PASS          |
| `--color-text` on `--color-surface`                  | `#2e241c`/`#ffffff` | 15.16:1 | PASS        | PASS          |
| `--color-text-secondary` on `--color-surface`        | `#6e5d4e`/`#ffffff` | 6.29:1  | PASS        | PASS          |
| `--color-text-secondary` on `--color-canvas`         | `#6e5d4e`/`#fbf6ef` | 5.85:1  | PASS        | PASS          |
| `--color-text-muted` on `--color-surface`            | `#a8907a`/`#ffffff` | 3.03:1  | **FAIL**    | PASS          |
| `--color-text-muted` on `--color-canvas`             | `#a8907a`/`#fbf6ef` | 2.82:1  | **FAIL**    | FAIL          |
| `--color-link` (teal) on `--color-canvas`            | `#1f5c6b`/`#fbf6ef` | 6.97:1  | PASS        | PASS          |
| `--color-link` (teal) on `--color-surface`           | `#1f5c6b`/`#ffffff` | 7.50:1  | PASS        | PASS          |
| `--color-accent-contrast` on `--color-navbar`        | `#ffffff`/`#7a2906` | 9.78:1  | PASS        | PASS          |
| `--color-accent-contrast` on `--color-accent`        | `#ffffff`/`#c1440e` | 5.12:1  | PASS        | PASS          |
| `--color-accent-2` (gold) on `--color-surface`       | `#e0a82e`/`#ffffff` | 2.14:1  | **FAIL**    | FAIL          |
| `--color-accent-2` (gold) on `--color-canvas`        | `#e0a82e`/`#fbf6ef` | 1.99:1  | **FAIL**    | FAIL          |
| `--color-border` boundary on `--color-canvas`        | `#e4d5c1`/`#fbf6ef` | 1.34:1  | n/a         | FAIL (decorative divider only) |

**Dark theme** (canvas `#1a1512`, surface `#2e241c`):

| Pairing (fg on bg)                                   | Hexes             | Ratio   | AA (normal) | AA (large/UI) |
| ---------------------------------------------------- | ----------------- | ------- | ----------- | ------------- |
| `--color-text` on `--color-canvas`                   | `#f4ebdd`/`#1a1512` | 15.32:1 | PASS        | PASS          |
| `--color-text` on `--color-surface`                  | `#f4ebdd`/`#2e241c` | 12.83:1 | PASS        | PASS          |
| `--color-text-secondary` on `--color-surface`        | `#a8907a`/`#2e241c` | 5.01:1  | PASS        | PASS          |
| `--color-text-muted` on `--color-surface`            | `#8a7360`/`#2e241c` | 3.39:1  | **FAIL**    | PASS          |
| `--color-link` (teal) on `--color-canvas`            | `#5fb3c4`/`#1a1512` | 7.53:1  | PASS        | PASS          |
| `--color-link` (teal) on `--color-surface`           | `#5fb3c4`/`#2e241c` | 6.30:1  | PASS        | PASS          |
| `--color-accent-contrast` on `--color-accent`        | `#120e0b`/`#e07b39` | 6.46:1  | PASS        | PASS          |
| `--color-text-inverse` on `--color-navbar`           | `#ffffff`/`#120e0b` | 19.21:1 | PASS        | PASS          |
| `--color-accent-2` (gold) on `--color-surface`       | `#e9c46a`/`#2e241c` | 9.07:1  | PASS        | PASS          |
| `--color-accent-2` (gold) on `--color-canvas`        | `#e9c46a`/`#1a1512` | 10.84:1 | PASS        | PASS          |

### 1.2 Failures and required corrections

- **Gold `#e0a82e` as small text on white/paper FAILS AA** (2.14:1 / 1.99:1). Gold
  (`--color-accent-2`) is therefore **decoration / large-text (≥ 3:1) / non-text UI
  ONLY** in the light theme — it MUST NOT be used for body text, links, or any small
  label. Where warm small text is needed on light surfaces, use `--color-accent`
  (sienna `#c1440e`, 5.12:1 on white) instead of gold; darkening gold to `--gold-600`
  `#c08d1e` only reaches 2.97:1, so it still is not body text. In dark mode the gold
  step `--gold-300 #e9c46a` clears AA comfortably, so gold-as-text is dark-only.
- **`--color-text-muted` FAILS AA for normal text in both themes** (3.03:1 / 2.82:1
  light; 3.39:1 dark). It is acceptable only for large text or non-essential
  decoration. For any muted text that must meet AA as normal body copy, remap the
  token one step darker/lighter:
  - Light: `--color-text-muted` → `--neutral-500` (`#8a7360`), which reaches 4.47:1
    on white and 4.15:1 on canvas. If canvas-level 4.5:1 is required, use
    `--neutral-600` (`#6e5d4e`).
  - Dark: `--color-text-muted` → `--neutral-400` (`#a8907a`), which reaches 5.01:1
    on surface and 5.98:1 on canvas.
- **`--color-border` is a boundary color, not text.** At 1.34:1 it is fine as a
  hairline divider/zebra edge but MUST NOT be relied on as the sole 3:1 boundary for
  an interactive control; use `--color-border-strong` where a 3:1 UI boundary is
  required.

Apply corrections at the token level in `03-design-tokens.md` / `08-autumn-theme.md`,
not per component. Re-run this audit whenever a primitive value is retuned.

---

## 2. Keyboard operability

- Every interactive element (links, buttons, tabs, dropdowns, form fields, pagination,
  Select2 widgets) is reachable and operable with the keyboard alone.
- Logical, predictable tab order that follows visual order.
- No keyboard traps. Dropdowns/menus and modals must be escapable with `Esc` and
  return focus sensibly.
- Provide a **skip-to-content** link as the first focusable element in
  `templates/base.html`.

---

## 3. Focus visibility

- All focusable elements show a clear `:focus-visible` indicator using the focus
  token (visible ring, ≥ 3:1 against adjacent colors).
- Never remove focus outlines without an equal-or-better replacement.
- The navbar (dark background) needs a focus ring that is visible against the green
  and against `#231F20`.

---

## 4. Semantics & structure

- One `<h1>` per page; headings nested without skipping levels.
- Tables (scoreboard, submissions, problem list) use `<th>` with correct `scope`,
  and a `<caption>` or accessible name where practical.
- Form fields have associated `<label>`s; errors are programmatically linked to
  their inputs and announced.
- Icon-only controls have accessible names (`aria-label` / visually-hidden text).
- Landmarks: `header`/`nav`/`main`/`footer` used correctly (the current
  `#page-container` / `#content` structure should map to `<main>`).

---

## 5. Motion & preferences

- Honor `prefers-reduced-motion`: disable non-essential transitions/animations.
- Honor `prefers-color-scheme` for the `auto` site theme (`SITE_THEMES`).
- No content that flashes more than 3 times per second.

---

## 6. Content-specific

- **Math (MathJax):** keep accessible output; do not hide formulas from assistive
  tech. Test that MathJax menu remains keyboard-reachable.
- **Code (Ace/Pygments):** editor must expose a usable keyboard experience; ensure
  syntax-highlight colors meet contrast against the editor background.
- **Images:** meaningful images need `alt`; decorative images use empty `alt`.

---

## 7. Verification workflow

Per component and before closing each roadmap phase:

1. Automated: run an axe/Lighthouse-style audit on representative pages
   (problem list, statement, submission list, scoreboard, profile, a form).
2. Keyboard-only pass: navigate the page start to finish without a mouse.
3. Contrast: spot-check text and UI tokens in **both** themes.
4. Screen-reader smoke test: table reading, form errors, verdict badges,
   skip link, landmarks.
5. `prefers-reduced-motion` and `prefers-color-scheme` toggles behave correctly.

Record findings in the phase's PR description. Any AA failure is a blocker for that
phase.

---

## 8. Definition of done (accessibility)

A component is accessibility-complete when:

- Contrast passes in light and dark.
- Fully keyboard operable with visible focus.
- Correct semantics/labels/roles.
- No information conveyed by color alone.
- Respects reduced-motion.
- Passes the verification workflow above with no AA-level issues.
