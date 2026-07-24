# 16 — Authoring Forms & Collapsible Newsfeed

Modernizes the content-authoring pages (new blog post, new problem) and refines
the newsfeed collapse behaviour, without touching any Django form/view logic.

## 1. Goals

- Give the "create/edit" pages a modern, functional shell instead of a bare
  `form.as_table()` dumped in a `.form-area`.
- Make long authoring forms easier to fill: readable stacked fields, roomy card,
  a sticky action bar so the submit button is always reachable, and a Cancel
  escape hatch.
- Change newsfeed posts to be **collapsed by default** (only the head shows);
  clicking a post expands it. Reader choices persist across reloads.

## 2. Form shell (`resources/form-shell.scss`)

A presentation-only card wrapper applied in templates around the existing form:

- `.form-shell` — centered, max-width container (`--container-max`, or
  `--container-wide` via `.form-shell--wide` for the problem form).
- `.form-shell__head` — icon tile + title + subtitle band.
- `.form-shell__body` — the card holding the form fields (`.form-area`).
- `.form-shell__actions` — sticky bottom action bar (Cancel + primary submit,
  plus an optional destructive action / note).
- Scoped `.django-as-table` restyle: labels stack over full-width controls, help
  text is muted below each field. Scoped to `.form-shell` so other
  `.django-as-table` usages are untouched.

Applied to:

- `templates/blog/edit.html` (new/edit/delete blog post).
- `templates/problem/suggest.html` (create problem — `.form-shell--wide`).

Deliberately **not** applied to `templates/problem/editor.html` (the full edit
page with the language-limit formset, editorial formset, and AI-reformat
tooling) to avoid disturbing that page's complex JS/markup. It can adopt the
shell later as a focused follow-up.

## 3. Collapsible newsfeed (`templates/blog/*`)

- Posts render **collapsed by default** (`class="post collapsed"` in
  `blog-post.html`), so only the head (title, author, time, vote, toggle) shows
  and there is no layout flash.
- `blog/media-js.html` owns the canonical collapse logic (shared by the newsfeed
  and the user blog tab):
  - Persists the set of posts the reader has **expanded** in `localStorage`
    (`newsfeed_expanded_posts`); everything else stays collapsed, so new/unseen
    posts default to collapsed.
  - Clicking the chevron toggle **or** the title/meta block expands/collapses a
    post (clicks on the title link still navigate).
  - Exposes `window.blogCollapse` (`set`, `setAll`, ...) and fires a
    `blog:collapse-changed` event.
- `blog/list.html` wires the "Collapse all / Expand all" toolbar button to
  `window.blogCollapse.setAll` and keeps its label in sync.

## 4. Constraints honored

- No changes to Django forms, views, URLs, or field definitions.
- Token-driven; both palettes (Warm Harvest / Summer) and both themes stay in
  sync. `./make_style.sh` builds all four variants cleanly.
