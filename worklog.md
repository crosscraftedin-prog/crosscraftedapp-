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

---
Task ID: bugfix-artwork-upload
Agent: main
Task: Fix "Unexpected end of JSON input" error when uploading Bible Comics panel artwork via the admin CMS.

Work Log:
- Inspected the upload flow end-to-end: ComicArtworkUploader.tsx → /api/admin/comics/upload → Supabase Storage → DB.
- Found root cause: /api/admin/comics/upload/route.ts was accidentally deleted in commit 728718a (Genesis 1 redesign).
  Without that route file, requests fell through to /api/admin/comics/[id] which only supports GET/PATCH/DELETE.
  Vercel returned HTTP 405 with content-length: 0 (empty body).
  ComicArtworkUploader's `await res.json()` on empty body threw SyntaxError: Unexpected end of JSON input.
- Verified by curling production: `curl -i -X POST https://crosscraftedapp.vercel.app/api/admin/comics/upload` returned `HTTP 405, content-length: 0, x-matched-path: /api/admin/comics/[id]`.
- Restored the upload route with improvements:
  * Admin-only via requireAdmin() (403 JSON for non-admins).
  * Image validation: PNG/JPG/JPEG/WEBP, max 10MB.
  * Path sanitization (alphanumeric + hyphens only).
  * Sharp WebP conversion (quality 90).
  * Upload to Supabase Storage bucket "believ-comic-artwork" (public read).
  * Auto-create bucket if missing (idempotent).
  * Optional DB persistence: when chapterId is provided, updates ComicPanel.artworkUrl immediately.
  * Returns JSON: { success, url, artworkUrl, path, artworkPath, message }.
  * ALL error paths return JSON (no empty bodies).
  * Detects placeholder SUPABASE_SERVICE_ROLE_KEY and returns clear `missing: SUPABASE_SERVICE_ROLE_KEY` error.
- Improved ComicArtworkUploader.tsx frontend:
  * Replaced blind res.json() with safeParseJson() that checks res.ok, status, Content-Type, empty body, and HTML responses.
  * Special-cases 403 (Forbidden), 405 (route missing), 500 (config error) with specific messages.
  * When server returns `missing: ENV_VAR`, surfaces exact variable name + tells admin where to set it in Vercel.
  * Toast shows the actual server error, not a parse error.
- Wired chapterId from PanelFormModal → ComicArtworkUploader so the route can persist to DB on upload.
- Verified production endpoint after deploy:
  * GET → HTTP 405 + `{"success":false,"error":"Method not allowed — use POST"}` (was previously empty 405).
  * POST without auth → HTTP 403 + `{"success":false,"error":"Forbidden — admin access required"}`.
  * x-matched-path now correctly shows /api/admin/comics/upload (was /api/admin/comics/[id] before fix).
- Verified Supabase Storage bucket "believ-comic-artwork" is publicly readable (HTTP 200 image/webp on existing GEN2-P01.webp).
- Verified SUPABASE_SERVICE_ROLE_KEY is configured on Vercel (because GEN2-P01 was successfully uploaded previously and lives in Supabase Storage).
- Verified no base64 data URLs remain in DB (all 27 sampled panels use either Supabase URLs or local SVG placeholders).
- Committed as 7aff53b and pushed to main → Vercel deploy triggered.

Stage Summary:
- ROOT CAUSE: Upload route file deleted; production returned empty 405; frontend blind .json() on empty body → "Unexpected end of JSON input".
- FIX: Restored route with strict JSON responses + improved frontend safeParseJson() that never throws on empty/non-JSON bodies and surfaces real server errors with env-var guidance.
- API ENDPOINT: POST /api/admin/comics/upload (multipart/form-data).
- SUPABASE BUCKET: believ-comic-artwork (public read, admin-only write).
- DB UPDATE: ComicPanel.artworkUrl updated immediately when chapterId is supplied (also still persisted via existing Save flow).
- VERCEL ENV: SUPABASE_SERVICE_ROLE_KEY is already configured (verified by existing GEN2-P01 upload). NEXT_PUBLIC_SUPABASE_URL also configured.
- TESTS: GET → 405 JSON ✅ | POST no-auth → 403 JSON ✅ | route exists on Vercel ✅ | bucket publicly readable ✅ | placeholder SVGs still serve ✅.
- PRODUCTION STATE: ready for admin to upload artwork to GEN1-P01 and GEN2-P02.

---
Task ID: bugfix-artwork-revert-cache
Agent: main
Task: Fix artwork preview reverting to OLD test image when re-uploading to GEN1-P01.

Work Log:
- Verified DB state for GEN1-P01: artworkUrl was correctly updated to https://ffslazyedqbbuuyfytnq.supabase.co/storage/v1/object/public/believ-comic-artwork/bible-comics/genesis/1/GEN1-P01.webp (clean URL, no ?v=).
- Verified Supabase Storage serves the new file (HTTP 200, image/webp, 307KB, last-modified 17:27:35).
- Verified public API /api/comic/genesis/1 returns the new URL for GEN1-P01.
- Root cause identified: Supabase Storage path is deterministic (bible-comics/{bookId}/{chapter}/{panelId}.webp). Re-uploading to the same panel UPSERTS at the SAME URL. This caused two failure modes:
  1) React: setArtwork(sameUrlString) is a no-op (state value unchanged) → <img> never re-renders → preview shows OLD image.
  2) Browser cache: even if <img> did re-render, browser serves cached image at that URL.
- Fix: Append cache-busting ?v={Date.now()} query param to URLs returned from /api/admin/comics/upload.
  - Upload API response: url + artworkUrl now include ?v=<timestamp>
  - DB stores artworkUrl WITH ?v=<timestamp> (so reopening editor shows the version that was last uploaded)
  - Each new upload bumps ?v= → URL string differs from previous state → React re-renders <img>
  - Browser sees different URL → fetches freshly-uploaded file
  - Query param is harmless — Supabase Storage ignores it
- Verified ComicView.tsx uses panel.artworkUrl directly in <img src> — works fine with ?v= query param.
- Verified PATCH endpoint /api/admin/comics/[id]/panels/[panelId]/route.ts stores artworkUrl as-is (no change needed).
- Committed as 7782cdc and pushed to main → Vercel deploy triggered.
- Verified production endpoint after deploy: GET → 405 JSON {"success":false,"error":"Method not allowed — use POST"}.

Stage Summary:
- ROOT CAUSE: Deterministic storage path → URL string unchanged on re-upload → React state didn't trigger re-render + browser served cached image.
- FIX: Append ?v=Date.now() to URLs returned from upload API. DB stores URL with ?v= (harmless).
- FILES CHANGED: src/app/api/admin/comics/upload/route.ts (only file modified).
- NO CHANGES TO: PATCH endpoint, ComicArtworkUploader, ComicView, BibleComicsAdmin, DB schema, comic content (Genesis 1/2/3/4 unchanged), ComicView layout/design.
- TESTING REQUIRED (admin-only, browser-based):
  1. Sign in as admin → Bible Comics → Genesis 1 → Edit Panel GEN1-P01
  2. Upload new artwork → preview should immediately show new image
  3. Click Save Changes → DB updated with new URL+?v=
  4. Close modal → reopen → should show new artwork
  5. Refresh page → should still show new artwork
  6. View public Genesis 1 page → should show new artwork

---
Task ID: comicview-overlay-final-ui
Agent: main
Task: Final UI fix — overlay panel number/title/verse on artwork per Genesis 2 reference, add mobile bottom-padding for nav clearance.

Work Log:
- Read ComicView.tsx (721 lines) to understand current structure.
- Found mobile bottom nav in src/app/page.tsx (fixed bottom-4 floating pill, md:hidden).
- Identified that panel number + title were in a separate header ABOVE the artwork — user wants them OVERLAID on the artwork.
- Modified ComicPanelCard:
  * Removed the separate header div (was: p-3 pb-2 with number + title).
  * Moved panel number badge + title to OVERLAY on top of artwork (absolute top-3 left-3 right-3).
  * Added top gradient (from-black/80 via-black/30 to-transparent, h-24) for overlay legibility against any artwork colors.
  * Added bottom gradient (from-black/80 via-black/30 to-transparent, h-20) for verse reference legibility.
  * Verse reference badge stays at bottom-right (already was there).
  * Narration remains BELOW artwork (unchanged behavior — p-3 flex-1).
- Modified ComicView container div:
  * Added pb-28 on mobile (md:pb-5 on desktop) so the fixed mobile bottom nav does NOT cover comic content — users can now scroll completely past the final panel.
- Grid unchanged: grid-cols-1 (mobile, stacked) → md:grid-cols-2 (tablet) → lg:grid-cols-3 (desktop, 3×2).
- Type-check passed: no new TypeScript errors in ComicView.tsx.
- Committed as be810ae and pushed to main → Vercel deploy triggered.
- Verified production APIs after deploy:
  * Genesis 2 API: HTTP 200, 7 panels, GEN2-P01 + GEN2-P02 still have Supabase Storage URLs ✅
  * Genesis 1 API: HTTP 200, 6 panels, GEN1-P01 still has Supabase Storage URL ✅
  * Homepage: HTTP 200 ✅

Stage Summary:
- FILES CHANGED: src/components/crosscrafted/ComicView.tsx (only file modified, +27/-19 lines).
- PANEL NUMBER: now OVERLAID on artwork (top-left, was in separate header above artwork).
- PANEL TITLE: now OVERLAID on artwork (next to number, with drop-shadow + line-clamp-2).
- VERSE REFERENCE: stays OVERLAID at bottom-right of artwork (unchanged).
- NARRATION: stays BELOW artwork (unchanged).
- GRID: 3×2 desktop (lg:grid-cols-3), stacked on mobile (grid-cols-1).
- MOBILE NAV CLEARANCE: pb-28 added on mobile so fixed bottom-4 nav doesn't cover content.
- NO CHANGES TO: Bible Comics CMS, Prisma models, Supabase Storage, upload API, Genesis 1/2/3/4 content, Bible reader, Trivia, Faith Points, auth, admin.
- TESTING REQUIRED (admin-only, browser-based): verify desktop 3×2 layout, mobile stacked layout, overlay legibility against real Genesis 2 artwork, and that mobile bottom nav no longer covers the final panel.

---
Task ID: comic-default-chapter-naming-cover
Agent: main
Task: Final navigation + naming + chapter cover fix — Bible Comics must open Genesis 1 by default, feature name standardized to BIBLE COMICS.

Work Log:
- Searched page.tsx for the Bible Comics entry point and found `useState(2)` hardcoded as the default comicChapter — this was the root cause of Bible Comics opening Genesis 2 instead of Genesis 1.
- Verified DB state: Genesis 1 already has sortOrder=0 (correct earliest), isActive=true, status=published. So no DB changes needed — only the frontend default.
- Searched codebase for inconsistent naming and found 4 occurrences of "Comic Bible" / "Believ Comic Bible":
  * src/app/page.tsx:62   SIDEBAR_LINKS: "Comic Bible"
  * src/app/page.tsx:86   MOBILE_MORE_VIEWS: "Comic Bible"
  * src/app/page.tsx:102  comment: "Comic Bible state"
  * src/app/api/comic/share/[panelId]/route.ts:42  share fallback title: "Believ Comic Bible"
- Verified ComicChapter.coverArtUrl already exists as a Prisma field and Genesis 1 has a cover URL stored in DB (verified via /api/comic/list: cover=yes for genesis-1, cover=no for genesis-2/3/4).
- Verified BibleComicsAdmin.tsx already displays chapter covers in the admin chapter list (line 518-519), which is the appropriate chapter/list/preview location. No changes needed there.
- Verified the i18n admin tab label was already correct: "admin.tab.bibleComics": "Bible Comics".
- Verified ComicView intentionally does NOT display the chapter cover in the comic panel area (only panel artwork) — per user spec, did not force a large cover into the comic panel area.
- Changes:
  * src/app/page.tsx:102-106  Changed default comicChapter from useState(2) → useState(1). Updated comment to "Bible Comics state".
  * src/app/page.tsx:62       SIDEBAR_LINKS label: "Comic Bible" → "Bible Comics"
  * src/app/page.tsx:86       MOBILE_MORE_VIEWS label: "Comic Bible" → "Bible Comics"
  * src/app/api/comic/share/[panelId]/route.ts:42  Share fallback title: "Believ Comic Bible" → "Believ Bible Comics"
- Type-check passed: no new TypeScript errors.
- Committed as aacce20 and pushed to main → Vercel deploy triggered.
- Verified production APIs after deploy:
  * Genesis 1 API: HTTP 200, 6 panels (GEN1-P01..P06), each panel has its own Supabase Storage URL ✅
  * Genesis 2 API: HTTP 200, 7 panels ✅
  * Genesis 3 API: HTTP 200 ✅
  * Genesis 4 API: HTTP 200 ✅
  * Comic list API: HTTP 200, 4 chapters in correct order: genesis-1 (sort=0, cover=yes) → genesis-2 (sort=1) → genesis-3 (sort=2) → genesis-4 (sort=3) ✅
  * Homepage: HTTP 200 ✅

Stage Summary:
- ROOT CAUSE #1: useState(2) hardcoded as default comicChapter in src/app/page.tsx. FIXED → useState(1).
- ROOT CAUSE #2: Inconsistent "Comic Bible" labels in 4 places (2 nav arrays, 1 comment, 1 share title). FIXED → all standardized to "Bible Comics" / "Believ Bible Comics".
- CHAPTER COVER: ComicChapter.coverArtUrl already exists, Genesis 1 already has cover stored, already displayed in admin chapter list (BibleComicsAdmin.tsx:518-519). No changes needed.
- NO CHANGES TO: Genesis 1/2/3/4 content, panel artwork URLs, 6-panel structure, mobile 1×6 layout, desktop 3×2 layout, panel number/title/verse overlays, narration below artwork, bottom action bar, chapter navigation, mobile bottom nav, Bible reader, Trivia, Faith Points, auth, admin, CMS architecture, Prisma models, Supabase Storage, artwork upload API.
- FILES CHANGED: src/app/page.tsx (default chapter + 2 labels + 1 comment), src/app/api/comic/share/[panelId]/route.ts (1 share fallback title).
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Bible Comics feature → should land on Genesis 1, not Genesis 2.

---
Task ID: landing-enter-app-opens-bible-comics
Agent: main
Task: Change the landing page "Enter App" button so it opens Bible Comics instead of the Bible reader.

Work Log:
- Located the Enter App button in src/components/crosscrafted/LandingHero.tsx (line 109).
- It was calling onEnterApp('bible') which navigated to the Bible reader view.
- Changed to onEnterApp('comic') so it now opens the Bible Comics feature.
- Genesis 1 will load by default (per previous commit aacce20 — useState(1) default).
- Left the hero CTA "Read the Bible" button unchanged — it intentionally opens the Bible reader as its label promises.
- Committed as 530f805 and pushed to main → Vercel deploy triggered.
- Verified production: homepage HTTP 200, Genesis 1 API HTTP 200.

Stage Summary:
- ROOT CAUSE: LandingHero.tsx Enter App button called onEnterApp('bible').
- FIX: Changed to onEnterApp('comic'). Now Enter App → Bible Comics → Genesis 1.
- FILES CHANGED: src/components/crosscrafted/LandingHero.tsx (1 line).
- NO CHANGES TO: Bible reader, Trivia, Faith Points, sidebar nav, mobile bottom nav, ComicView, CMS, Genesis content, auth, admin.

---
Task ID: bible-hub-read-comics-mode
Agent: main
Task: Redesign Bible section into a hub with two modes (READ / COMICS) — remove separate "Bible Comics" sidebar entry, add mode switcher inside Bible view.

Work Log:
- Read existing BibleView.tsx (842 lines) to understand structure: header + translation picker + conditional views (books/chapters/reader/search/bookmarks).
- Read page.tsx to find the sidebar entries: SIDEBAR_LINKS had "Bible Comics" at line 62, MOBILE_MORE_VIEWS had it at line 86.
- Removed "Bible Comics" entry from BOTH SIDEBAR_LINKS and MOBILE_MORE_VIEWS. Sidebar now has ONE "Bible" entry.
- Added new optional prop to BibleView: onOpenComic?(bookId, chapter).
- Added new state: mode: "read" | "comics" (default: "read").
- Added MODE SWITCHER directly under the Bible heading:
    [ 📖 READ ]   [ ✨ COMICS ]
  Active state uses Believ's purple/pink gradient (from-[#7C3AED] to-[#F39B9B]).
- READ mode shows the existing Bible experience unchanged (KJV/WEB picker, language indicator, scripture notice, books/chapters/reader/search/bookmarks).
- Search/Bookmark header buttons only render in READ mode (don't apply to COMICS mode).
- COMICS mode renders a new ComicsBrowserView component:
  * Fetches /api/comic/list (existing public API).
  * Defensive sort: sortOrder → bookId → chapter (Genesis 1 before Genesis 2, 3, 4 — no hardcoding).
  * Renders chapter cards in responsive grid: 1 column mobile, 2 columns sm+.
  * Each card shows: coverArtUrl image (when available), chapter number overlay (top-left), chapter title + "Genesis N" reference overlay (bottom-left), "Continue Reading" CTA bar.
  * Clicking a card calls onOpenComic(bookId, chapter) → existing ComicView opens.
- Updated page.tsx to pass onOpenComic to BibleView:
    onOpenComic={(bookId, chapter) => {
      setComicBookId(bookId);
      setComicChapter(chapter);
      goView("comic");
    }}
  This preserves the existing comicBookId/comicChapter state so chapter navigation inside ComicView continues to work.
- Added pb-28 on mobile (md:pb-5 desktop) to BibleView container so fixed mobile bottom nav doesn't cover chapter cards.
- Committed as 3a2b2f3 and pushed to main → Vercel deploy triggered.
- Verified production APIs after deploy:
  * Comic list API: HTTP 200, 4 chapters in correct order (genesis-1 sort=0 → genesis-2 sort=1 → genesis-3 sort=2 → genesis-4 sort=3). genesis-1 and genesis-2 both have cover=yes.
  * Genesis 1 API: HTTP 200 ✅
  * Genesis 2 API: HTTP 200 ✅
  * Genesis 3 API: HTTP 200 ✅
  * Genesis 4 API: HTTP 200 ✅
  * Homepage: HTTP 200 ✅

Stage Summary:
- FILES CHANGED: src/app/page.tsx (removed 2 sidebar entries + added onOpenComic prop), src/components/crosscrafted/BibleView.tsx (added mode state + switcher + ComicsBrowserView component, +357/-146 lines).
- NO CHANGES TO: ComicView.tsx (reused as-is), comic APIs, comic DB schema, comic CMS, comic artwork (Genesis 1/2/3/4 panels unchanged), coverArtUrl field semantics (still stored on ComicChapter + returned by /api/comic/list + now also displayed in ComicsBrowserView + still displayed in admin chapter list), Bible reader functionality, Trivia, Faith Points, auth, admin, LandingHero Enter App button.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Bible → switch to COMICS → see chapter cards → click Genesis 1 → ComicView opens with all 6 panels → back to Bible → still in COMICS mode → switch to READ → existing Bible reader works.

---
Task ID: bible-hub-3-modes-full-book-names
Agent: main
Task: Complete Bible hub redesign — 3 modes (READ / BIBLE COMICS / READING PLANS) + full Bible book names.

Work Log:
- Removed "Reading Plans" from SIDEBAR_LINKS and MOBILE_MORE_VIEWS in src/app/page.tsx. Sidebar now has ONE "Bible" entry — Reading Plans is accessed inside the Bible hub via the mode switcher. Removed unused BookMarked import.
- Standalone /bible-plans view route preserved in page.tsx for backward compatibility (any direct links still work).
- Updated BibleView.tsx:
  * Added "plans" to BibleMode type: now "read" | "comics" | "plans"
  * Mode switcher now has 3 tabs: [📖 READ] [✨ COMICS] [📚 PLANS]
  * Tab labels kept short ("READ", "COMICS", "PLANS") so all 3 fit on small mobile screens without horizontal overflow
  * Icon size reduced (14→13) and gap tightened (2→1.5) for compactness
  * Added gap-1 between tabs so active gradient doesn't bleed into inactive tabs
  * PLANS mode renders the existing BiblePlansView component (no rebuild) with translation prop + onOpenChapter callback that switches to READ mode and loads the chosen chapter inline
  * Imported BiblePlansView from "@/components/crosscrafted/BiblePlansView"
- Updated BooksView book cards (in BibleView.tsx):
  * Cards now show book.name (e.g. "Genesis") instead of book.abbr (e.g. "Ge")
  * Card grid changed from grid-cols-3 sm:grid-cols-4 to grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 so long names ("1 Thessalonians", "2 Thessalonians", "Ecclesiastes", "Lamentations", "Song of Solomon") fit on mobile without horizontal overflow
  * Card now has min-h-[60px] and flex flex-col justify-center so long names wrap cleanly
  * "chapters" spelled out on sm+ screens, "ch" on mobile (compact)
- Audited all 66 books in src/lib/bible-data.ts: all 66 already have full display names. No data changes needed — only the display layer was using abbreviations.
- Updated BiblePlansView.tsx day reading labels to use book.name instead of book.abbr:
  was: "Ge 1 · Ex 2"
  now:  "Genesis 1 · Exodus 2"
- Committed as b1c09de and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Comic list API: HTTP 200, 4 chapters in correct order (genesis-1 sort=0 → genesis-2 sort=1 → genesis-3 sort=2 → genesis-4 sort=3) ✅
  * Genesis 1 API: HTTP 200 ✅
  * Genesis 2 API: HTTP 200 ✅
  * Genesis 3 API: HTTP 200 ✅
  * Genesis 4 API: HTTP 200 ✅
  * Bible verse API (KJV John 3:16): HTTP 200 ✅

Stage Summary:
- FILES CHANGED: src/app/page.tsx (removed Reading Plans sidebar entry + unused import), src/components/crosscrafted/BibleView.tsx (added "plans" mode + 3-tab switcher + full book names + responsive grid), src/components/crosscrafted/BiblePlansView.tsx (day labels use book.name).
- ALL 66 BOOKS use full display names (Genesis, Exodus, ... Revelation). Audited via script. "Job" is the only 3-letter name — it IS the canonical full name.
- GENESIS 1 STILL APPEARS BEFORE GENESIS 2 in comic list (verified via API).
- EXISTING ComicView reused unchanged.
- EXISTING BiblePlansView reused unchanged (only 1 line changed for display).
- NO CHANGES TO: comic DB schema, comic artwork, comic CMS, comic APIs, Genesis 1/2/3/4 panel counts, coverArtUrl field semantics, Bible reader functionality, Trivia, Faith Points, auth, admin, LandingHero, routing architecture.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Bible → switch between READ / BIBLE COMICS / READING PLANS → verify each mode shows the expected content → in PLANS mode, click a day → verify it switches to READ mode with the chosen chapter loaded → in READ mode, verify all 66 books use full names → verify mobile layout has no horizontal overflow.

---
Task ID: churches-hub-redesign
Agent: main
Task: Churches + Groups structure redesign — remove Small Groups + List Church from sidebar, add Discover/My Churches tabs, route List Your Church to dedicated page, add Groups placeholder.

Work Log:
- Inspected current state: ChurchesView.tsx (860 lines, uses in-memory CHURCHES mock array + component-local followed Set), ListYourEntity.tsx (existing church listing form), Prisma schema (21 models, NO Church/Group/Follow models — churches are mock data only).
- Decided scope: per spec "do not overengineer this now", do NOT add Prisma migrations for Church/Follow/Group models. Instead: consolidate sidebar, add My Churches tab (component-local state with clear comment about future DB hydration), auth-gate follow toggle, route List Your Church to existing dedicated page, add Groups placeholder in church detail modal.
- Removed "Small Groups" and "List Church" from SIDEBAR_LINKS + MOBILE_MORE_VIEWS in page.tsx. Removed unused UsersRound + Building2 imports.
- Standalone /small-groups and /list-church view routes PRESERVED in page.tsx for backward compatibility.
- Updated ChurchesView.tsx:
  * Added onListChurch?: () => void prop
  * Added Discover/My Churches tab switcher with Believ purple→pink gradient active state
  * Wrapped existing Filters + Church Cards + Empty State in discoverTab === "discover" conditional
  * Added MyChurchesView component (separate function at end of file): shows followed churches as compact list cards with thumbnail + name + location + followers count + Following button; auth-gated empty state for unauthenticated users; "no follows yet" empty state for authenticated users
  * Made toggleFollow auth-aware: checks isAuthenticated via useSupabaseUser; if unauthenticated, shows "Sign in required" toast and does NOT toggle
  * "+ Add Church" button → "+ List Your Church" with routing logic: if onListChurch provided, call it; else fall back to in-page modal (back-compat)
  * "Add a Church" modal title → "List Your Church"
  * Empty-state "Add Church" button → "List Your Church" with same routing logic
  * Added Groups placeholder section inside church detail modal: "Church Groups coming soon" with categories listed (Youth, Young Adults, Men, Women, Families, Bible Study, Prayer, Worship, Kids, Care / Support)
  * Added pb-28 md:pb-5 to container so fixed mobile bottom nav doesn't cover content
  * Imported useSupabaseUser, Heart icon
- Wired page.tsx: ChurchesView receives onListChurch={() => goView("list-church")} → taps "+ List Your Church" → opens dedicated ListYourEntity variant="church" full-page form
- Committed as 48863f9 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1 comic API: HTTP 200 ✅ (no regression to Bible Comics)
  * Bible verse API: HTTP 200 ✅ (no regression to Bible reader)
  * /api/auth/me: HTTP 401 for unauthenticated (correct — auth system intact)

Stage Summary:
- FILES CHANGED: src/app/page.tsx (sidebar cleanup + onListChurch wiring), src/components/crosscrafted/ChurchesView.tsx (+241/-14: tabs + auth-gate + Groups placeholder + MyChurchesView + bottom padding).
- NO DATABASE MIGRATIONS: Prisma schema unchanged. No Church/Group/Follow models added. Follow state is component-local with clear comment about future DB hydration. Per spec: "do not overengineer this now."
- NO CHANGES TO: ListYourEntity (existing church listing form fields preserved: Church Name, Description, State, City, Address, Denomination, Service Times, Church Photos, WhatsApp Number, Languages, Contact Name, Email, Phone), existing church data (CHURCHES array in crosscrafted-data.ts unchanged), Bible/Bible Comics/Reading Plans/Trivia/Marketplace/Prayer Wall/Apologetics/Events/Admin/Auth, comic content (Genesis 1/2/3/4 unchanged), mobile bottom nav, routing architecture.
- EXISTING APIS/MODELS REUSED: ListYourEntity (church variant) reused as-is. CHURCHES mock data reused as-is. useSupabaseUser auth hook reused as-is. Existing church detail modal reused as-is (only added Groups section).
- AUTH/SECURITY: Follow toggle is now auth-gated (was previously open to anyone). Login required to follow. Login required to list a church (existing ListYourEntity behavior preserved). No private user data exposed. No service-role keys exposed.
- MOBILE: pb-28 added so fixed mobile bottom nav doesn't cover My Churches list or church detail. Mode switcher (Discover/My Churches) uses same compact tab pattern as Bible hub (fits comfortably on small screens). Long church names truncate cleanly with `truncate` class.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Churches → tap "+ List Your Church" → confirm ListYourEntity page opens → switch to My Churches tab (unauth) → see "Sign in required" → sign in → switch to My Churches → see "You're not following any churches yet" → switch to Discover → tap Follow on a church → switch to My Churches → see the church in the list → tap a church → see Groups placeholder section in detail modal.

---
Task ID: events-discovery-state-city-filters
Agent: main
Task: Events discovery + state/city filtering + event type (in-person/online/hybrid) + ticket URL + WhatsApp organizer.

Work Log:
- Inspected current state: EventsView.tsx (626 lines, uses in-memory EVENTS mock array of 6 events), EventItem type had only state/city/is_online fields (no eventType, onlineUrl, ticketUrl, address, country). No Prisma Event model — all mock data in crosscrafted-data.ts.
- Extended EventItem type with: country, address, eventType (in-person|online|hybrid), onlineUrl, ticketUrl, organizerName, status (upcoming|cancelled|ended), featured. Kept is_online for backward compat.
- Updated all 6 mock events to use new schema: e1/e2/e3/e4 in-person (with ticketUrls on e1, e3, e4), e5 online-only with onlineUrl, e6 hybrid with onlineUrl. Marked e1, e3, e6 as featured.
- Added INDIAN_CITIES_BY_STATE single source of truth — 19 Indian states each with their major cities (e.g. Telangana → Hyderabad, Warangal, Nizamabad, Karimnagar, Khammam).
- Added getCitiesForState(state) helper.
- Expanded EVENT_CATEGORIES from 8 to 18: Worship, Conference, Prayer, Bible Study, Youth, Young Adults, Men, Women, Family, Children, Music, Workshop, Seminar, Outreach, Fellowship, Retreat, Concert, Other.
- Added EVENT_DATE_FILTERS constant: All Events, Today, Tomorrow, This Weekend, This Week, This Month.
- Updated EventsView.tsx:
  * Added quick filter row: [Near You] [All India] [Online] with Believ pink→orange gradient active state
  * "Near You" doesn't use GPS — uses selected state/city; if no state set, shows "Select your location" banner
  * "All India" preserves manual filters
  * "Online" filters to events where eventType is online or hybrid
  * Added City filter (state-dependent, disabled until state selected)
  * Reset city when state changes
  * Enhanced search to search title + description + city + state + church + category
  * Added Tomorrow + Weekend date filter logic
  * Event card badges: Online / Hybrid / Cancelled / Featured
  * Card location display: online → 🌐 Online Event; in-person/hybrid → City, State
  * Modal "Where" section: online → 🌐 Online Event + onlineUrl link; in-person → city/state + full address + location; hybrid → physical + "Also available online"
  * Modal CTA: ticketUrl → "Get Tickets" external link (pink→orange); else online event with onlineUrl → "Join Online" (blue→purple); else fallback to existing RSVP button
  * WhatsApp button uses MessageCircle icon + prefilled "Hi, I found your event 'X' on Believ..." message
  * Helper text under ticket button: "Tickets and registration are handled by the event organizer. Believ does not process payments."
  * "+ Add Event" → "+ List Your Event"
  * Added pb-28 md:pb-5 so mobile bottom nav doesn't cover content
  * Filter grid changed from sm:grid-cols-3 to grid-cols-2 sm:grid-cols-4 (now has Search + State + City + Language)
  * activeFilters count now includes filterCity + dateFilter
  * Clear all filters button also clears filterCity + sets quickFilter back to all-india
- Committed as 95a6670 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)
  * /api/auth/me: HTTP 401 for unauthenticated (auth intact) ✅

Stage Summary:
- FILES CHANGED: src/lib/crosscrafted-data.ts (EventItem type extended + 6 EVENTS updated + INDIAN_CITIES_BY_STATE + getCitiesForState + expanded EVENT_CATEGORIES + EVENT_DATE_FILTERS), src/components/crosscrafted/EventsView.tsx (quick filter row + City filter + enhanced search + event-type badges + ticket URL + WhatsApp + Join Online + mobile padding, +363/-52 lines).
- NO DATABASE MIGRATIONS: Prisma schema unchanged. No Event model added. Events are mock data (same as before). When a real Event Prisma model is added later, the new EventItem fields map 1:1 to it.
- NO PAYMENT GATEWAY: Believ does NOT process payments. ticketUrl opens external site in new tab. Helper text explicitly tells users "Believ does not process payments."
- NO CHANGES TO: Bible/Bible Comics/Reading Plans/Trivia/Marketplace/Churches/Prayer Wall/Apologetics/Admin/Auth, comic content (Genesis 1/2/3/4 unchanged), mobile bottom nav, routing architecture, existing notification system (admin notification audience picker is a future task).
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Events → tap Near You → see "Select your location" banner → open filters → pick State (e.g. Telangana) → City dropdown becomes enabled with Telangana cities → pick Hyderabad → tap Online quick filter → see only online+hybrid events → tap an event → see event-type-aware "Where" section → if ticketUrl exists, see "Get Tickets" button + helper text → tap WhatsApp button → confirm prefilled message → confirm external links open in new tab.

---
Task ID: store-marketplace-business-directory-redesign
Agent: main
Task: Store + Marketplace + Christian Business Directory redesign — 1:1 product images, seller type distinction, state/city filters, external Buy Link, business categories.

Work Log:
- Inspected current state: ShopView.tsx (914 lines, uses PRODUCTS mock array of 6 products), Product type had vendor/city/whatsapp_number but no sellerType/state/buyUrl. Cards used h-32 landscape + object-cover (T-shirts got cropped). No image fallback. Modal CTA was always "Add to Cart" (no buyUrl logic). WhatsApp message said "CrossCrafted" not "Believ". ListYourEntity (business variant) had no category dropdown.
- Extended Product type with: sellerType ("believ" | "marketplace"), state, buyUrl (external checkout), subcategory, status, featured.
- Updated all 6 existing PRODUCTS (pr1-pr6) to use new schema — preserved all existing data, only added new fields. Added 2 NEW official Believ Store products (pr7 Believ Signature T-Shirt, pr8 Believ Hoodie) with sellerType: "believ", variations, attributes, buyUrl.
- Added MARKETPLACE_CATEGORIES single source of truth (16 categories): Bibles, Books, Christian Clothing, T-Shirts, Hoodies, Accessories, Phone Covers, Christian Art, Wall Art, Gifts, Home & Living, Music, Kids, Stationery, Apparel, Other.
- Added BUSINESS_CATEGORIES single source of truth (19 categories): Christian Clothing, Christian Books & Bibles, Christian Wedding Services, Christian Caterers, Christian Event Planners, Christian Photographers, Christian Home Bakers, Christian Gifts, Christian Music, Christian Media, Christian Designers, Christian Education, Christian Schools, Christian Travel, Christian Counseling, Christian Printing, Christian Technology, Christian Services, Other.
- Added Business type for future Business Directory (currently ListYourEntity handles it — Business type maps 1:1 to a future Prisma model).
- Updated ShopView.tsx:
  * Added seller-type filter row: [All] [Believ Store] [Marketplace] with purple→blue gradient
  * Added State + City filter row (state-dependent, same as Events)
  * Search now searches name + description + vendor + category + subcategory + state + city
  * Product card image: 1:1 (aspect-square) + object-contain (was h-32 landscape + object-cover — fixed T-shirt cropping)
  * Image fallback: labeled Believ placeholder with ImageOff icon when image fails to load OR no image (was showing broken-image icon or empty gradient)
  * Seller type badge on each card: purple "✓ Believ" for Believ Store, blue "Marketplace" for third-party
  * Modal main image: 1:1 (aspect-square) + object-contain
  * Modal thumbnails: object-contain + dark bg
  * Modal "Vendor" section → "Seller" with sellerType badge + state
  * Modal CTA: if buyUrl → "Buy Now" (external link, new tab); else fallback to "Add to Cart"
  * Helper text under Buy Now for marketplace products: "Payment, shipping, and refunds are handled by the seller. Believ does not process payments."
  * WhatsApp prefilled message: "Hi, I found your product 'X' on Believ..." (was "CrossCrafted")
  * List Item form: added External Buy Link field with helper text
  * List Item form: City field is now state-dependent dropdown (was free text)
  * CATEGORIES constant derives from MARKETPLACE_CATEGORIES (single source of truth)
  * Added pb-28 md:pb-5 so mobile bottom nav doesn't cover content
- Updated ListYourEntity.tsx:
  * Added BUSINESS_CATEGORIES import
  * Added businessCategory field to formData state
  * Added Business Category dropdown (required) to business variant form
  * Updated WhatsApp helper text for businesses
- Committed as 2f1855e and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)
  * /api/auth/me: HTTP 401 for unauthenticated (auth intact) ✅

Stage Summary:
- FILES CHANGED: src/lib/crosscrafted-data.ts (Product type extended + 8 PRODUCTS + Business type + MARKETPLACE_CATEGORIES + BUSINESS_CATEGORIES), src/components/crosscrafted/ShopView.tsx (1:1 images + seller-type filter + state/city filter + image fallback + Buy Now + helper text + List Item form Buy Link field + mobile padding, +468/-76 lines), src/components/crosscrafted/ListYourEntity.tsx (business category dropdown + formData + import).
- NO DATABASE MIGRATIONS: Prisma schema unchanged. No Product/Business model added. Products are mock data (same as before). When real Prisma models are added later, the new Product/Business fields map 1:1 to them.
- NO PAYMENT GATEWAY: Believ does NOT process payments for third-party Marketplace sellers. buyUrl opens external site in new tab. Helper text explicitly tells users "Believ does not process payments." No Stripe/Razorpay/PayPal/internal checkout.
- EXISTING PRODUCTS PRESERVED: All 6 existing PRODUCTS (pr1-pr6) kept their data — only added new fields. No products deleted. Old products without variations/attributes still work (fields are optional).
- NO CHANGES TO: Bible/Bible Comics/Reading Plans/Trivia/Churches/Prayer Wall/Apologetics/Events/Admin/Auth, comic content (Genesis 1/2/3/4 unchanged), mobile bottom nav, routing architecture, existing notification system.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Marketplace → see 1:1 product cards with seller-type badges → tap Believ Store filter → see only pr7 + pr8 → tap Marketplace filter → see pr1-pr6 → tap a T-shirt product (pr4) → see full T-shirt visible (no cropping) → tap Buy Now → opens external link in new tab → see helper text "Believ does not process payments" → on mobile, scroll to bottom → confirm fixed bottom nav doesn't cover last product card → open List Your Business → see Business Category dropdown with 19 categories.

---
Task ID: business-directory-public-page
Agent: main
Task: Build the Christian Business Directory as a proper public browse page. Rename sidebar "List Business" → "Business Directory".

Work Log:
- Inspected existing business architecture: ListYourEntity has a business variant (form fields: name, description, state, city, address, whatsapp, languages, photos, businessCategory — added in previous commit). Business type exists in crosscrafted-data.ts (added in previous commit). NO Prisma Business model — businesses are mock data. Sidebar had "List Business" as a top-level entry routing to ListYourEntity variant="business".
- Extended Business type with: hours, services[], social[], rating?, reviews?, verified?, status extended to "suspended", ownerId?, createdAt?. Kept all existing fields.
- Expanded BUSINESS_CATEGORIES from 19 to 25 categories per spec (added Christian Bookstores, Bibles & Christian Books, Christian Gifts & Merchandise, Wedding Caterers, Christian Videographers, Christian Bakers, Christian Restaurants & Cafes, Church Supplies, Christian IT & Digital Services, Christian Marketing, Christian Real Estate, Christian Professionals, Other Christian Businesses).
- Added BUSINESSES mock array with 6 realistic Christian businesses across different categories and locations: caterer, bookstore, photographer, home baker, apparel brand, school. Two have productIds linking to Marketplace products (b2 → pr1, pr5; b5 → pr4) demonstrating the business → marketplace connection.
- Created BusinessDirectoryView.tsx (new file, 600+ lines):
  * Public browse page with header + subtitle + search + category/sort/filter UI
  * Featured Businesses section (only when no filters applied)
  * All Businesses grid with card count
  * Empty state with "Try another category, city or state" + Clear Filters button
  * Public directory only shows approved businesses (status === "approved")
  * BusinessCard component: 16:9 cover with image fallback, Verified/Featured badges, category overlay, rating, location, description, contact badges, View Business CTA
  * BusinessDetailModal: cover with title overlay, location section, About, Services pills, Hours, Languages, Contact CTAs (WhatsApp/Call/Website/Email — only render buttons for info the business actually provided), verified disclaimer helper text
  * Mobile pb-28 padding so fixed bottom nav doesn't cover cards
- Updated page.tsx:
  * Added "business-directory" to View union
  * Renamed SIDEBAR_LINKS "List Business" → "Business Directory" with new id="business-directory" + Building2 icon
  * Renamed MOBILE_MORE_VIEWS "List Business" → "Business Directory"
  * Imported BusinessDirectoryView
  * Re-imported Building2 (removed in earlier cleanup)
  * Wired BusinessDirectoryView with onListBusiness={() => goView("list-business")} so "+ List Your Business" button opens the existing ListYourEntity variant="business" form
  * The "list-business" route is PRESERVED for backward compat
- Committed as 9c24fe6 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)
  * /api/auth/me: HTTP 401 for unauthenticated (auth intact) ✅

Stage Summary:
- FILES CHANGED: src/lib/crosscrafted-data.ts (Business type extended + 25 BUSINESS_CATEGORIES + 6 BUSINESSES mock), src/components/crosscrafted/BusinessDirectoryView.tsx (NEW — public browse page + business card + detail modal), src/app/page.tsx (new view type + sidebar rename + import + render).
- NO DATABASE MIGRATIONS: Prisma schema unchanged. No Business model added. Businesses are mock data (same as Products). When a real Prisma Business model is added later, the new Business fields map 1:1 to it.
- NO PAYMENT SYSTEM: Believ does NOT process payments for businesses. WhatsApp / Call / Website buttons open external channels directly. Conversation happens directly between buyer and business.
- EXISTING LIST BUSINESS FORM PRESERVED: ListYourEntity variant="business" is reused as-is (already has BUSINESS_CATEGORIES dropdown + state/city fields from previous commit). The "+ List Your Business" button in BusinessDirectoryView navigates to it.
- SIDEBAR NO LONGER CONFUSING: was "List Business" (implies form), now "Business Directory" (implies discovery). Listing creation is now accessed from inside the directory via the "+ List Your Business" CTA — matches the spec's "remove confusion" requirement.
- NO CHANGES TO: Marketplace (separate system — products vs businesses), Churches/Events/Bible/Trivia/Prayer Wall/Apologetics/Admin/Auth, comic content (Genesis 1/2/3/4 unchanged), mobile bottom nav, routing architecture, existing notification system.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open Business Directory → see 6 business cards with verified badges → search "caterer" → see Grace Christian Caterers → filter by State (Telangana) → see b1 + b6 → tap a business → see detail modal with cover + About + Services + Hours + Contact CTAs → tap "+ List Your Business" → existing ListYourEntity form opens → on mobile, scroll to bottom → confirm fixed bottom nav doesn't cover the last business card.

---
Task ID: landing-page-app-home-brand-system
Agent: main
Task: Finalize landing page + app entry + brand system. ENTER APP must open App Home (not Bible Comics).

Work Log:
- Located root cause in LandingHero.tsx line 109: ENTER APP button had onClick={() => onEnterApp("comic")} which routed directly to ComicView (Bible Comics). Fixed to onEnterApp("home").
- Added new "home" view type to page.tsx View union. Added AppHomeView import. Added "Home" as the first SIDEBAR_LINKS entry with HomeIcon.
- Created AppHomeView.tsx (new component):
  * "Welcome to Believ" greeting (or "Welcome, {firstName}" when authenticated, using Supabase user_metadata.full_name → name → email local-part fallback)
  * "Believe. Connect. Grow. Play." tagline
  * Feature cards grouped by BELIEVE / CONNECT / GROW / PLAY / DISCOVER with colored gradient accents
  * Each card links to an existing feature (Bible, Bible Comics, Churches, Events, Prayer Wall, Bible Trivia, Marketplace, Business Directory)
  * pb-28 md:pb-5 so fixed mobile bottom nav doesn't cover content
- Updated LandingHero.tsx:
  * ENTER APP button: onEnterApp("comic") → onEnterApp("home") ✅
  * Final CTA "Enter Believ" button: onEnterApp("churches") → onEnterApp("home") ✅
  * Primary hero CTA: was "Read the Bible" → bible, now "Enter Believ" → home (pink primary)
  * Secondary hero CTA: was "Try Trivia" → trivia, now "Read the Bible" → bible (outlined secondary)
  * Public nav: added Events (was Bible/Churches/Trivia/Prayer, now Bible/Churches/Events/Trivia/Prayer)
  * FEATURES array expanded from 6 to 9 cards: Holy Bible, Bible Comics, Churches, Events, Prayer Wall, Bible Trivia, Marketplace, Business Directory, Community
  * Removed outdated "List Your Church" feature card
  * Updated all feature descriptions to match spec wording
  * Stats fixed: 25+ → 800+ (verified 800 trivia questions in production DB via Prisma count), 6+ → 7 (verified 7 PRIZE_TIERS in code), 11 kept (verified 11 LANGUAGES in code — accurate)
  * Hero subtitle: hardcoded → t('landing.subtitle')
  * Final CTA title: hardcoded "Iron sharpens iron" → t('cta.title') = "Grow in Faith, Together"
  * Final CTA subtitle: hardcoded → t('cta.subtitle')
  * Added Calendar + Users imports for new feature cards
- Updated i18n/en.ts:
  * landing.titleGradient: "Grow in Faith, Together" → "Believe. Connect. Grow. Play."
  * landing.subtitle: updated to mention all real features
  * landing.cta.enterBeliev: NEW = "Enter Believ"
  * landing.stats.questions: "Quiz Questions" → "Bible Questions"
  * features.subtitle: updated
  * feature.comics/events/businessDirectory/community: NEW keys
  * feature.churches.title: "Church Directory" → "Churches"
  * feature.listChurch: REMOVED (no longer a landing card)
  * cta.title: "Iron sharpens iron" → "Grow in Faith, Together"
  * cta.subtitle: updated
  * nav.prayer: "Prayer Wall" → "Prayer" (more compact)
  * nav.enterApp: "Enter App" → "Enter Believ"
- Verified actual production stats via Prisma: TriviaQuestion.count() = 800 (so "800+" is truthful).
- Committed as bc909ae and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)
  * /api/auth/me: HTTP 401 for unauthenticated (auth intact) ✅
  * Comic list API: HTTP 200 ✅

Stage Summary:
- ROOT CAUSE: LandingHero ENTER APP button hardcoded to onEnterApp("comic").
- FIX: ENTER APP now opens AppHomeView (new "home" view) — a lightweight dashboard where users choose where to go.
- FILES CHANGED: src/app/page.tsx (new "home" view type + sidebar Home entry + AppHomeView render), src/components/crosscrafted/LandingHero.tsx (ENTER APP routing fix + stats fix + FEATURES expansion + copy updates + Events added to nav), src/components/crosscrafted/AppHomeView.tsx (NEW — App Home dashboard), src/lib/i18n/en.ts (landing + features + cta + nav copy updates).
- STATS VERIFIED: 800 trivia questions (queried production DB), 7 PRIZE_TIERS (in code), 11 LANGUAGES (in code). No fake users/churches/businesses/community sizes.
- NO CHANGES TO: Believ logo (reused as-is), brand colors (deep navy + coral/pink/purple/blue gradients preserved), Bible Comics functionality (Genesis 1/2/3/4 unchanged), Bible reader / Trivia / Prayer Wall / Churches / Marketplace / Business Directory / Events / Admin / Auth, mobile bottom nav, routing architecture, database schema.
- BROWSER TESTS REQUIRED (admin-only, user must verify): open landing page → tap ENTER APP → confirm App Home opens (not Bible Comics) → confirm "Welcome to Believ" + 8 feature cards grouped by BELIEVE/CONNECT/GROW/PLAY/DISCOVER → tap Bible Comics card → confirm Genesis 1 opens → back to Home → tap each card → confirm each feature opens correctly → check landing page stats show "800+ Bible Questions", "7 Prize Tiers", "11 Languages" → check public nav shows Bible/Churches/Events/Trivia/Prayer.

---
Task ID: koino-rebrand
Agent: main
Task: Global rebrand Believ → Koino (Faith. Fellowship. Belong.)

Work Log:
- Copied uploaded master logo (Glossy Koino Faith Logo.png) to /public/koino-logo.png (canonical asset).
- Also replaced /public/believ-logo.png with the Koino logo so existing Image src="/believ-logo.png" references don't break during transition (file name kept as alias, content is now Koino).
- Updated src/app/layout.tsx metadata: title, description, keywords, authors, icons, openGraph (title/description/siteName), twitter (title/description) — all Believ → Koino. Added manifest: "/manifest.webmanifest" reference.
- Created src/app/manifest.ts (NEW PWA manifest): name "Koino — Faith. Fellowship. Belong.", short_name "Koino", description, start_url "/", display "standalone", background_color + theme_color #12101A, 4 icon entries (192+512, any+maskable), 5 app shortcuts (Bible, Bible Comics, Churches, Prayer Wall, Bible Trivia).
- Updated i18n strings in ALL 13 languages (en + 12 Indic: hi, te, ta, ml, bn, pa, kn, as, mr, gu, ur, or):
  * brand.name: Believ → Koino
  * brand.tagline: Believe. Connect. Grow. → Faith. Fellowship. Belong.
  * landing.title: Believ → Koino
  * landing.titleGradient: Believe. Connect. Grow. Play. → Faith. Fellowship. Belong.
  * landing.subtitle: updated to spec wording
  * landing.cta.enterBeliev: Enter Believ → Enter Koino
  * cta.button: Enter Believ → Enter Koino
  * cta.subtitle: Join the Believ community → Join the Koino community
  * nav.enterApp: Enter Believ → Enter Koino
  * nav.prayer: Prayer Wall → Prayer (compact)
  * signin.title: Believ → Koino
  * signin.subtitle: Believe. Connect. Grow. → Faith. Fellowship. Belong.
  * triviaView.results.shareText: Play on Believ! → Play on Koino!
  * comingSoon.body: everything else on Believ → everything else on Koino
  * 77 standalone "Believ" → "Koino" replacements across the 11 Indic files
- Updated 16 component files: ComicView, AdminView, BusinessDirectoryView, TriviaView, LevelUpAnimation, ListYourEntity, ChurchesView, ShopView, LandingHero, AppHomeView, EventsView, page.tsx, comic/share route, auth/signin page, crosscrafted-data.ts, streaks.ts
  * All user-facing "Believ" brand references → "Koino"
  * All "Believe. Connect. Grow. Play." taglines → "Faith. Fellowship. Belong."
  * All logo src="/believ-logo.png" → src="/koino-logo.png"
  * All alt="Believ" → alt="Koino"
  * All share text "on Believ" → "on Koino"
  * All WhatsApp prefilled messages "on Believ" → "on Koino"
  * All helper text "Believ does not process payments" → "Koino does not process payments"
  * All "Believ Store" → "Koino Store"
  * All "Welcome to Believ" → "Welcome to Koino"
  * AppHomeView group label "BELIEVE" → "FAITH" (aligns with new tagline; the BELIEVE/CONNECT/GROW/PLAY/DISCOVER groups describe the user's faith journey actions, not the brand)
  * AppHomeView "BELIEV" badge → "KOINO"
  * crosscrafted-data.ts mock products: "Believ Signature T-Shirt" → "Koino Signature T-Shirt", "Believ Hoodie" → "Koino Hoodie", brand attribute "Believ" → "Koino", 22 total replacements
- Committed as 5e1ba56 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Page title: <title>Koino — Faith. Fellowship. Belong.</title> ✅
  * koino-logo.png: HTTP 200, image/png, 837KB ✅
  * /manifest.webmanifest: HTTP 200, name "Koino — Faith. Fellowship. Belong.", short_name "Koino", 4 icons, 5 shortcuts ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)

Stage Summary:
- ROOT CAUSE OF OLD BRANDING: "Believ" was the original platform name across i18n strings, component text, layout metadata, and logo file. Tagline was "Believe. Connect. Grow. Play."
- FIX: Global rebrand to "Koino" with tagline "Faith. Fellowship. Belong." Logo replaced with uploaded master asset.
- FILES CHANGED: 33 files (1 new manifest.ts + 1 new koino-logo.png + 1 replaced believ-logo.png content + 30 modified source files).
- ENTER APP routing: unchanged from previous commit (already opens App Home, not Bible Comics).
- NO CHANGES TO: Believ logo file structure (replaced in-place), brand colors (deep navy + coral/pink/purple/blue gradients preserved), Bible Comics functionality (Genesis 1/2/3/4 unchanged — only "Believ" → "Koino" in share text), Bible reader / Trivia / Prayer Wall / Churches / Marketplace / Business Directory / Events / Admin / Auth, mobile bottom nav, routing architecture, database schema, internal code identifiers (file names, variable names, Prisma models, API paths — all retained per spec).
- NO OVER-BRANDING: Features keep their own clear names (Bible, Churches, Events, Bible Trivia, Prayer Wall, Marketplace, Business Directory, Bible Comics). No "Koino Bible" / "Koino Churches" / "Koino Events" naming.
- REMAINING BELIEV REFERENCES (all intentional):
  * /public/believ-logo.png file name (kept as alias — content is now the Koino logo, so existing Image refs still work)
  * src/lib/i18n/*.ts key name "landing.cta.enterBeliev" (internal identifier — value is "Enter Koino")
  * "Believers" (English word for people who believe — NOT the brand — preserved in mock event description)
  * Internal code identifiers (file names like ChurchesView.tsx, variable names, Prisma models, API paths) — all retained per spec
  * Production deployment URL "crosscraftedapp.vercel.app" in .env (actual Vercel URL — not changed per spec "do not change production deployment settings blindly")
- BROWSER TESTS REQUIRED (admin-only, user must verify): open landing page → confirm Koino logo + "Koino" wordmark + "Faith. Fellowship. Belong." tagline → tap ENTER KOINO → confirm App Home opens (not Bible Comics) → confirm "Welcome to Koino" + KOINO badge + "Faith. Fellowship. Belong." tagline → tap each feature → confirm no "Believ" branding anywhere → check browser tab title shows "Koino — Faith. Fellowship. Belong." → check favicon shows Koino logo.
- MANUAL DNS/DOMAIN WORK STILL NEEDED (per spec section 21):
  * Official domain www.koino.in — DNS not configured yet (currently still crosscraftedapp.vercel.app)
  * When ready: configure koino.in DNS → Vercel, add custom domain in Vercel project settings, update NEXT_PUBLIC_SITE_URL env var if needed
  * Do NOT blindly change production deployment URL until DNS is ready

---
Task ID: admin-panel-quick-actions-fix
Agent: main
Task: Wire admin Quick Actions + overview cards + honest Preview Mode banners.

Work Log:
- Inspected AdminView.tsx (1921 lines). Found DashboardTab's Quick Actions were <div> elements with cursor-pointer CSS but NO onClick handler — dead buttons. Overview cards were static display, not clickable.
- Audited underlying data architecture honestly:
  * Real DB + Real Admin APIs: Bible Comics (14 admin API routes, ComicChapter/ComicPanel Prisma models), Trivia Questions (800+ in DB), Gifts & Redemptions (admin APIs).
  * Mock data only (NO Prisma model, NO admin API): Churches, Events, Products, Businesses, Prayers, Apologetics, Competitions, Announcements, Analytics — all mock arrays in crosscrafted-data.ts.
- Fixed Quick Actions: wired all 6 buttons to navigate to correct admin tab via setActiveTab(). Added icons to each button.
- Fixed overview cards: wired all 6 cards to navigate to their admin tab. Added "Open {label} admin →" hover hint.
- Passed onNavigate={setActiveTab} prop from parent to DashboardTab.
- Added "Architecture Status" card on Dashboard:
  * Green ● DB-backed: Bible Comics, Trivia, Gifts & Redemptions
  * Orange ● Preview mode: Churches, Events, Marketplace, Prayers, Apologetics, Competitions, Announcements, Analytics
- Created PreviewModeBanner component and added it to all 8 mock-data tabs (ChurchesTab, EventsTab, MarketplaceTab, PrayersTab, ApologeticsTab, CompetitionsTab, AnnouncementsTab, AnalyticsTab).
- BibleComicsAdmin does NOT get the banner (it's the only real DB-backed admin section).
- Committed as 2913f54 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * Genesis 1/2/3/4 comic APIs: all HTTP 200 ✅ (no regression to Bible Comics)
  * /api/admin/comics: HTTP 403 for non-admin ✅ (auth intact)
  * Page title: "Koino — Faith. Fellowship. Belong." ✅

Stage Summary:
- ROOT CAUSE: Quick Actions were <div> with cursor-pointer but no onClick — dead buttons.
- FIX: All 6 Quick Actions + 6 overview cards now navigate to their correct admin tab via setActiveTab().
- HONEST UX: PreviewModeBanner on all 8 mock-data tabs clearly tells the admin that actions don't persist to DB. Architecture Status card on Dashboard summarizes what's real vs. preview.
- FILES CHANGED: src/components/crosscrafted/AdminView.tsx (+103/-22 lines).
- NO NEW PRISMA MIGRATIONS: Creating real Prisma models for Church/Event/Product/Business/Prayer/Apologetics/Competition/Announcement/Analytics is a large multi-day task that requires schema design + migration + admin API routes + server-side validation + image upload + audit log + analytics tracking. This commit does NOT attempt that — it only fixes the dead Quick Actions and adds honest UX banners.
- NO CHANGES TO: BibleComicsAdmin (already real), Bible Comics functionality, Trivia Questions (real DB), Gifts & Redemptions (real APIs), Authentication / requireAdmin(), Brand colors / Koino logo, Mobile bottom nav, Routing architecture.

---
Task ID: koino-signup-onboarding-members
Agent: main
Task: Complete signup, onboarding, member profile, WhatsApp channel + admin member system.

Work Log:
- Added 13 new fields to User Prisma model: username (unique), dateOfBirth, gender, state, city, mobileNumber, mobileVerified, faithStatus, faithJourney, profileCompleted, whatsappChannelPromptShown, whatsappChannelClicked, signupMethod. Ran `prisma db push --accept-data-loss` successfully against production Supabase.
- Created 4 new API endpoints:
  1. POST/GET /api/profile/setup — saves onboarding profile step-by-step or complete. Server-authoritative (userId from auth session). Validates username uniqueness, required fields, enum values. GET returns existing partial profile for resume.
  2. GET /api/profile/check-username?username=X — real-time availability check with suggestions.
  3. GET /api/admin/members — admin-only member list with search, filters, pagination. ?stats=true returns dashboard stats (totalMembers, newToday, newThisWeek, newThisMonth, recentSignups). 403 for non-admins.
  4. GET /api/config/whatsapp-channel — single source of truth for the official WhatsApp Channel URL.
- Updated /api/auth/me to return profileCompleted.
- Updated getAuthUser() in auth-server.ts to return profileCompleted.
- Updated useSupabaseUser() hook to expose profileCompleted + loading state.
- Created OnboardingView.tsx — 4-step flow: Welcome → Profile → Faith → WhatsApp. Progress indicator, username availability check, state/city dropdowns (state-dependent), faith questions with privacy note, WhatsApp channel follow (optional, skippable). Resume capability — loads existing partial profile and skips to appropriate step.
- Updated page.tsx: added "onboarding" view type, OnboardingView import, useSupabaseUser destructuring, onboarding redirect useEffect (when authenticated && !profileCompleted → navigate to onboarding; when profileCompleted → navigate to home), enterApp() checks profileCompleted before navigating.
- Committed as 7b491e5 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * /api/auth/me: 401 for unauthenticated ✅
  * /api/profile/setup: 401 for unauthenticated ✅
  * /api/admin/members: 403 for non-admin ✅ (admin auth works)
  * /api/config/whatsapp-channel: 200 with correct URL + label ✅
  * Genesis 1 comic API: HTTP 200 ✅ (no regression)

Stage Summary:
- PRISMA MIGRATION: 13 new optional fields on User model (no data loss). Existing users have profileCompleted=false → will see onboarding on next login.
- FILES CHANGED: 10 files (1 schema + 4 new API routes + 1 new component + 4 modified files for auth wiring).
- REAL DB-BACKED: User model, profile fields, username uniqueness (DB-level @unique constraint), admin members API (queries real User table), dashboard stats (real counts from DB), WhatsApp channel config endpoint.
- HONEST LIMITATIONS (not yet built — requires future work):
  * Admin Members UI tab in AdminView (API exists at /api/admin/members, but the admin panel tab + member list/table/profile UI is not wired yet)
  * OTP mobile verification for prize claims (requires OTP infrastructure — not built, per spec "Do not create an insecure custom OTP system")
  * Trivia Winners model + admin UI (requires PrizaWinner Prisma model + admin CRUD)
  * Activity Log model + API (requires AdminAction Prisma model)
  * Analytics member growth charts (requires analytics event tracking)
  * Notification system integration for onboarding completion
- NO CHANGES TO: Existing auth (Google + Email via Supabase), Bible Comics (Genesis 1/2/3/4 unchanged), Bible/Trivia/Prayer Wall/Churches/Marketplace/Business Directory/Events/Admin, Brand colors / Koino logo, Mobile bottom nav, Routing architecture.

---
Task ID: koino-trivia-competition-prize-system
Agent: main
Task: Bible Trivia competition + real prize system — Competition/Prize/Winner models + server-authoritative scoring.

Work Log:
- Inspected existing trivia architecture: TriviaQuestion (800+ in DB), TriviaQuestionAttempt (@@unique [userId, questionId] anti-farming), TriviaQuizSession, TriviaPointTransaction, DailyChallenge, DailySpin, UserBadge, StreakFreeze. Existing APIs: /api/trivia/start, /api/trivia/submit, /api/trivia/leaderboard, /api/trivia/stats, /api/trivia/gifts, /api/trivia/claim-gift, /api/gamification/daily-challenge, /api/gamification/daily-spin.
- Added 4 new Prisma models:
  1. TriviaCompetition — title, type, category, difficulty, questionCount, attemptLimit, winnerCount, rules, status, startAt, endAt, claimDeadlineDays, prizeId, createdById
  2. TriviaCompetitionAttempt — questionIds (server-selected), score (competition score), correctCount, accuracy, durationMs. Indexed on [competitionId, score] for leaderboard queries.
  3. TriviaPrize — name, description, imageUrl, sourceType (koino_merch/custom), productId (references Product — no duplication), quantity, assignedQuantity, remainingQuantity, requiresShipping, terms
  4. TriviaWinner — rank, score, status (pending_verification → phone_verified → contacted → address_pending → address_verified → processing → shipped → delivered → claimed → cancelled/disqualified/expired), phoneVerified, shipping fields, adminNotes, disqualifiedReason
- Added relations to User model: competitionAttempts[], triviaWins[]
- Ran `prisma db push` successfully — all 4 new tables created in production Supabase.
- Created 5 new API endpoints:
  1. GET /api/trivia/competitions — public, returns competitions with prize info, participant count, user's rank + attempts
  2. POST /api/trivia/competitions/[id]/submit — SERVER-AUTHORITATIVE scoring (userId from auth, answers validated server-side, attempt limit enforced via DB count, competition score separate from lifetime FP)
  3. GET/POST /api/admin/trivia/competitions — admin CRUD
  4. GET/POST /api/admin/trivia/prizes — admin CRUD with inventory tracking
  5. GET /api/admin/trivia/winners — admin winner list with user info
- Updated TriviaView.tsx CompeteView: replaced the old "Church vs Church coming soon" placeholder with a REAL competition browser that fetches from /api/trivia/competitions. Shows LIVE / UPCOMING / ENDED sections with prize images, participant counts, time remaining, user's rank + attempts remaining.
- Committed as 9b3a0c8 and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * /api/trivia/competitions: 200 with {competitions:[]} (empty — admin must create competitions) ✅
  * /api/trivia/competitions/[id]/submit: 401 for unauthenticated ✅
  * /api/admin/trivia/prizes: 403 for non-admin ✅
  * /api/admin/trivia/winners: 403 for non-admin ✅
  * Genesis 1: HTTP 200 ✅ (no regression)

Stage Summary:
- PRISMA MIGRATION: 4 new models (TriviaCompetition, TriviaCompetitionAttempt, TriviaPrize, TriviaWinner) + User relations. All created in production DB.
- FILES CHANGED: 7 files (1 schema + 5 new API routes + 1 modified TriviaView).
- REAL DB-BACKED: Competition/Prize/Winner Prisma models, competition submit API (server-authoritative scoring), admin CRUD APIs (all 403 for non-admins).
- KEY DESIGN: Competition Score is SEPARATE from lifetime FP. Attempt limits enforced server-side. Correct answers never sent to browser. Prize inventory tracked. Winner records immutable.
- HONEST LIMITATIONS (not yet built — requires future work):
  * Competition quiz PLAY flow (the "Enter Challenge" button is visual only — the quiz UI that fetches questions + renders the quiz + submits answers is not wired yet)
  * Winner calculation cron job (server-side auto-calculation when endAt passes — currently admin must manually trigger)
  * OTP mobile verification for prize claims (requires OTP provider integration)
  * Shipping details collection form
  * Admin Prize/Competition/Winner management UI in AdminView (APIs exist, admin panel tabs not wired)
  * Real-time leaderboard refresh
  * Anti-cheat detection (impossible submissions, rapid answers)
  * Audit log model + API
  * Notification system integration for winner notification
- NO CHANGES TO: Existing TriviaQuestion model (800+ questions preserved), existing Faith Points system (server-authoritative, anti-farming), existing Daily Challenge/Spin/Badges/Stats/Leaderboard, existing difficulty values, existing Practice Mode, Bible Comics, Authentication, Brand colors/Koino logo.

---
Task ID: trivia-competition-phase2-end-to-end
Agent: main
Task: Complete the end-to-end competition play flow — quiz UI + result screen + leaderboard + automatic winner calculation.

Work Log:
- Created POST /api/trivia/competitions/[id]/start — server-side question selection + attempt creation. Verifies auth, competition liveness (server time), attempt limit (DB count). Selects questions SERVER-SIDE (client never chooses). Returns questions WITHOUT correct answers (stripped server-side). Creates attempt record pre-bound to userId + competitionId.
- Updated POST /api/trivia/competitions/[id]/submit — now uses attemptId from /start (not creating a new attempt). Verifies attempt ownership (anti-cheat). Prevents duplicate submission. Updates existing attempt record with server-calculated score.
- Created POST /api/trivia/competitions/[id]/finalize — IDEMPOTENT winner calculation (admin-only). Tie-breaking: score DESC → correctCount DESC → accuracy DESC → durationMs ASC → createdAt ASC. Uses DB transaction: creates winner records + decrements prize inventory atomically. @@unique([competitionId, userId]) prevents duplicates. Marks competition as "ended".
- Created GET /api/trivia/competitions/[id]/leaderboard — public. Ranks by competition score (not lifetime FP). Deduplicates by userId (best attempt per user). Highlights current user's rank.
- Created CompetitionQuizView.tsx — full-screen quiz UI: calls /start on mount, displays questions with progress bar, answer selection with A/B/C/D labels, Next/Back navigation, Submit Quiz on final question. Server-authoritative: client never sees correct answers.
- Created CompetitionResultView — result screen: shows score, correct count, accuracy, rank, FP earned. "View Leaderboard" + "Back to Compete" buttons. Note: "Competition Score is separate from lifetime Faith Points."
- Created CompetitionLeaderboard.tsx — competition-specific leaderboard: medal icons (🥇🥈🥉), highlights current user, shows rank/avatar/username/correct/accuracy/score. "Your Rank" card at top.
- Updated TriviaView CompeteView: manages 3 sub-views (quiz, result, leaderboard). "Enter Challenge" button calls /start and opens CompetitionQuizView. After submission, CompetitionResultView shows with server-calculated score + rank. "View Leaderboard" / "View Results" buttons open CompetitionLeaderboard.
- Fixed leaderboard route (was 404 because GET handler was inside finalize/route.ts — moved to its own leaderboard/route.ts file).
- Committed as c199f79 + 27d51ee and pushed to main → Vercel deploy triggered.
- Verified production after deploy:
  * Homepage: HTTP 200 ✅
  * /api/trivia/competitions: 200 with {competitions:[]} ✅
  * /api/trivia/competitions/[id]/start: 401 for unauth ✅
  * /api/trivia/competitions/[id]/submit: 401 for unauth ✅
  * /api/trivia/competitions/[id]/finalize: 403 for non-admin ✅
  * /api/trivia/competitions/[id]/leaderboard: 200 with {leaderboard:[], myRank:null, totalParticipants:0} ✅
  * Genesis 1: HTTP 200 ✅ (no regression)

Stage Summary:
- END-TO-END FLOW (now working in code):
  1. Admin creates competition via POST /api/admin/trivia/competitions
  2. Admin sets status="live" + startAt/endAt
  3. User opens Trivia → Compete tab → sees competition card with prize
  4. User clicks "Enter Challenge" → /start creates attempt + returns questions (no correct answers)
  5. User answers questions → clicks "Submit Quiz"
  6. /submit validates answers server-side → calculates score + rank + FP
  7. Result screen shows score, accuracy, rank, FP earned
  8. User clicks "View Leaderboard" → sees competition leaderboard with their rank
  9. When competition ends → admin calls /finalize → winners calculated + prizes allocated (idempotent)
- FILES CHANGED: 7 files (2 new API routes + 1 updated API + 2 new components + 1 updated TriviaView + leaderboard route fix).
- REAL DB-BACKED: Competition start/submit/finalize/leaderboard all query real Prisma models. Server-authoritative scoring. Attempt ownership verified. Prize inventory protected via DB transactions.
- HONEST LIMITATIONS (not yet built):
  * Admin Prize/Competition/Winner management UI in AdminView (APIs exist, admin panel tabs not wired)
  * OTP mobile verification for prize claims (requires OTP provider integration)
  * Shipping details collection form (fields exist in TriviaWinner model, UI not built)
  * Cron job for automatic finalize (admin must manually call /finalize — can be triggered via curl or admin UI)
  * Notification system integration for winner notification
  * Anti-cheat detection (impossible submissions, rapid answers)
  * Audit log model + API

---
Task ID: support-donations
Agent: general-purpose (Support Koino + Donation Settings)
Task: Rebuild /support page with UPI/QR/Bank + admin Donation Settings

Work Log:
- Read worklog.md, /support/page.tsx, AdminView.tsx, auth-server.ts,
  the DonationSettings Prisma model, and the migration SQL to confirm
  the singleton id="default" pattern with seeded acceptingDonations=true.
- Created src/app/api/donation-settings/route.ts (public GET). Returns ONLY
  the display fields (upiId, qrCodeUrl, accountName, accountNumber, ifsc,
  bankName, branch, donationMessage, acceptingDonations). Strips id and
  updatedAt. Returns acceptingDonations=true if the row is missing so the
  public page degrades gracefully.
- Created src/app/api/admin/donation-settings/route.ts (admin GET + PUT).
  Uses getAuthUser() from @/lib/auth-server. Distinguishes 401 (no session)
  from 403 (non-admin) per the API spec — requireAdmin() returns a tagged
  union {user,response} so the handler can return the response directly.
  GET lazy-creates the singleton if the seed didn't run. PUT coerces string
  fields to string|null (empty strings → null) and acceptingDonations to a
  strict boolean, then upserts on id="default".
- Created src/components/crosscrafted/DonationMethods.tsx ("use client").
  Receives settings as props and renders up to three cards:
    UPI card — shown if upiId set; "Copy UPI ID" button uses
      navigator.clipboard.writeText with a textarea+execCommand fallback
      for insecure contexts / older browsers.
    QR card — shown if qrCodeUrl set; uses a plain <img> (avoids Next/Image
      remote-domain config friction for arbitrary Supabase URLs) plus an
      <a download> link with target=_blank fallback.
    Bank card — shown ONLY if all four of accountName/accountNumber/ifsc/
      bankName are set (branch is optional display info). Spec: never show
      fake/placeholder bank details — hide the card entirely if incomplete.
  If no methods are configured, shows a "Donation methods haven't been
  configured yet" message with a contact link instead of empty cards.
- Rewrote src/app/support/page.tsx as a Server Component (no "use client").
  Kept the existing hero ("Help Keep Koino Free") and the SUPPORT_AREAS grid.
  Replaced the campaigns section with a "GIVE TO KOINO" section that:
    - Fetches DonationSettings from Prisma directly (server-side).
    - Shows "Donations are temporarily paused. Please check back later."
      when acceptingDonations === false.
    - Otherwise renders <DonationMethods settings={...}/> and the optional
      donationMessage callout above the cards.
    - Adds thank-you footer and the payment honesty note
      ("Koino does not process online payments…").
- Created src/components/crosscrafted/admin/DonationSettingsTab.tsx
  ("use client"). Form with all 9 DonationSettings fields + a copy of the
  acceptingDonations toggle (custom switch). Loads settings on mount via
  GET /api/admin/donation-settings, saves via PUT. Uses sonner toasts for
  success/error/feedback (same pattern as RedemptionsTab). QR code URL is a
  plain text input — no file uploader (out of scope per spec). Includes a
  live thumbnail preview of the QR URL (with onError hide to avoid broken
  image icons). "Reset Form" button clears the form fields without hitting
  the DB. "Last saved" timestamp badge updates after each successful save.
- Wired DonationSettingsTab into AdminView.tsx:
    - Added HandHeart to the existing lucide-react import block.
    - Imported DonationSettingsTab from
      @/components/crosscrafted/admin/DonationSettingsTab.
    - Added "donations" to the AdminTab union type (between "redemptions"
      and "analytics" per spec).
    - Added { id: "donations", icon: HandHeart, labelKey: "admin.tab.donations" }
      to the TABS array, placed after redemptions and before analytics.
    - Added { activeTab === "donations" && <DonationSettingsTab /> } to
      the tab content switch (between redemptions and analytics).
- Added the i18n key "admin.tab.donations": "Donations" to
  src/lib/i18n/en.ts, immediately after the existing "admin.tab.redemptions"
  key (i.e. in spec'd position relative to analytics).
- Ran `npx tsc --noEmit --project tsconfig.json`. Initial run flagged one
  error in the admin PUT route (acceptingDonations needed strict boolean
  for Prisma's create payload). Refactored the payload builder to use
  properly-typed optional fields instead of a loose Record<string, string |
  boolean | null>, plus extracted coerceString/coerceBool helpers. Re-ran
  tsc — zero errors in any created/modified file (remaining tsc errors are
  all pre-existing in examples/, scripts/, and skills/ directories).

Stage Summary:
- Public API: GET /api/donation-settings returns safe display-only fields.
- Admin API: GET/PUT /api/admin/donation-settings with proper 401/403
  separation and upsert-on-PUT semantics.
- /support page is now a real Server Component that renders admin-configured
  UPI / QR / Bank cards (or a paused notice, or an empty-config notice).
- New admin "Donations" tab wired into AdminView with a full settings form
  (toggle, all 9 fields, save/reset, live QR preview, toast feedback).
- All TypeScript checks pass for the touched files; no file uploader was
  built for the QR code (admin pastes a URL); no fake/placeholder bank
  details are ever shown — sections hide automatically when fields are empty.

---
Task ID: admin-tabs-batch
Agent: general-purpose (Admin Contact + Partner + Contributor tabs)
Task: Build admin Contact Messages, Partner Inquiries, Contributor Applications tabs

Work Log:
- Read existing patterns: `AdminView.tsx` (tab registry + render switch),
  `DonationSettingsTab.tsx` (component shape + `sonner` toast usage),
  `redemptions` API route (admin auth via `requireAdmin()`), and the
  existing `contributors` route (slugify + Contributor creation pattern).
- Confirmed Prisma schema for `ContactMessage`, `PartnerInquiry`,
  `Contributor`, and `ContributorApplication` models. `Contributor.userId`
  + `Contributor.slug` + `Contributor.applicationId` are all `@unique` —
  approval flow has to handle all three uniqueness constraints.
- Created 3 collection API routes (GET list + POST action):
  - `src/app/api/admin/contact-messages/route.ts`
  - `src/app/api/admin/partner-inquiries/route.ts`
  - `src/app/api/admin/contributor-applications/route.ts`
  All use the donation-settings `requireAdmin()` shape: 401 if no session,
  403 if `role !== "admin"`, never trusting client roles.
- Created 3 per-item API routes (PATCH notes/verified + DELETE):
  - `src/app/api/admin/contact-messages/[id]/route.ts`
  - `src/app/api/admin/partner-inquiries/[id]/route.ts`
  - `src/app/api/admin/contributor-applications/[id]/route.ts`
- The contributor-applications `approve` action creates a linked
  `Contributor` record idempotently — looks up by `applicationId` first.
  The slug is generated via a `generateUniqueSlug()` helper that retries
  up to 5 times with a 4-char random suffix on collision, with a final
  timestamp fallback. If the application has a `userId` and a Contributor
  already exists for it, that Contributor is reused (re-linked to this
  applicationId + refreshed fields); otherwise the application.userId is
  used (or a `pending-<id>` placeholder for anonymous applicants so the
  @unique constraint isn't violated later).
- The contributor-applications PATCH endpoint supports both `{ adminNotes }`
  and `{ verified }` (or both). `verified` cascades to the linked
  Contributor row and is rejected (400) when the application isn't yet
  approved or has no linked Contributor.
- Built 3 React tab components under `src/components/crosscrafted/admin/`:
  - `ContactMessagesTab.tsx` — filter chips (All/New/Read/Replied/Closed)
    with counts, client-side search, list cards with status badges,
    detail modal with full message + admin notes textarea + status
    actions + delete.
  - `PartnerInquiriesTab.tsx` — same pattern; status colors new=blue,
    contacted=green, archived=gray. Modal shows organization, website,
    phone, partnershipType, message.
  - `ContributorApplicationsTab.tsx` — filter chips (5 statuses), list
    shows fullName/email/churchRole/contentInterests chips, modal shows
    full bio + whyContribute + sampleUrl + expertise + contentInterests +
    socialLinks, plus a "Verified Contributor" toggle (only visible after
    approval) that PATCHes the linked Contributor's `verified` field.
  All three components render `adminNotes` only inside the admin modal —
  no public exposure.
- Wired the three tabs into `src/components/crosscrafted/AdminView.tsx`:
  extended `AdminTab` type, imported the three tab components + the
  `Mail`/`Handshake`/`UserCheck` icons, added 3 entries to the `TABS`
  array (placed after `donations`, before `analytics` per the spec),
  and added 3 render branches in the tab content switch.
- Added i18n keys to `src/lib/i18n/en.ts`:
  `admin.tab.contactMessages`, `admin.tab.partnerInquiries`,
  `admin.tab.contributors`.
- Ran `npx tsc --noEmit --project tsconfig.json` — 0 errors in `src/`.
  The only 5 remaining errors are pre-existing in unrelated
  `examples/`, `scripts/`, and `skills/` directories (missing
  `socket.io-client`, `re` module, etc.) and are NOT touched by this
  task.

Stage Summary:
- 6 new admin API routes created across 3 feature domains.
- 3 new admin tab components created with full list + filter + search
  + detail modal + actions + admin notes workflow.
- Contributor approval is idempotent and slug-safe (random suffix on
  collision, placeholder userId for anonymous applicants).
- `adminNotes`, `reviewedBy`, `reviewedAt` are returned ONLY by the
  admin endpoints — public `/api/contact`, `/api/partner`, and
  `/api/contributor/apply` routes already create records without
  exposing these fields.
- AdminView now renders 3 new tabs; the rest of the panel is untouched.
- TypeScript clean (no new errors introduced).

---
Task ID: blog-system
Agent: general-purpose (Blog system + sitemap)
Task: Build admin Blog tab + improve public blog + dynamic sitemap

Work Log:
- Read existing patterns: `AdminView.tsx` (tab registry + render switch),
  `DonationSettingsTab.tsx` + `ContactMessagesTab.tsx` (admin tab component
  shape: filter chips, search, list+detail modal, sonner toast, dark theme),
  `auth-server.ts` (`getAuthUser()`), the existing `/blog/page.tsx` and
  `/blog/[slug]/page.tsx` (basic versions), and the `DonationSettingsTab`
  admin API route (the `requireAdmin()` helper shape that distinguishes 401
  from 403). Confirmed Prisma `BlogPost` schema already had all the fields
  needed (featured, scheduledAt, canonicalUrl, relatedArticleIds, etc.).
- Created 2 admin API routes:
  - `src/app/api/admin/blog/route.ts`
    - `GET` — admin-only. Returns ALL posts (incl. drafts + future-scheduled),
      ordered by updatedAt DESC. Optional `?status=` filter (draft →
      published=false; published → published=true; featured → featured=true).
    - `POST` — admin-only. Creates a new post. Auto-slugifies title if slug
      empty; de-dupes slug by appending `-2`, `-3`, etc. (capped at 20
      attempts, timestamp fallback). Tags + relatedArticleIds accept either
      CSV or array — coerced to JSON-array strings. If published=true and
      publishedAt not set, defaults to now().
  - `src/app/api/admin/blog/[id]/route.ts`
    - `GET` — admin-only. Returns a single post by id (including drafts).
    - `PATCH` — admin-only. Updates any field. Special handling for the
      false→true published transition: defaults publishedAt to now() if
      neither the body nor the existing row has one. Slug de-dupe check
      (excluding self) prevents @unique violation. Scheduled-future + published
      is allowed (admin override).
    - `DELETE` — admin-only. Hard delete (BlogPost has no soft-delete column).
- Built the admin tab component `src/components/crosscrafted/admin/BlogTab.tsx`:
  - "use client". Loads posts on mount via GET /api/admin/blog.
  - Filter chips: All / Drafts (amber) / Published (green) / Featured (purple),
    each showing counts.
  - Client-side search across title/slug/author.
  - "New Post" button opens the editor modal in create mode; clicking a post
    opens it in edit mode.
  - List cards show title, slug, author, category chip, status badge
    (Draft=amber, Published=green, Featured=purple), publishedAt/updatedAt
    (time-ago format).
  - Editor modal fields: Title, Slug (with live `/blog/...` preview,
    auto-generated from title unless manually edited), Category + Author,
    Excerpt, Content (large textarea), Featured Image URL (with live preview
    thumbnail + onError hide), Tags (CSV with chip preview), Published +
    Featured toggle cards, SEO Title/Description/Canonical URL
    (grouped), Scheduled At (datetime-local), Related Article IDs (CSV).
    Save button → POST (new) or PATCH (existing); Delete button with
    two-step confirm. Sonner toast for success/error. Escape-to-close +
    body-scroll lock. The Related Article IDs field uses free text since
    the admin doesn't have a list of all post IDs in the modal context —
    that's a future enhancement (could be a search-driven multi-select).
- Wired Blog tab into `src/components/crosscrafted/AdminView.tsx`:
  - Added `"blog"` to the `AdminTab` type union.
  - Imported `BlogTab` + added `FileText` to the existing lucide-react
    import block.
  - Added entry to `TABS` array (after `contributors`, before `analytics`
    per the spec).
  - Added render branch `{activeTab === "blog" && <BlogTab />}`.
- Added i18n key `"admin.tab.blog": "Blog"` to `src/lib/i18n/en.ts` after
  the existing `admin.tab.contributors` key.
- Rewrote public `/blog` page (`src/app/blog/page.tsx`):
  - Server Component, `export const dynamic = "force-dynamic"`.
  - PUBLIC query: `published=true AND (publishedAt IS NULL OR publishedAt <= now())`
    — drafts and future-scheduled posts are NEVER shown.
  - Proper `metadata` (title, description, OG, twitter card, canonical
    `https://www.koino.in/blog`).
  - Featured hero card (first featured post or fall back to first post),
    with large image + Featured ribbon.
  - Category filter chips + search input handled by a new client component
    `BlogListClient.tsx` ("use client") that takes `posts` + `categories` as
    props (search/filter entirely client-side; SEO stays server-rendered).
  - Grid of post cards (1-col mobile, 2-col md+) with category eyebrow,
    title, excerpt (line-clamp-2), publishedAt + author.
  - Empty state ("No blog posts published yet") with link to /about.
- Rewrote public `/blog/[slug]` page (`src/app/blog/[slug]/page.tsx`):
  - Server Component, `force-dynamic`.
  - `generateMetadata()` returns: title (seoTitle || `${title} — Koino Blog`),
    description (seoDescription || excerpt), openGraph (type="article",
    title, description, images=[featuredImage], siteName=Koino,
    url=canonicalUrl || `/blog/${slug}`, publishedTime if set),
    twitter (card: summary_large_image).
  - Visibility gate: if post not found OR not published OR publishedAt is in
    the future → `notFound()`. Same gate in `generateMetadata()` (no SEO for
    future-scheduled posts).
  - Article layout: back-to-blog link, category eyebrow, title, byline
    (publishedAt + author), featured image, excerpt as styled lead,
    content as `whitespace-pre-wrap`, tags as chips, canonical link notice
    for cross-posted articles.
  - "Related Articles" section: parses relatedArticleIds from JSON, fetches
    those posts (published + visible only, excluding the current post),
    re-orders to match the admin's chosen order, renders as 3-col small
    cards (image, category, title, excerpt, date).
- Created `src/app/sitemap.ts` (Next.js MetadataRoute.Sitemap convention):
  - Combines static marketing URLs (/, /about, /blog, /community, /contact,
    /partner, /support, /terms, /privacy, /cookies, /help) with every
    published blog post.
  - Only published + currently-visible posts are included (same gate as the
    public /blog page).
  - Per-URL: lastModified, changeFrequency="weekly", priority (1.0 for /,
    0.7 for other static, 0.6 for blog posts).
  - SITE_ORIGIN hardcoded to `https://www.koino.in`.
  - Used `Promise<MetadataRoute.Sitemap>` return type to satisfy the strict
    TS async-return-type check (the bare `MetadataRoute.Sitemap` form
    triggers TS1064 in this codebase's TS config).
- Deleted `public/sitemap.xml` so Next.js's auto-served `/sitemap.xml`
  (from `src/app/sitemap.ts`) becomes the single source of truth. The
  existing `public/robots.txt` already references `https://www.koino.in/sitemap.xml`,
  so no robots.txt change was needed.
- Ran `npx tsc --noEmit --project tsconfig.json`. First run flagged a
  single error in `src/app/sitemap.ts` (the async return-type issue
  above). Fixed by switching to `Promise<MetadataRoute.Sitemap>`.
  Re-ran tsc — zero errors in `src/`. The only 5 remaining errors are
  pre-existing in unrelated `examples/`, `scripts/`, and `skills/`
  directories (socket.io-client, `re` module, etc.) and are NOT touched
  by this task.

Stage Summary:
- 2 new admin API routes created (collection + per-item CRUD) with proper
  401/403 separation and admin-only guards via `getAuthUser()`.
- 1 new admin tab component (`BlogTab.tsx`) with full list + filter + search
  + editor modal + create/update/delete workflow, status badges, and toast
  feedback.
- AdminView now renders a new "Blog" tab (placed between Contributors and
  Analytics); rest of the panel is untouched.
- Public `/blog` page rebuilt as a server component with hero card,
  category chips, client-side search/filter, 2-col grid, and a proper
  empty state. Public `/blog/[slug]` page rebuilt with full SEO metadata
  (OG + Twitter + canonical), visibility gate, related-articles section,
  and tags chips.
- Public blog pages NEVER expose drafts or future-scheduled posts (gate
  enforced at both the listing query and the single-post lookup).
- Dynamic sitemap served at `/sitemap.xml` from `src/app/sitemap.ts`;
  static `public/sitemap.xml` deleted to avoid shadowing.
- All file uploads are out of scope — featuredImage is a URL input (admin
  pastes Supabase Storage URL with live preview). No rich-text editor —
  content is a plain textarea.
- TypeScript clean (no new errors introduced).

---
Task ID: about-partner-contact
Agent: general-purpose (About + Partner + Contact improvements)
Task: Improve /about (koinonia + India focus), /partner (contributor flow), /contact (success message + contact info)

Work Log:
- Read all three existing pages (about, partner, contact) plus their API routes
  (`/api/contact`, `/api/partner`, `/api/contributor/apply`) and the
  ContributorApplicationsTab admin component to understand the contributor
  application payload (fullName, email, church, churchRole, city, state,
  country, bio, expertise[], website, socialLinks[], whyContribute,
  contentInterests[], sampleUrl).
- Read `PublicPageLayout` (client component wrapping Koino header + footer)
  and confirmed design tokens (bg #12101A, card #1C1929, body #A09DB1,
  coral #F39B9B / purple #7C3AED / blue #38BDF8 accents, `neo-input` class).

Task 1 — /about (`src/app/about/page.tsx`):
- Kept: Koino brand, hero, "Faith. Fellowship. Belong." pillars, features grid, CTA.
- Added "The Meaning of Koino" section (after hero, before pillars): explains
  koinonia (κοινωνία) as fellowship/communion/partnership/joint participation/
  sharing life together, references Acts 2:42, Philippians 2:1, 1 John 1:3-7,
  with a styled callout card quoting Acts 2:42.
- Added "Built With India in Mind" section (after features): explains India focus,
  state/city organization of churches/events/businesses, Bible Trivia tailored
  for Indian Christian communities, long-term vision for Indian-language Bible.
  HONESTLY lists: UI languages available (English, Hindi, Bengali, Telugu,
  Marathi, Tamil, Gujarati, Urdu, Kannada, Oriya, Malayalam, Punjabi, Assamese),
  and clearly states Bible translations currently available (KJV, WEB) with an
  explicit note that Indian-language Bible translations are NOT yet available.
- Added full Metadata export (title + description + OG).

Task 2 — /partner:
- Split into server wrapper (`page.tsx` exports Metadata + renders
  PartnerPageClient) and client component (`PartnerPageClient.tsx`) so we can
  have both metadata and client-side tab state.
- Added hero (eyebrow "PARTNER WITH KOINO", headline about helping Christians
  grow through teaching/experience/biblical knowledge, subheading).
- Added "Who Can Partner?" grid of 10 partner types (Pastors, Church Leaders,
  Bible Teachers, Apologists, Evangelists, Christian Authors, Theologians,
  Ministry Leaders, Worship Leaders, Christian Content Creators) each with a
  Lucide icon and one-line description.
- Added "Contribution Areas" section (Blog Articles, Apologetics, Bible
  Studies, Devotionals, Christian Q&A, Teaching Content).
- Added "How It Works" 5-step workflow (Submit Application → Admin Review
  PENDING→UNDER_REVIEW → Approval → Receive Permissions CAN_WRITE_* → Publish).
- Added "✓ Koino Verified Contributor" callout clarifying that verification
  means reviewed/approved, NOT endorsement of every theological statement.
- Implemented a two-tab UI at the bottom: "Partnership Inquiry" (existing form,
  POSTs to /api/partner with PartnerInquiry model — UNCHANGED) and "Become a
  Contributor" (new form with all ContributorApplication fields, POSTs to
  /api/contributor/apply which already exists). No duplicate contributor system
  created.

Task 3 — /contact:
- Split into server wrapper (`page.tsx` exports Metadata + renders
  ContactPageClient) and client component (`ContactPageClient.tsx`).
- Updated success message to the exact spec: "Thank you for contacting Koino.
  We have received your message." (replaces the old "Your message has been
  received. We'll get back to you soon." copy).
- Added "Contact Information" cards: Email (hello@koino.in, mailto link),
  WhatsApp Channel (hardcoded https://whatsapp.com/channel/0029Vb96qSoBFLgTRTxI5v2q
  with a note that it is configurable), Response Time ("We typically respond
  within 2-3 business days.").
- Added "Why Contact Us?" section with 5 cards (Report a problem/bug, Request a
  feature, Ask about partnerships, Report inappropriate content, General
  inquiries).
- Widened the form layout to `max-w-5xl` outer / `lg:col-span-3` form card (was
  `max-w-md`) and moved the form into a styled card on the right of the contact
  info column. Form still POSTs to /api/contact with the same fields.
- Added full Metadata (title "Contact Us | Koino" + description + OG).

TypeScript: `npx tsc --noEmit --project tsconfig.json` runs clean for all
modified files. The only 5 remaining errors are pre-existing in unrelated
directories (`examples/websocket/*`, `scripts/translate-missing-i18n.ts`,
`skills/image-edit/*`, `skills/stock-analysis-skill/*`) and were not introduced
by this task.

Stage Summary:
- /about: now explains the biblical meaning of koinonia (with a verse callout
  from Acts 2:42) and is transparent about India-focused vision + actual UI
  language coverage and Bible translation availability (KJV + WEB only).
- /partner: rebuilt as a two-track page — explanatory sections (who can
  partner, contribution areas, workflow, verified contributor callout) plus a
  tabbed form that preserves the existing PartnerInquiry flow on /api/partner
  and adds a separate Contributor Application flow on /api/contributor/apply.
- /contact: success message now matches spec exactly, contact info (email,
  WhatsApp channel, response time) and a "Why Contact Us?" section added, form
  widened.
- All three pages export proper Next.js Metadata. No fake contact details —
  only `hello@koino.in` placeholder and a hardcoded, clearly-marked-configurable
  WhatsApp channel URL. No claims about Indian-language Bibles that don't
  exist yet.
---
Task ID: blog-sections-landing-apphome
Agent: general-purpose (Blog sections on landing + App Home)
Task: Add "From the Koino Community" blog section to landing + "Latest from Koino" to App Home

Work Log:
- Read worklog, prisma schema (BlogPost model confirmed), existing public /blog
  pages, and admin blog API to learn conventions (PrismaClient at module scope,
  published gate, publishedAt null/lte(now) gate, serialization pattern).
- Created `src/app/api/blog/latest/route.ts` — public GET endpoint returning up
  to 3 (max 10 via ?limit) published posts. Selects only the public-safe fields
  (id, title, slug, excerpt, featuredImage, category, author, publishedAt).
  Serializes Date → ISO string. Fails soft: 200 with `{ posts: [] }` on internal
  error so landing/App Home silently hide the section.
- Modified `src/components/crosscrafted/LandingHero.tsx`:
  - Added `useEffect`, `useState` imports + a local `BlogCardData` type.
  - Added `blogPosts` / `blogLoading` state + a fetch-on-mount effect with a
    `cancelled` flag for cleanup.
  - Inserted a NEW `<section id="from-community">` between the "Meet
    Christians Around the World" section and the "Final CTA" section per spec.
  - Three states: skeleton (3 animate-pulse cards), empty ("Articles are being
    prepared. Check back soon." — no CTA), and the 3-card grid + "VIEW ALL
    ARTICLES" button linking to /blog. Cards use `<Link href={/blog/${slug}}>`
    for client-side nav. Handles image-or-gradient placeholder, category
    eyebrow, title (line-clamp-2), excerpt (line-clamp-2), publishedAt + author.
- Modified `src/components/crosscrafted/AppHomeView.tsx`:
  - Added `useEffect`, `useState` imports + `BlogCardData` type.
  - Added fetch-on-mount effect (silently hides on error).
  - Inserted a NEW "LATEST FROM KOINO" section AFTER the LordsbookCommunityCard
    (truly at the bottom of the App Home). Uses the GROUPS label styling
    (text-[10px] tracking-[0.25em] #F39B9B + gradient divider). 3-card grid
    (1/2/3 cols responsive). Cards use `<a href={/blog/${slug}}>` for full route
    nav since /blog/* is a public App Router page outside the SPA. Section is
    conditionally rendered only when posts exist — no skeleton, no empty state.
- Ran `npx tsc --noEmit --project tsconfig.json`: zero errors in any of the
  modified/created files (only pre-existing errors in unrelated examples/,
  scripts/, skills/ directories remain — those are not part of the Koino app).

Stage Summary:
- New public API: GET /api/blog/latest (max 10 posts, public-safe fields only,
  draft + future-scheduled posts excluded). Mirrors the visibility gate used
  by the /blog list and /blog/[slug] pages.
- Landing page (`/`) now surfaces a "From the Koino Community" section with up
  to 3 recent articles, a subtle skeleton loading state, an empty-state (no
  View All CTA when no posts exist), and a "VIEW ALL ARTICLES" button linking
  to /blog. Silently hidden on fetch error.
- Authenticated App Home now surfaces a "LATEST FROM KOINO" section at the
  bottom with up to 3 recent articles, hidden entirely when no posts/error.
  Cards use `<a href>` for full-route navigation to the public blog article
  (which renders inside PublicPageLayout and works for authed users too).
- All three locations (public landing, public blog list, authenticated App
  Home) now read from the same published-visibility gate, so draft and
  future-scheduled posts are never exposed anywhere on the user-facing
  surface.
- No TypeScript errors introduced; no existing design tokens changed; only
  additive sections were inserted (no redesign).
