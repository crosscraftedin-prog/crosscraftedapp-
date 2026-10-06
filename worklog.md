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
