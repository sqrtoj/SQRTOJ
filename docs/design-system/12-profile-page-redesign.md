# 12 — Profile Page Redesign

A focused, page-level redesign of the user profile (`about`) page to bring it up
to the modern standard set by the home hero and the judges card grid. This builds
on the Phase 7 profile-card work and takes it further into a genuinely
contemporary profile layout.

## 1. Research & current state

Grounded in the repository:

- **Shell**: `templates/user/user-base.html` renders a two-column layout —
  `.user-sidebar` (avatar + stats) and `.user-content` (the `user_content` block).
  It is the shared shell for the about page (`user-about.html`), the timezone
  page, and is *not* used by `edit-profile.html` (which overrides `body`).
- **Content**: `templates/user/user-about.html` fills `user_content` with: the
  "From" organizations line, optional admin notes, the About markdown, a
  "Badges & Awards" row, the submission-activity heatmap, and the rating chart.
- **View**: `judge/views/user.py` `UserPage` / `UserAboutPage` supply `rating`
  (latest), `rank` (by points), `rating_rank`, `min_rating`, `max_rating`,
  `contests` (count), `ratings` (queryset), plus `submission_data` and
  `rating_data` JSON for the charts.
- **Model**: `Profile` exposes `problem_count`, `performance_points`,
  `contribution_points`, `display_rank`, `badges`, `display_badge`,
  `organizations`, `rating`, `about`, `css_class` (rating+rank CSS class).

### Weaknesses (what makes it feel dated)

1. The profile identity (username, rank title) lives only in the page tab `<h2>`;
   the sidebar shows an avatar and a bare rating word with no hierarchy.
2. Stats are a flat definition list with no visual weight, icons, or grouping.
3. "From" orgs render as a plain comma-joined `<p>`; badges render as raw
   `inline-block` `<img>` blocks with uppercase `<p>` labels and inline styles.
4. Section headers are bare `<h4>`s with no dividers or rhythm on a long page.
5. The rating chart line color is hardcoded `#A31515` (not theme/palette aware).
6. Inline `style=` attributes scattered through `user-about.html`.

## 2. Goals

- A modern **profile header**: avatar, username in its rating color, rank title,
  and the rating badge, presented as one cohesive identity block.
- **Stat cards**: the key numbers (problems solved, points, rank, rating,
  contribution) as a compact, icon-led, tabular-aligned set.
- **Content sections** (About, Organizations, Badges, Activity, Rating) with
  consistent `.section-head` headers and card surfaces.
- **Badges as cards** in a responsive grid, not raw floated images.
- All token-driven; no new hardcoded colors; both palettes + themes; the rating
  chart line reads a CSS custom property so it themes correctly.
- No changes to the view/model or the chart data contract. Heatmap and chart JS
  behavior preserved (only presentation/containers change).

## 3. Non-goals

- No new backend fields or queries. Presentation only.
- No change to the submission-activity heatmap algorithm or the rating chart data.
- No markup change to `edit-profile.html` (separate surface).

## 4. Design

### 4.1 Sidebar → profile card (`user-base.html`)

```
.user-profile-card
  .user-gravatar (avatar)
  .user-profile-card__name    → username, colored by rating class
  .user-profile-card__rank    → display-rank title (muted)
  .user-rating-badge          → rating word + number (kept, restyled)
.user-stat-list (cards)
  .user-stat  (icon · label · value)  ×N
.user-sidebar-actions
```

- The avatar keeps `user-gravatar` styling. The name uses the profile's rating
  `css_class` so it renders in the correct tier color, matching the rest of the
  site.
- Stats gain a small leading icon and keep tabular-nums values.

### 4.2 Content (`user-about.html`)

- Replace the "From" `<p>` with an `.org-chips` cluster of `.org-chip` links.
- Wrap each section in a `.profile-section` with a `.section-head` header.
- Badges become `.badge-grid` of `.badge-card` (image + name), with the existing
  empty state preserved.
- Submission activity and rating chart each sit in a `.profile-section` card.
- The rating chart line/point color reads `--color-accent` via a CSS variable
  hook (`--rating-line-color`), with a safe fallback, so it themes per palette.

### 4.3 Tokens & styling

All new classes live in `resources/users.scss` and consume existing tokens
(`--space-*`, `--radius-*`, `--shadow-*`, `--color-*`, `--text-*`). No new tokens
are required. Rating tier colors continue to come from the protected `--rating-*`
layer via the existing `.rate-*` classes.

## 5. Acceptance criteria

1. `./make_style.sh` builds all four variants (warm light/dark, summer
   light/dark) cleanly.
2. No Summer palette regression (green count preserved).
3. The profile page renders the new header, stat cards, org chips, badge grid,
   and carded activity/rating sections in both palettes and themes.
4. The submission heatmap and rating chart keep working (data contract unchanged).
5. No inline `style=` colors remain in `user-about.html`; the rating chart line
   is theme-aware.
6. `edit-profile.html` and the timezone page are visually unaffected beyond the
   shared sidebar-card treatment.

## 6. Tasks

- [ ] Redesign `.user-sidebar` profile card in `user-base.html` (name + rank).
- [ ] Add profile-card / stat-card / section / chip / badge-grid styles to
      `resources/users.scss`.
- [ ] Rework `user-about.html`: org chips, section headers, badge grid, carded
      activity + rating sections; remove inline `style=` attributes.
- [ ] Make the rating chart line color read a themed CSS variable.
- [ ] Build all four themes; verify no Summer regression; deploy to test.
