# 03 — Design Tokens

Tokens are the single source of truth for visual values. This document specifies
the token taxonomy, naming, and the light/dark values. Implementation details
(how tokens are emitted and consumed) live in `04-technical-design.md`.

## 1. Token model

Two layers:

1. **Primitive (global) tokens** — raw, theme-independent scales. Example:
   `--green-500: #1ba94c`. These are the palette; they are not used directly by
   components.
2. **Semantic (alias) tokens** — role-based names that components consume, mapped
   to primitives per theme. Example: `--color-accent`, `--color-surface`,
   `--color-text`.

Components MUST consume semantic tokens only. This keeps the palette swappable and
guarantees both themes stay in sync.

### Naming convention

- CSS custom properties: `--<category>-<role>[-<variant>][-<state>]`, kebab-case.
  - Examples: `--color-text`, `--color-text-muted`, `--color-accent-hover`,
    `--space-4`, `--radius-md`, `--shadow-1`, `--font-mono`.
- SCSS token variables (build-time, if needed): `$token-<same-name>` mirroring the
  CSS var name, `snake`/`kebab` consistent with existing `resources/` style.
- Numeric scales are unitless step indices where practical (`--space-1..8`,
  `--shadow-0..3`), not raw pixel names, so the scale can be retuned centrally.

## 2. Color tokens

### 2.1 Primitive palette (theme-independent)

Neutrals use a 0–1000 scale (0 = white end, 1000 = black end) so the same names
work in both themes by remapping, not renaming.

| Primitive        | Value     | Notes                    |
| ---------------- | --------- | ------------------------ |
| `--neutral-0`    | `#ffffff` | pure white               |
| `--neutral-50`   | `#f8f9fa` | app canvas (light)       |
| `--neutral-100`  | `#eef0f2` | subtle surface (light)   |
| `--neutral-200`  | `#dfe3e6` | borders (light)          |
| `--neutral-300`  | `#c4cbd1` |                          |
| `--neutral-400`  | `#9aa4ad` | muted text (light)       |
| `--neutral-500`  | `#6b757e` |                          |
| `--neutral-600`  | `#4b545c` | secondary text (light)   |
| `--neutral-700`  | `#333b42` |                          |
| `--neutral-800`  | `#20262b` | surface (dark)           |
| `--neutral-900`  | `#161b1f` | canvas (dark)            |
| `--neutral-1000` | `#0f1214` | deepest (dark)           |

Accent (SQRT green — preserves brand identity from the current `#045c20` /
`#1ba94c`):

| Primitive       | Value     |
| --------------- | --------- |
| `--green-50`    | `#e7f6ec` |
| `--green-100`   | `#c3e9ce` |
| `--green-300`   | `#5fc27e` |
| `--green-500`   | `#1ba94c` |
| `--green-600`   | `#158a3e` |
| `--green-700`   | `#045c20` |
| `--green-800`   | `#043f18` |

Link blue (retained for links to avoid regressing familiar affordance):

| Primitive       | Value     |
| --------------- | --------- |
| `--blue-300`    | `#6bb0f5` |
| `--blue-500`    | `#1958c1` |
| `--blue-600`    | `#0645ad` |

Status hues (info/success/warning/danger) each get `-bg`, `-border`, `-fg`
primitives per theme; values below are given in the semantic table since they are
role-specific.

### 2.2 Semantic color tokens

| Semantic token             | Role                                  | Light → primitive        | Dark → primitive          |
| -------------------------- | ------------------------------------- | ------------------------ | ------------------------- |
| `--color-canvas`           | page background                       | `--neutral-50`           | `--neutral-900`           |
| `--color-surface`          | cards, panels                         | `--neutral-0`            | `--neutral-800`           |
| `--color-surface-raised`   | popovers, dropdowns                   | `--neutral-0`            | `--neutral-700`           |
| `--color-surface-alt`      | zebra rows, subtle panel              | `--neutral-100`          | `--neutral-700`           |
| `--color-border`           | default borders/dividers              | `--neutral-200`          | `--neutral-700`           |
| `--color-border-strong`    | emphasized borders                    | `--neutral-300`          | `--neutral-600`           |
| `--color-text`             | primary text                          | `--neutral-800`          | `--neutral-100`           |
| `--color-text-secondary`   | secondary text                        | `--neutral-600`          | `--neutral-400`           |
| `--color-text-muted`       | hints, metadata                       | `--neutral-400`          | `--neutral-500`           |
| `--color-text-inverse`     | text on accent/dark bars              | `--neutral-0`            | `--neutral-0`             |
| `--color-accent`           | brand/action                          | `--green-500`            | `--green-500`             |
| `--color-accent-hover`     | brand hover                           | `--green-600`            | `--green-300`             |
| `--color-accent-contrast`  | text/icon on accent                   | `--neutral-0`            | `--neutral-0`             |
| `--color-accent-2`         | secondary/gold accent                 | `--green-300`            | `--green-300`             |
| `--color-navbar`           | top navigation bar                    | `--green-700`            | `--neutral-1000`          |
| `--color-link`             | link default                          | `--blue-500`             | `--blue-300`              |
| `--color-link-hover`       | link hover                            | `--blue-600`             | `#8fc4ff`                 |
| `--color-focus-ring`       | focus outline                         | `--blue-500`             | `--blue-300`              |
| `--color-info-bg`          | info surface                          | `#def`                   | `#023`                    |
| `--color-info-fg`          | info text                             | `#26536b`                | `#7df`                    |
| `--color-success-bg`       | success surface                       | `#ddf3e4`               | `#0e3a22`                 |
| `--color-success-fg`       | success text                          | `#177a3a`                | `#6f8`                     |
| `--color-warning-bg`       | warning surface                       | `#fff3cd`               | `#3a2e05`                 |
| `--color-warning-fg`       | warning text                          | `#8a6100`               | `#fd6`                     |
| `--color-danger-bg`        | danger surface                        | `#f8dcdc`               | `#3a1414`                 |
| `--color-danger-fg`        | danger text                           | `#a52222`               | `#f99`                     |

`--color-surface-alt` (zebra/subtle panel) and `--color-accent-2` (secondary
accent) were introduced by the Warm Harvest palette in `08-autumn-theme.md` and are
listed here so 03 and 08 agree. In the default green palette `--color-accent-2` has
no strong brand meaning, so it aliases a lighter accent step; Warm Harvest remaps it
to gold (`08 §3`). Per the gold-is-not-body-text rule, `--color-accent-2` MUST NOT
be used for small body text — it is for badges, highlights, borders, and large/
non-text UI only (see `07-accessibility.md`).

Contrast pairings (text vs. its background) are validated in `07-accessibility.md`.

### 2.3 Verdict tokens (submission results)

Each verdict maps to a `-bg` and `-fg` pair plus a short label; components MUST also
render the text label (FR-5.3). Names align with `SUBMISSION_RESULT` codes.

| Verdict | Token base        | Meaning              |
| ------- | ----------------- | -------------------- |
| AC      | `--verdict-ac`    | Accepted             |
| WA      | `--verdict-wa`    | Wrong Answer         |
| TLE     | `--verdict-tle`   | Time Limit Exceeded  |
| MLE     | `--verdict-mle`   | Memory Limit Exceeded|
| OLE     | `--verdict-ole`   | Output Limit Exceeded|
| RTE     | `--verdict-rte`   | Runtime Error        |
| IR      | `--verdict-ir`    | Invalid Return       |
| CE      | `--verdict-ce`    | Compile Error        |
| IE      | `--verdict-ie`    | Internal Error       |
| AB      | `--verdict-ab`    | Aborted              |

Verdicts are a **protected layer** (`08-autumn-theme.md §4`): their semantics are
unchanged from today's `resources/status.scss` (AC green, WA red, etc.). The table
below only *formalizes* accessible values so the badge text clears contrast on the
warm-neutral surfaces — it does not re-assign any meaning.

**Design rules applied:**
- AC stays green, WA stays red (semantics preserved).
- TLE/MLE move to the blue family and OLE/RTE/IR to the amber/pumpkin family so the
  "limit/output" and "correctness" classes stay separable under color-vision
  deficiency (they no longer share the flat grey the current CSS uses).
- The badge label text (already always rendered per FR-5.3) is the required
  non-color channel; color is redundant reinforcement.
- **Contrast target: WCAG AA, ≥ 4.5:1** for the badge label on its own badge
  background, verified in **both** themes. Every pair below is computed from these
  hexes and meets the target (lowest is TLE-light at 4.63:1); the full audit lives
  in `07-accessibility.md`.

Badges use solid-fill `-bg` with `-fg` text (not the legacy grey-fill + colored-text
from `status.scss`, which failed AA for several verdicts). Backgrounds are chosen to
sit on warm paper (light) and warm charcoal (dark) without vibrating.

| Verdict | Light `-bg` | Light `-fg` | L ratio | Dark `-bg` | Dark `-fg` | D ratio |
| ------- | ----------- | ----------- | ------- | ---------- | ---------- | ------- |
| AC      | `#1a7f37`   | `#ffffff`   | 5.08:1  | `#2ea043`  | `#0a0a0a`  | 5.87:1  |
| _AC (partial) | `#8a6d00` | `#ffffff` | 4.92:1 | `#d9b310` | `#0a0a0a` | 9.81:1 |
| WA      | `#c1121f`   | `#ffffff`   | 6.22:1  | `#f28b96`  | `#2a0608`  | 7.90:1  |
| TLE     | `#1f6feb`   | `#ffffff`   | 4.63:1  | `#6cb0f5`  | `#08132b`  | 8.05:1  |
| MLE     | `#0b5fa4`   | `#ffffff`   | 6.59:1  | `#4aa3df`  | `#06121f`  | 6.82:1  |
| OLE     | `#8a4b00`   | `#ffffff`   | 6.80:1  | `#e0913b`  | `#241202`  | 7.13:1  |
| RTE     | `#9a3412`   | `#ffffff`   | 7.31:1  | `#f08a4b`  | `#2a1102`  | 7.16:1  |
| IR      | `#7a2e0e`   | `#ffffff`   | 9.44:1  | `#e08a5b`  | `#25100a`  | 6.88:1  |
| CE      | `#5a4a2a`   | `#ffffff`   | 8.58:1  | `#c9b184`  | `#1c150a`  | 8.70:1  |
| IE      | `#a11043`   | `#ffffff`   | 7.86:1  | `#f2789f`  | `#2a0512`  | 7.05:1  |
| AB      | `#5b5b5b`   | `#ffffff`   | 6.79:1  | `#b8b8b8`  | `#141414`  | 9.29:1  |
| QU / G (queued/grading) | `#e4d5c1` | `#2e241c` | 10.53:1 | `#4a3b2f` | `#f4ebdd` | 9.08:1 |

Color-family map (for the CVD check): **green** = AC; **chartreuse/gold** = _AC;
**red/crimson** = WA, IE; **blue** = TLE, MLE; **amber/pumpkin/sienna** = OLE, RTE,
IR; **warm grey** = CE, AB, QU/G. AC (green) and WA (red) never collide with the
blue limit family or the amber error family under deuteranopia/protanopia.

These values are the specification for the `--verdict-*-bg` / `--verdict-*-fg`
custom properties; the implemented SCSS in `resources/status.scss` MUST match, and
the verdict-badge spec in `05-component-specs.md §5.4` consumes them.

### 2.4 Rating tokens

Preserve the current tier semantics (from `vars-*.scss`), lifted to named tokens:

| Token                      | Tier              | Light      | Dark       |
| -------------------------- | ----------------- | ---------- | ---------- |
| `--rating-none`            | Unrated           | `#999`     | `#aaa`     |
| `--rating-newbie`          | Newbie            | `#808080`  | `#988f81`  |
| `--rating-pupil`           | Pupil             | `#008000`  | `#72ff72`  |
| `--rating-specialist`      | Specialist        | `#03a89e`  | `#57fcf2`  |
| `--rating-expert`          | Expert            | `#0000ff`  | `#337dff`  |
| `--rating-candidate-master`| Candidate Master  | `#aa00aa`  | `#ff55ff`  |
| `--rating-master`          | Master            | `#ff8c00`  | `#ff981a`  |
| `--rating-grandmaster`     | Grandmaster       | `#ff0000`  | `#ff1a1a`  |

## 3. Spacing tokens

A 4px base scale. Use these for margin, padding, and gaps.

| Token       | Value  |
| ----------- | ------ |
| `--space-0` | `0`    |
| `--space-1` | `4px`  |
| `--space-2` | `8px`  |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-7` | `48px` |
| `--space-8` | `64px` |

## 4. Radius tokens

| Token          | Value  | Use                          |
| -------------- | ------ | ---------------------------- |
| `--radius-sm`  | `4px`  | inputs, small chips          |
| `--radius-md`  | `8px`  | buttons, cards (default)     |
| `--radius-lg`  | `12px` | large cards, modals          |
| `--radius-pill`| `999px`| badges, pills, avatars       |

Current code uses a 4px `$widget_border_radius`; `--radius-sm` keeps that available
while `--radius-md` becomes the new default for cards/buttons.

## 5. Elevation (shadow) tokens

| Token        | Light value                              | Dark value                               | Use                    |
| ------------ | ---------------------------------------- | ---------------------------------------- | ---------------------- |
| `--shadow-0` | `none`                                   | `none`                                   | flat                   |
| `--shadow-1` | `0 1px 2px rgba(16,24,32,.08)`           | `0 1px 2px rgba(0,0,0,.5)`               | cards at rest          |
| `--shadow-2` | `0 2px 8px rgba(16,24,32,.10)`           | `0 2px 8px rgba(0,0,0,.55)`              | dropdowns, hover cards |
| `--shadow-3` | `0 8px 24px rgba(16,24,32,.14)`          | `0 8px 24px rgba(0,0,0,.6)`              | modals, popovers       |

## 6. Typography tokens

### 6.1 Font families

| Token           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `--font-ui`     | `"Inter", "Segoe UI", "Lucida Grande", Arial, sans-serif`             |
| `--font-mono`   | `"JetBrains Mono", "Fira Code", Consolas, "DejaVu Sans Mono", monospace` |
| `--font-math`   | `"Latin Modern Math"` (unchanged; owned by `math.scss`)               |

`Inter`/`JetBrains Mono` are progressive enhancements: system fonts render first,
web fonts swap in via `font-display: swap` (NFR-2, FR-6.2). If web fonts are not
desired, the stacks already fall back to the current `Segoe UI`/`Consolas` families.

### 6.2 Type scale

| Token          | Size / line-height | Use                       |
| -------------- | ------------------ | ------------------------- |
| `--text-xs`    | `12px / 1.4`       | metadata, table captions  |
| `--text-sm`    | `13px / 1.45`      | dense tables, nav         |
| `--text-base`  | `15px / 1.55`      | body (matches current 15px)|
| `--text-md`    | `17px / 1.5`       | lead paragraphs           |
| `--text-lg`    | `20px / 1.4`       | section titles            |
| `--text-xl`    | `24px / 1.3`       | page titles               |
| `--text-2xl`   | `30px / 1.25`      | hero/home headings        |

Font weights: `--weight-regular: 400`, `--weight-medium: 500`,
`--weight-semibold: 600`, `--weight-bold: 700`.

## 7. Motion tokens

| Token             | Value                       | Use                    |
| ----------------- | --------------------------- | ---------------------- |
| `--motion-fast`   | `120ms`                     | hover, focus           |
| `--motion-base`   | `200ms`                     | dropdowns, toggles     |
| `--motion-slow`   | `320ms`                     | modals, larger surfaces|
| `--ease-standard` | `cubic-bezier(.2,0,0,1)`    | default easing         |

All transitions MUST be disabled under `prefers-reduced-motion: reduce` (NFR-1.3).

## 8. Z-index tokens

| Token           | Value  | Use              |
| --------------- | ------ | ---------------- |
| `--z-base`      | `0`    | content          |
| `--z-dropdown`  | `1000` | dropdowns        |
| `--z-navbar`    | `1000` | sticky navbar    |
| `--z-overlay`   | `1100` | modal backdrop   |
| `--z-modal`     | `1110` | modal content    |
| `--z-toast`     | `1200` | notifications    |

## 9. Token governance

- New tokens are added to this document first, then implemented.
- Prefer adding a semantic token over hardcoding; prefer reusing an existing
  primitive over adding a new one.
- Renaming/removing a token requires updating all consumers in the same change.
- Values here are the specification; the implemented SCSS/CSS MUST match, and this
  doc MUST be updated if values are retuned during implementation.
