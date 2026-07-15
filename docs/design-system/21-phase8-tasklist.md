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
- [x] #10 Current/ongoing contest space: collapsible sections (Active/Ongoing)
- [x] #10 Navbar modernization
- [x] #10 Contest problem list shows TL/ML/points
- [x] #10 Django Ace: iOS/iPadOS support

## Backend (moderate)
- [x] #4  Fix N+1 query in user_link (contest ranking missing user__display_badge)
- [x] #8  Nav child nodes not shown in admin — added "Rebuild navigation tree" admin action
- [~] #1  Remove /user/<username>/solved/ route — CANCELLED (route not found; likely in local_urls.py)
- [~] #5  Remove /contest/<contest>/participations/ route — CANCELLED (route not found)

## DB cleanup — CANCELLED per user ("kệ đi")
- [~] #2  Prune hidden test contests — CANCELLED
- [~] #3  Prune problems missing statement with unassigned ticket — CANCELLED

## Large / needs product sign-off (user approved manage.py on test server)
## Large
- [x] #6  VOI contest format (subclass of VNOJ + freeze; migration 0215 applied on test)
- [x] #10 Codeforces-style profile page (rank title above handle, rating-colored)
- [~] #10 Simple custom invocation — BLOCKED (out of repo scope): the grading
  pipeline only supports `submission-request` bound to an existing problem;
  arbitrary-stdin runs require a new `custom-invocation` packet + sandbox
  executor in the separate judge-server repo, which is not part of this project.
  Won't ship a dead web-only form with no judge backend.
- [~] #9  Upgrade to Django 5.2 — BLOCKED (no safe path from here): 3.2 → 5.2 is
  a 2-major jump; forked deps (django-fernet-fields, jsonfield, martor,
  markdown2) and pinned old libs (registration-redux, social-auth, webauthn<1,
  pytz) use APIs removed in Django 4+. Needs a green test suite, which can't run
  from this machine (no local Python). Must be a dedicated branch with server-
  side test runs before any deploy.
- [x] FE: further modernization pass
  - Problem list: points badge, AC-rate progress bar, type-tag pills
  - Leaderboard/ranking: gold/silver/bronze medal tint for top-3 rank

## Notes
- User granted permission to run manage.py in venv /home/sqrtoj/vnojsite on the
  TEST server, so migrations/upgrade can be validated there.
- #1/#5 route removal and #2/#3 DB cleanup cancelled by user.
- "Làm hết frontend" — all safe front-end items above are shipped.
