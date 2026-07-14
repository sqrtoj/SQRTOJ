# 01 — Vision and Principles

## Vision

SQRTOJ should feel like a modern, focused competitive-programming platform: fast
to scan, comfortable during long contest sessions, and coherent from the problem
list to the scoreboard. The redesign — the **Modern Competitive-Programming (MCP)
design system** — replaces the ad-hoc DMOJ/VNOJ styling with a single,
token-driven flat design that treats readability and information density as
first-class features rather than afterthoughts.

We are not chasing a visual trend. We are building a durable system that any
contributor can extend without guessing at colors, spacing, or component
behavior.

## Who we are designing for

| Audience | Primary needs |
|----------|---------------|
| Contestants (during a live contest) | Scan scoreboards and verdicts fast; low eye strain over hours; unambiguous status colors; solid dark mode. |
| Problem solvers (practice) | Readable problem statements with math and code; clear navigation between statement, submissions, and editorial. |
| Problem setters / staff | Dense admin-adjacent tables and forms that stay legible; predictable form controls. |
| New visitors | A trustworthy, contemporary first impression that communicates "serious judge." |

## Chosen direction: flat, token-driven, content-dense

We evaluated several directions. The decision and rationale:

| Style | Decision | Rationale |
|-------|----------|-----------|
| **Flat, token-driven (chosen)** | Adopt | Maximizes readability and scannability for dense data; accessible; low-risk to layer onto existing SCSS; scales across many templates. |
| Glassmorphism (blur/translucency) | Reject | Looks good in isolation but degrades text contrast over data tables and hurts readability in exactly the screens users spend the most time on. |
| Neumorphism | Reject | Poor contrast and accessibility; already dated. |
| Material Design 3 | Reject | Coherent but heavy and opinionated; would fight the existing markup and add significant weight for little benefit in a data-dense app. |
| Minimal "Codeforces-lite" | Reject as a ceiling | Safe but under-ambitious; the MCP system keeps the density while looking materially more modern. |

## Principles

These are the tie-breakers. When two approaches are otherwise equal, prefer the
one that better satisfies the earlier principle.

1. **Readability over decoration.** Every visual choice must help users read and
   scan data. Contrast, spacing, and typographic rhythm win over ornament.

2. **One source of truth.** Colors, spacing, radius, elevation, and type come from
   the token layer (`03-design-tokens.md`). No component hardcodes a hex value or a
   magic pixel that a token could express.

3. **Theme as data, not duplication.** Light and dark are two sets of values behind
   the *same* token names. A component is authored once and works in every theme.
   No parallel component styles per theme.

4. **Density with air.** Judges are information-dense by nature. We keep the data
   density but add consistent spacing and alignment so it reads as organized, not
   cramped.

5. **Accessible by default.** Target WCAG 2.1 AA for text contrast and interactive
   states, visible focus rings, and `prefers-reduced-motion` support. Rating and
   verdict colors must remain distinguishable and never be the *only* signal.

6. **Incremental and reversible.** The system layers onto the existing pipeline and
   ships in phases. Every phase leaves the site fully working. No big-bang rewrite.

7. **Respect the fork.** Match existing DMOJ/VNOJ structure and class names where
   practical. Change values and add tokens rather than restructuring markup, unless
   a component spec explicitly calls for it.

8. **Performance is a feature.** No render-blocking regressions. Keep the compressed
   CSS payload lean, prefer system-font-first with progressive web-font
   enhancement, and avoid layout thrash.

## What "done" feels like

- A contributor can build a new page using only documented tokens and components
  and it looks native to the site.
- Switching light/dark changes a single attribute or file mapping — not a
  re-render of parallel styles — and every component follows.
- The scoreboard, submission list, and problem list read cleanly at a glance, in
  both themes, on a laptop and a phone.
- Verdict and rating colors pass contrast checks and are backed by a
  non-color cue where they carry meaning.

## Success metrics

Qualitative and lightweight (this is a UI effort, not a data project):

- **Token coverage:** ≥ 95% of color/spacing/radius declarations in touched files
  reference tokens rather than literals.
- **Contrast:** 100% of body text and interactive states meet WCAG AA in both
  themes (verified per `07-accessibility.md`).
- **No functional regressions:** `python manage.py test judge` stays green;
  `./make_style.sh` builds both themes without errors.
- **Consistency:** the components in `05-component-specs.md` are visually identical
  wherever they appear.
