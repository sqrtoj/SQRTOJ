# AGENTS.md

Guidance for AI coding agents working in the SQRTOJ repository.

## Project overview

SQRTOJ (SQRT Online Judge) is a Django-based online judge that powers programming
contests for [sqrtoj.edu.vn](https://sqrtoj.edu.vn). It is a fork of
[DMOJ](https://github.com/DMOJ/online-judge) and
[VNOJ](https://github.com/VNOI-Admin/OJ), so most upstream conventions and
documentation apply here.

- Backend: Django 3.2 (Python 3.12 in CI), MySQL, Celery, and a bridge/websocket
  layer that talks to judge servers.
- Frontend: server-rendered templates plus SCSS built via `sass`/`postcss`, and a
  Node-based websocket daemon under `websocket/`.

## Repository layout

- `dmoj/` — Django project package: `settings.py`, `urls.py`, WSGI/ASGI entry
  points, Celery config. User overrides live in `dmoj/local_settings.py`
  (git-ignored; CI copies `.ci.settings.py` into it).
- `judge/` — the main Django app. Key subpackages:
  - `models/` — data models, split by domain (`problem.py`, `contest.py`,
    `submission.py`, `profile.py`, etc.); exported from `models/__init__.py`.
  - `views/` — request handlers, including `views/api/`.
  - `admin/`, `forms.py`, `migrations/`, `management/commands/` — standard Django
    pieces. Custom `manage.py` commands live in `management/commands/`.
  - `jinja2/` — Jinja2 template filters/globals (this project uses `django_jinja`).
  - `bridge/`, `balancer/` — judge-server communication.
  - `tasks/` — Celery tasks.
- `templates/` — HTML templates.
- `resources/` — SCSS/JS/static source. `make_style.sh` builds `style.css` for the
  default and dark themes.
- `websocket/` — Node.js websocket daemon (formatted with Prettier).
- `locale/` — translations (`locale/vi/LC_MESSAGES` for Vietnamese).
- `martor/`, `django_ace/` — vendored editor widgets.
- `docs/design-system/` — spec for the in-progress Modern Competitive-Programming
  UI overhaul (tokens, components, accessibility, autumn "Warm Harvest" theme).

## Build, lint, and test

Python:

- Lint: `flake8` (config in `.flake8`, max line length 120, pycharm import order).
  Install plugins as CI does: `flake8-import-order flake8-future-import
  flake8-commas flake8-logging-format flake8-quotes`.
- Tests: `python manage.py test judge`. Tests live in `judge/tests.py`,
  `judge/models/tests/`, `judge/utils/tests/`, and `judge/jinja2/markdown/`.
- CI requires a MySQL 8.0 database (`dmoj`, user `root`/`root`, port `13306`) and
  runs `python manage.py compilejsi18n` before tests. Use `.ci.settings.py` as
  `dmoj/local_settings.py` for a working test config.

Frontend:

- Styles: `./make_style.sh` (needs `postcss`, `sass`, `autoprefixer` via `npm ci`).
  It builds four theme variants: warm light/dark and summer light/dark.
- Websocket JS: `npm run format` / `npm run format:check` (Prettier, config in
  `.prettierrc`: 2-space indent, semicolons, double quotes, width 100).

## Design system / styling

- Style sources are `resources/*.scss`, aggregated by `resources/style.scss`.
- Semantic design tokens are emitted as CSS custom properties from
  `resources/_tokens.scss`, branched on palette (`$is_summer`) and mode
  (`$is_light_theme`). New components should consume `var(--...)` tokens rather
  than hardcoding colors, spacing, radii, or typography.
- Theme values are set per-build via `resources/vars-*.scss` files
  (`vars-default`, `vars-dark`, `vars-summer-default`, `vars-summer-dark`), all of
  which forward `resources/vars-common.scss`.
- The full specification lives in `docs/design-system/`; read `README.md` there
  before making cross-cutting UI changes.

## Conventions

- Follow existing patterns in the file/module you touch; this is a mature fork, so
  match upstream DMOJ/VNOJ style rather than introducing new patterns.
- Keep changes minimal and focused. Run `flake8` before finishing Python work and
  `npm run format:check` before finishing websocket work.
- Models are re-exported through `judge/models/__init__.py`; add new models there.
- Site-tunable behavior is driven by `VNOJ_*` / `DMOJ_*` settings in
  `dmoj/settings.py`. Prefer adding a setting over hardcoding policy values.
- User-facing strings should be wrapped for translation
  (`from django.utils.translation import gettext_lazy as _`).
- `dmoj/local_settings.py` and `dmoj/local_urls.py` are user-owned and git-ignored;
  never commit them.

## Code quality principles

All new and modified code must follow these principles, applied pragmatically and
without conflicting with the existing DMOJ/VNOJ conventions above:

- Clean Code: use small, focused functions that do one thing; avoid duplication
  (DRY); keep nesting shallow with early returns; delete dead code instead of
  commenting it out; and prefer clear code over comments, reserving comments for
  non-obvious intent, constraints, or tradeoffs.
- Clean Architecture: keep concerns separated by layer. Business rules belong in
  models/domain logic, request handling in views, presentation in templates, and
  async work in `tasks/`. Depend on abstractions rather than concrete
  implementations, and keep framework/IO details out of core logic where practical.
- OOP: model behavior with cohesive classes that have clear responsibilities;
  favor composition over inheritance; keep encapsulation tight (avoid leaking
  internal state); and honor SOLID principles, especially single responsibility.
- Naming conventions: use descriptive, intention-revealing names. Follow PEP 8 for
  Python (`snake_case` for functions/variables/modules, `PascalCase` for classes,
  `UPPER_SNAKE_CASE` for constants and settings). Follow the existing JS style in
  `websocket/` (`camelCase` for variables/functions, `PascalCase` for classes).
  Avoid abbreviations and single-letter names except for short-lived loop indices.

## Gotchas

- There are stray backup files in the repo (e.g.
  `judge/models/problem.py.bak.*`). These are not part of the app — do not edit or
  import them, and treat `judge/models/problem.py` as the source of truth.
- Several dependencies are installed from Git forks (see `requirements.txt`), so
  behavior may differ from the upstream PyPI packages.
- Install docs are external; see `README.md` and the linked VNOJ docs.

## Commit messages

### Guidelines

- DO NOT add any ads such as "Generated with [Claude Code](https://claude.ai/code)".
- Only generate the message for staged files/changes.
- Don't add any files using `git add`. The user will decide what to add.
- Follow the rules below for the commit message.

### Format

```
<type>:<space><message title>

<bullet points summarizing what was updated>
```

### Example titles

```
feat(auth): add JWT login flow
fix(ui): handle null pointer in sidebar
refactor(api): split user controller logic
docs(readme): add usage section
```

### Example with title and body

```
feat(auth): add JWT login flow

- Implemented JWT token validation logic
- Added documentation for the validation component
```

### Rules

- Title is lowercase, no period at the end.
- Title should be a clear summary, max 50 characters.
- Use the body (optional) to explain *why*, not just *what*.
- Bullet points should be concise and high-level.

Avoid:

- Vague titles like: "update", "fix stuff".
- Overly long or unfocused titles.
- Excessive detail in bullet points.

### Allowed types

| Type     | Description                           |
| -------- | ------------------------------------- |
| feat     | New feature                           |
| fix      | Bug fix                               |
| chore    | Maintenance (e.g., tooling, deps)     |
| docs     | Documentation changes                 |
| refactor | Code restructure (no behavior change) |
| test     | Adding or refactoring tests           |
| style    | Code formatting (no logic change)     |
| perf     | Performance improvements              |
