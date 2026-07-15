# 14 — Homepage Redesign (modern layout)

A page-level modernization of the homepage hero and top-of-page layout, building
on the token layer and the Phase 6c hero. Presentation only; no view or data
changes.

## 1. Current state

- `templates/home.html` extends `blog/list.html` and fills the `before_posts`
  block with a single accent-gradient `.home-hero` band: badge, title, pitch, two
  CTAs, and a three-item stat row (users / problems / submissions).
- Below the hero, `blog/list.html` renders the newsfeed (`.blog-content`) beside a
  widget sidebar (`.blog-sidebar`: contests, top-rated users, comment stream, new
  problems), going two-column at `min-width: 800px`.
- The hero is solid but flat: CTAs and stats stacked in one column, no quick
  navigation into the site's main sections, and a lot of empty space on wide
  viewports.

## 2. Goals

- A more modern, contemporary hero: two-zone layout (messaging on the left, a
  stat/quick-nav panel on the right) that fills wide viewports and stacks cleanly.
- Add a **quick-action card grid** so the homepage becomes a launchpad into the
  main destinations (Problems, Contests, Ranking, Status, Random problem).
- Keep everything token-driven; no Summer regression; both themes correct.
- Fully responsive: single-column stack on mobile, no overflow.
- Degrade gracefully with the autumn `--hero-image` artwork slot intact.

## 3. Design

### 3.1 Hero (`.home-hero`)
- Becomes a responsive two-column grid: `.home-hero__content` (badge, title,
  pitch, CTAs) and `.home-hero__panel` (a glass card holding the stat tiles).
- Stat tiles move into the panel as a 2-col grid of glass chips with a value +
  uppercase micro-label. A fourth stat (languages) is added to balance the grid.
- Collapses to a single column below ~860px; the panel drops beneath the content.

### 3.2 Quick-action cards (`.home-quicknav`)
- A responsive `auto-fit` grid of link cards rendered right after the hero, before
  `home_page_top`. Each card: icon, label, one-line description.
- Destinations: Problems, Contests, Ranking (`user_list`), Status (`status_all`),
  Random problem (`problem_random`). Logged-out users also see a Sign-up card.
- Cards use the `.card--interactive` hover-lift pattern (motion-guarded globally).

### 3.3 Section heading for the feed
- Add a lightweight `.home-feed-head` above the newsfeed/sidebar region so the
  content below the hero reads as a distinct "Latest activity" section.

## 4. Accessibility
- Cards are real `<a>` elements with icon + text (never icon-only); focus-visible
  rings inherited from `base.scss`.
- Hover-lift and transitions honor the global `prefers-reduced-motion` guard.
- Hero panel glass keeps AA contrast: values/labels use `--color-accent-contrast`
  over the accent band.

## 5. Files
- `templates/home.html` — hero markup restructure + quick-action grid.
- `resources/blog.scss` — `.home-hero` two-zone layout, `.home-hero__panel`,
  `.home-quicknav`, `.home-feed-head`.

## 6. Validation
- `./make_style.sh` builds all four variants clean; Summer green count unchanged.
- Manual: wide + mobile viewport, logged-in vs logged-out, both themes.
