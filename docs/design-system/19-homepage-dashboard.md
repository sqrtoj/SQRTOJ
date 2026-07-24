# 19 — Homepage Dashboard (Tiers A + B + C)

A visual overhaul of the homepage into a layered dashboard, reusing the data
already provided by `judge/views/blog.py::PostList.get_context_data` (no backend
changes). Presentation + light client JS only; all colors/spacing via tokens;
every animation respects `prefers-reduced-motion`.

## Layers

1. **Hero (Tier A)** — living aurora/mesh gradient (slow-drifting radial blobs),
   count-up animated stats, and a time-of-day greeting for authenticated users.
2. **Spotlight strip (Tier B)** — ongoing/upcoming contests pulled out of the
   cramped sidebar into large horizontal cards with a live countdown (reuses the
   existing `.time-remaining` + `count_down()` machinery) and an Enter/Details CTA.
   Auto-hides when there are no contests.
3. **Personal strip (Tier C)** — for logged-in users, a compact chip row of their
   own numbers (problems solved, rating, contribution) sourced from
   `request.profile`, with a "Continue solving" CTA.
4. **Main area** — newsfeed (unchanged) + a slimmer rail. Leaderboards (top rated
   / top contributors) get medal accents (🥇🥈🥉) on the top 3 rows.

## Data contract (already in context)

- `user_count`, `problem_count`, `submission_count`, `language_count`
- `current_contests`, `future_contests` (`.key`, `.name`, `.start_time`,
  `.end_time`; `time_before_end`/`time_before_start` are computed properties)
- `top_rated_users`, `top_contrib`
- `request.profile.problem_count / rating / performance_points / contribution_points`

## Constraints

- Reuse `as_countdown()` → renders `<span class="time-remaining" data-secs>`; the
  existing `$('.time-remaining').each(count_down)` handler in `blog/list.html`
  animates it, and the 0s auto-reload behaviour is preserved.
- No new queries; `current/future_contests` are already evaluated.
- Aurora animation and count-up both gated behind `prefers-reduced-motion`.
- Everything token-driven; verified across warm/summer × light/dark.
- Graceful empty states: spotlight and personal strips render nothing when their
  data is absent.
