# Believ / CrossCrafted — Worklog

## 2026-10-06 — Bible Comics Admin CMS

Built a full CMS for managing Bible Comic chapters, panels, translations,
and quiz links directly inside the existing admin panel.

### Schema changes
- `ComicChapter`: added `status` (default "draft"), `description`, `adminNotes`,
  and `@@index([status])`. Existing rows back-filled automatically by Prisma
  with status="draft".
- `ComicPanel`: added `altText` (accessibility / image fallback text).
- `prisma db push` ran successfully against the production Supabase instance.

### Admin API routes (all under `/api/admin/comics`)
- `GET /api/admin/comics` — list chapters with panel/translation/quiz counts.
  Supports `?status=`, `?book=`, `?q=` filters.
- `POST /api/admin/comics` — create chapter. Validates bookId against
  `BIBLE_BOOKS`, auto-generates `comicId` as `{bookId}-{chapter}`.
- `GET /api/admin/comics/[id]` — single chapter with all panels + translations.
- `PATCH /api/admin/comics/[id]` — update chapter. Supports moving the chapter
  to a new (bookId, chapter) combo — cascades the denormalized book/chapter
  on every existing panel.
- `DELETE /api/admin/comics/[id]` — hard delete (cascade cleans panels + trans).
- `POST /api/admin/comics/[id]/panels` — create panel. Auto-generates panelId
  using `{BOOKABBR}{CH}-P{NN}`. Auto-seeds an empty English translation row.
- `PATCH /api/admin/comics/[id]/panels/[panelId]` — update panel fields.
- `DELETE /api/admin/comics/[id]/panels/[panelId]` — delete panel.
- `POST /api/admin/comics/[id]/publish` — runs validation, sets status=
  "published" + isActive=true. Returns list of errors if validation fails.
- `POST /api/admin/comics/[id]/unpublish` — sets status="draft", isActive=false.
- `POST /api/admin/comics/[id]/duplicate` — clones chapter + panels + trans
  + quiz links into a new draft. Generates fresh panelIds.
- `GET /api/admin/comics/[id]/quiz?q=` — returns linked questions + search
  results from `TriviaQuestion` (uses `questionId` join).
- `POST /api/admin/comics/[id]/quiz` — link a question.
- `DELETE /api/admin/comics/[id]/quiz/[questionId]` — unlink.
- `POST /api/admin/comics/[id]/translations` — upsert panel or chapter
  translation. Validates lang against the 13 supported languages.
- `GET /api/admin/comics/stats` — aggregate dashboard stats (totals,
  missing-artwork counts, missing-EN-translation counts, missing-quiz counts)
  in a single query.

### Auth pattern
Every admin route uses the existing `requireAdmin()` helper (mirrors
`/api/admin/gifts` and `/api/admin/redemptions`). It calls `getAuthUser()`
from `@/lib/auth-server.ts` and checks `role === "admin"`. No new auth
system was created.

### Frontend CMS component
- `src/components/crosscrafted/BibleComicsAdmin.tsx` (~1500 lines) — full CMS:
  - **Dashboard**: stat cards (total/published/draft/review/ready/panels) +
    issue cards (missing artwork, missing EN translations, missing quiz) +
    CMS workflow help banner.
  - **Chapter list**: searchable (title/comicId/description), filterable by
    status and book, responsive grid of cards.
  - **Create modal**: pick book + chapter number + title + description.
  - **Chapter editor**:
    - Chapter details form (book, chapter, status, title, description,
      adminNotes, cover art via ImagePicker, sortOrder)
    - Chapter title translation picker (13 languages)
    - Live validation status banner (mirrors server-side publish checks)
    - Action bar: Save / Preview / Publish-or-Unpublish / Duplicate / Delete
    - Panels manager: cards with thumbnail, verse range, EN title/narration
      preview, issue pills (No artwork / No EN title / No EN narration),
      Edit + Delete buttons. Add Panel modal includes ImagePicker,
      verse range, altText, audioUrl, videoUrl.
    - Panel translation manager: language picker + per-panel inline expandable
      forms for title/narration/captions (with add/remove captions UI).
    - Quiz manager: lists linked questions (with dangling detection for
      deleted trivia) + debounced search to add new ones.
    - Preview modal: renders the chapter like ComicView (panel-by-panel
      navigation, progress bar, artwork + narration + captions display).
  - **Duplicate modal**: pick target (bookId, chapter, title) and clone.
  - **Confirm delete modal**: explains cascade deletes, requires confirmation.

### Wiring
- Added `"bible-comics"` to `AdminTab` type in `AdminView.tsx`.
- Added `{ id: "bible-comics", icon: BookOpen, labelKey: "admin.tab.bibleComics" }`
  to `TABS` array.
- Added `{activeTab === "bible-comics" && <BibleComicsAdmin />}` to render switch.
- Imported `BookOpen` from lucide-react and `BibleComicsAdmin` from
  `@/components/crosscrafted/BibleComicsAdmin`.
- Added `"admin.tab.bibleComics": "Bible Comics"` to `src/lib/i18n/en.ts`
  (both occurrences — the file has duplicate key sections, both updated
  so the i18n lookup never falls through to the key string).

### Tests performed
- `prisma db push` succeeded with new schema (no data loss on existing
  Genesis 2 chapter).
- `bun run lint` — no NEW errors introduced. Pre-existing 2 errors in
  `ComicView.tsx` (`require()` imports) are unrelated to this work.
- Dev server compiles cleanly with no warnings.
- `GET /api/admin/comics` and `GET /api/admin/comics/stats` both return
  `{error: "Admin access required"}` (403) for unauthenticated requests —
  auth check works.
- `GET /api/comic/list` and `GET /api/comic/genesis/2` continue to return
  existing Genesis 2 data — no regressions to public APIs.

### Known limitations
- Artwork is stored as base64 data URLs via the existing ImagePicker (per
  task spec — no Supabase Storage setup for MVP). Large images may bloat
  the DB row. Future: migrate to Supabase Storage.
- Auto-seeded empty English translations on panel creation may show as
  "missing English title" in stats until the admin fills them in. This
  is intentional — it surfaces incomplete panels in the dashboard.
- The duplicate modal doesn't auto-switch to the new chapter after creation
  (it returns to the list, where the new chapter appears). A follow-up
  could pass `onCreated` to switch views directly.
- The ComicChapter→ComicPanel relation cascade-deletes translations, but
  ComicChapterQuiz uses `onDelete: Cascade` on `comicChapter` — so deleting
  a chapter unlinks all quiz questions. The trivia questions themselves
  are preserved.
- No bulk operations yet (e.g. "publish all ready chapters"). Each chapter
  must be published individually.
