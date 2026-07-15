# 21 — Phase 8 task list & progress

Large multi-item request. Tracked here so nothing is dropped. Each item marked
DONE has shipped to the test server; PENDING items are not yet started; NEEDS-INFO
items are blocked on a product decision.

## Front-end (safe)
- [x] #7  Dark-mode legibility for `.alert-warning` (widgets.scss)
- [x] #10 Ranking A/B/C/D column headings centered
- [x] #10 Tables: center headings (base `.table th` already centered)
- [x] #10 Blog preview 3–4 lines + centered "expand" CTA
- [x] #10 Move user handle search from hero → right sidebar above Top users
- [x] #10 Submission result graph shown immediately (already drawn on load)
- [ ] #10 Current/ongoing contest space: slider + collapse
- [x] #10 Navbar modernization
- [x] #10 Contest problem list shows TL/ML/points
- [ ] #10 Django Ace: iOS/iPadOS support

## Backend (moderate)
- [x] #4  Fix N+1 query in user_link (contest ranking missing user__display_badge)
- [ ] #8  Nav child nodes (flatpage/redirect) not shown in admin — needs manage.py rebuild (blocked locally)
- [ ] #1  Remove /user/<username>/solved/ route (DB-heavy)
- [ ] #5  Remove /contest/<contest>/participations/ route

## DB cleanup — via management command with --dry-run (reversible/opt-in)
- [ ] #2  Prune hidden test contests
- [ ] #3  Prune problems missing statement with an unassigned ticket

## Large / needs product sign-off
- [ ] #6  VOI-style contest format (freeze/hidden scoreboard)
- [ ] #9  Upgrade to Django 5.2
- [ ] #10 Simple custom invocation
- [ ] #10 Codeforces-style profile page

## Notes
- Local machine has no Python/manage.py and no local_settings.py, so migrations
  and the Django upgrade must be validated on the test server, not locally.
- DB deletions are done through management commands defaulting to `--dry-run`,
  so nothing is destroyed without an explicit opt-in run.
