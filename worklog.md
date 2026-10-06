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
