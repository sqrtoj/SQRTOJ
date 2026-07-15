# 13 — Site-wide Responsive Pass & Collapsible Newsfeed

Phase 8. Makes every page and article usable down to a 360px viewport, and adds a
newsfeed-level collapse/expand-all control on top of the existing per-post
collapse. Presentation only; no view or model changes.

## 1. Goals

- No page causes horizontal overflow of the whole document on small screens; wide
  tables scroll *internally* instead.
- Fixed-width flex layouts (ticket messages) reflow to a single column on mobile.
- The newsfeed can be collapsed/expanded per-post (already shipped) and all-at-once
  (new), with state persisted in `localStorage`.

## 2. Root cause of most breakage

`resources/table.scss` sets `th { white-space: nowrap }` for header readability.
That is correct, but it guarantees horizontal overflow for any wide `.table` that
is **not** wrapped in `.h-scrollable-table` (`overflow-x: auto`). The bulk of this
pass is simply applying that wrapper consistently.

## 3. Changes

### 3.1 Tables wrapped in `.h-scrollable-table`

- Contest list: active / ongoing / upcoming / past tables (`contest/list.html`).
- Contest detail: problems / announcements / clarifications (`contest/contest.html`).
- Contest calendar (`contest/calendar.html`).
- Organization list macro (`organization/list.html`).
- Comment votes (`comments/votes.html`), OJ status stats (`status/oj-status.html`),
  org join requests pending/log, contest MOSS results.

### 3.2 Flex / layout fixes

- `contest/contest.html`: the `float:left` `<h2>` + `float:right` download button
  become a flex `.contest-section-head` (no float collision on narrow screens).
- `resources/ticket.scss`: `.ticket-message` gets `flex-wrap: wrap`; under 700px it
  stacks (`flex-direction: column`) and `.info` / `.detail` drop their fixed widths.
- `resources/contest.scss`: `#contest-calendar` cells shrink under 700px
  (`width: auto; height: 80px`); `#ranking-table .user-name` min-width drops from
  20em to 12em under 700px so horizontal scroll starts later.

### 3.3 Dead code

- Removed the legacy `@-ms-viewport / @-o-viewport / @viewport { min-width: 480px }`
  block from `base.scss`. `@viewport` was removed from the platform, and a literal
  `min-width: 480px` would be actively harmful on 360px phones.

## 4. Collapsible newsfeed (all-at-once)

- `blog/list.html` gains a `.newsfeed-toolbar` with a single
  `#collapse-all-posts` button shown only when posts exist.
- The button collapses every post if any is still open, otherwise expands them all,
  writing each post id into the same `newsfeed_collapsed_posts` `localStorage` map
  the per-post toggle uses, so the two controls stay in sync across reloads.
- The button label/icon (`Collapse all` / `Expand all`, `fa-compress` /
  `fa-expand`) reflects the current aggregate state via `aria-pressed`.

## 5. Verification

- `./make_style.sh` builds all four theme variants cleanly.
- Manual check at 360 / 480 / 768 / 1024px: no page-level horizontal scrollbar;
  wide tables scroll within their container; ticket messages stack; newsfeed
  collapse-all toggles and persists.
