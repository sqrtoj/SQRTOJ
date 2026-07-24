# 17 — Charts, Statistics & Tables Theming

Make every chart, stats block, and remaining data table theme-aware (warm/summer
× light/dark) instead of relying on hardcoded colors or Chart.js light defaults.

## Problem

- Tables (`table.scss`) were already tokenized and healthy.
- **Charts were not**: Chart.js v2 defaults assume a light background, so legend
  labels, axis ticks, and gridlines were dark-on-dark in dark mode. Several charts
  also hardcoded colors (rating line `#A31515`, point fill `#FFF`, pie legend
  `'black'`).
- A few inline styles leaked raw hex (`oj-status` daterange `#fff`/`#ccc`,
  `base.scss` sortable thead `#666`).

## Solution

### `resources/chart-theme.js` (shared)
Loaded once right after `Chart.js` on every page that renders charts (OJ stats,
contest stats, org usage, submission status pie, user rating history). Reads the
live CSS token values off `:root` and sets Chart.js **global defaults**:

- `defaultFontColor` ← `--color-text`; `defaultFontFamily` ← `--font-ui`.
- Legend label color ← `--color-text`.
- Tooltip bg/title/body/footer/border ← `--color-surface-raised` /
  `--color-text` / `--color-text-muted` / `--color-border`.
- Axis ticks ← `--color-text-muted`; gridlines ← `--color-border`; scale labels ←
  `--color-text`, applied to the common scale plus each registered scale type
  (category, linear, logarithmic, time, radialLinear).

Because it reads tokens rather than duplicating values, it stays correct for all
four builds with zero per-chart changes.

### Per-chart color fixes
- `stats/media-js.html`: dropped the hardcoded `fontColor: 'black'` pie legend
  (now inherits the themed default).
- `user-about.html` rating chart: line color ← `--color-accent`, point fill ←
  `--color-surface`, read from tokens at render time. (Fixed the invalid
  `rgb(0,0,0,0)` → `rgba(0,0,0,0)`.)

### Inline-hex cleanup
- `oj-status.html`: daterange picker moved from inline `#fff`/`#ccc` to a
  `.daterange-picker` class (`misc.scss`) using surface/border/radius tokens.
- `base.scss`: sortable `thead` text `#666` → `--color-text-muted`.
- `organization/requests/detail.html`: dropped the inline `<style>th{...}</style>`
  in favor of `.django-as-table`.

## Non-goals / left as-is
- The submission-activity heatmap green scale and the rating-tier colors are a
  protected semantic palette, already branched per theme — untouched.
- Low-traffic admin tables (newsletter, org/new) not normalized in this pass.

## Verification
`./make_style.sh` builds all four variants; charts checked in light + dark on the
OJ status, submission, and profile pages.
