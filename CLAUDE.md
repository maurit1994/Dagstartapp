# Anker — standing instructions

Personal daily tool: daily tracking, ADHD support (daily intention), thought
capture, and daily check-ins on mental state and body pain. Local-first,
no backend, no accounts. The human reviewing your work is training to be a
supervisor of AI-written code and is new to JavaScript and React.

## Stack (locked — do not propose alternatives unless asked)

Vite + React (JavaScript/JSX, **no TypeScript**) + Tailwind CSS v4.
Tailwind v4 is configured via the `@tailwindcss/vite` plugin and `@theme` in
`src/index.css`. There is no `tailwind.config.js` or `postcss.config.js`, and
none should be added.

## Commands

- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173)
- `npm test` — run the Vitest suite (data logic); `npm run test:watch` to watch
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the production build locally
- `BASE_PATH=/Repo/ npm run build` — build for a host that serves the app from
  a subfolder (GitHub Pages project sites). Netlify/Vercel/Cloudflare need no
  BASE_PATH; the PWA manifest follows it automatically.

## Architecture

- `src/modules/<feature>/` — self-contained feature modules. A module may
  import from `lib/` and `components/`. A module must never import from
  another module.
- `src/lib/` — shared logic. `storage.js` is the ONLY file allowed to touch
  `localStorage`, and everything it returns has already been through
  `migrate.js`, so the rest of the app never sees an old shape. Also:
  `date.js` (all date keys), `regions.js` (the permanent body-region ids),
  `questions.js` (the Dagstart questions and evening scales), `migrate.js`
  (schema versions), `streak.js`, `backup.js`, `persist.js`.
- `src/components/` — shared presentational UI.
- `src/App.jsx` — the only file that knows about all modules; it wires tabs
  and gates the app behind the PIN screen when one is set.
- `.claude/agents/` — epic-writer, tester, reviewer. `.claude/commands/` —
  `/ship` (supervised) and `/ship-loop` (stages 3-5 cycle, with brakes).
- `docs/epics/NNN-slug.md` — what to build and how to know it is done.
  `docs/reports/` — test runs, reviews, loop logs.

## Conventions

- localStorage keys are prefixed `anker_v1_`.
- Date keys ALWAYS derive from LOCAL time. Never `toISOString()` — it converts
  to UTC and silently shifts the day in other timezones (this has bitten us).
- UI language is Dutch. Code, identifiers and comments are English.
- Body scores are stored as `[{ region, pain, tension }]` against the stable
  ids in `lib/regions.js`, both 0-5, where 0 means "nothing here". A region
  scored 0 on both is dropped rather than stored.
- Region ids may be ADDED but never renamed or removed: stored entries and the
  body map both reference them.
- The stored shape is versioned (`CURRENT_SCHEMA_VERSION` in `lib/migrate.js`).
  Changing it means bumping that version, adding a migration step, and adding a
  test that an export from the OLD version still imports correctly.

## The body map

`modules/checkin/bodyShapes.js` holds the SVG geometry. Shapes are positioned
as the VIEWER sees them, so which region id a shape carries depends on the
view: from the front, the person's left is on the viewer's right; from the
back, it is on the viewer's left. Get that backwards and the app silently
records the wrong side for months. It is covered by tests in
`modules/checkin/__tests__/bodyShapes.test.js` — keep them passing.

Limbs appear on both views and map to the SAME id: there is only one left arm.

The figure is capped by HEIGHT as well as width (`max-h-[46vh]`), and the
score panel is `sticky` at the bottom. Both exist because the first version
was unusable on a phone: a 1:2 figure at full width ran to ~540px, so tapping
a region put the score buttons below the fold and you had to scroll away from
the body to reach them. Tap and score must stay on ONE screen.

## The Dagstart questions

`lib/questions.js`. The wording is taken VERBATIM from the user's previous app
(`maurit1994/ds-k9m4x2`) — these are questions they answered for months, and
rephrasing them quietly changes what gets answered. Do not "improve" them.

Two modes, Lite (3) and Full (6), with Full a strict superset. Lite is the
default every day and is never remembered: a remembered Full is exactly the
friction the switch exists to remove. The weekend question appears on FRIDAY
only — the old app asked it on Sat/Sun, which asks about a weekend that is
already happening.

**Render stored answers from `ALL_QUESTION_IDS`, never from
`questionsForMode`.** Which questions get asked depends on the mode and the
day, and those rules change; an answer already given must stay visible
regardless. Rendering from today's rules once made a `weekend` answer stored
under the old Saturday rule invisible — present on disk, unreachable in the
UI. Same reasoning as the region ids: what was recorded outlives the rule
that prompted it.

`bereiken` ("Wat wil ik vandaag écht bereiken?") is special: the evening asks
whether it was reached and quotes it back. It is also what the Vandaag screen
shows at the top all day. Before v4 it lived in its own `anker_v1_intentions`
key; `migrateCheckins` folds that legacy map into `answers.bereiken` on read
and never deletes it, so the move stays reversible.

## One thing at a time on Vandaag

The Vandaag screen shows the Dagstart OR the evening, never both open at once.
`lib/dagstart.js`'s `isDagstartDone` is the gate: the evening card stays shut
until the morning is answered AND the clock says evening. Both open at once
meant two forms on screen and questions about focus in the middle of a morning
check-in.

`isDagstartDone` is also why the check-in summary is not keyed off "an entry
exists": the evening writes into the SAME day entry, so saving only the
evening used to show an empty "Dagstart ✓" for a morning that never happened.

The evening deliberately does NOT ask "Pijn nu". The body map already records
pain per region with tension beside it; a second single-number pain question
put the same thing on screen twice, at lower fidelity. The field stays in the
schema and old answers still render — only the question is gone.

## The PIN

`lib/lock.js` + `modules/lock/`. It is a COURTESY LOCK and the UI must keep
saying so: the data sits unencrypted in localStorage and anyone who opens
devtools reads it without seeing the lock screen. The PIN is stored as a
PBKDF2 hash with a random salt — a 4-digit PIN has only 10,000 values, so a
bare SHA-256 would be reversed instantly. That protects the PIN, not the data.
Never describe this feature as encryption anywhere in the app or the docs.

## Data safety — non-negotiable

This app holds someone's health record and has no backend to fall back on.
- Never change the shape of stored data without a migration path AND a test.
- Never let a failed write pass silently: `storage.js` throws
  `StorageWriteError` and the UI must surface it.
- Never repair or delete data that fails to parse — leave the raw value in
  place so it can be rescued by hand.
- Import defaults to merge and must never overwrite a newer entry with an
  older one.
- Any change under `src/lib/` needs `npm test` green before it is pushed.

## Guardrails

- Ask before: adding a dependency, deleting a file, or changing the shape of
  anything already stored on disk.
- Prefer small diffs. Do not refactor beyond what was asked.
- Build only what was requested — no extra features, no sample data.
- Explain non-obvious choices in the commit message; assume the reviewer is
  new to React.
