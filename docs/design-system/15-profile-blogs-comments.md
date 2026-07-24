# 15 — Profile, Blogs & Comments Refinement

Focused polish pass on three related surfaces: the user profile (already given a
modern header in `12-profile-page-redesign.md`), the blog/newsfeed post cards, and
the comment threads (both the on-page comment area and the per-user comment tab).

## 1. Problems found (grounded in the code)

### Blog posts (`templates/blog/blog-post.html`, `resources/blog.scss`)
- **Layout bug**: `<div class="post-header"></div>` self-closes on line 4, so the
  vote column, title block, and collapse toggle render *outside* the flex header,
  with a stray `</div>` after the toggle. The `.post-header` flex row is empty. This
  affects the newsfeed **and** the user blogs tab (both include this partial).
- Posts have no card framing — they are separated only by a bottom border, so the
  fed reads as an undifferentiated stack rather than distinct cards.

### User blogs tab (`templates/user/blog.html`)
- Injects an inline `<style>` block with a hardcoded `#555` comment-count color
  (not theme-aware) that duplicates rules already in `blog.scss`.
- No empty state when the user has written no posts.

### Comments (`templates/comments/list.html`, `templates/user/comment.html`,
  `resources/comments.scss`)
- Comment cards are decent but the vote column uses a fixed `height: 75px` and the
  bad-comment fade is heavy.
- `user/comment.html` has no empty state when a user has no comments.
- The comment-thread header (author + time + link to page) wraps awkwardly.

## 2. Changes

### 2.1 Blog post partial
- Fix the `.post-header` structure so vote + title + toggle are inside the flex row.
- Give each `.post` a card treatment (surface, border, radius, subtle elevation,
  padding) so the newsfeed reads as a stack of cards, with a hover lift.

### 2.2 User blogs tab
- Remove the inline `<style>`; rely on the tokenized `blog.scss` rules.
- Add a tokenized empty state.

### 2.3 Comments
- Tokenize the vote column height, refine the header alignment, add an empty state
  to the per-user comment tab, and give the whole comment area consistent spacing.

## 3. Constraints
- No view/logic changes; presentation only.
- Token-driven; verified on both palettes and themes via `./make_style.sh`.
- Keep the collapse/vote JS hooks (`.post-header`, `.blog-collapse-toggle`,
  `.comment-display`, `.vote`) intact.
