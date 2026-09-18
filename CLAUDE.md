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
  `questions.js` (the Dagstart questions and the sleep/evening scales),
  `sleep.js` (duration across midnight), `dagstart.js` (is the morning done),
  `scales.js` (the 1-5 colour ramp), `clock.js` (the 24-hour dial's
  geometry), `movement.js` (sport/physio options and the week tally),
  `migrate.js` (schema versions), `streak.js`, `insights.js` (the one line
  shown after saving), `backup.js`, `persist.js`.
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

Two modes, Lite (3) and Full (6). Full is a strict superset AND begins with
exactly Lite's three, so switching mid-flow keeps your place and loses
nothing. Lite is the default every day and is never remembered.

**The length is never chosen up front.** Lite simply starts, and the three
extra questions are offered once the short set is behind you. A fork at the
start is a decision taken at the hour you have least to spend on decisions,
and one you can pick wrong. This changes the order questions are ASKED
against the old app; it changes no wording, and the summary still renders in
ALL_QUESTION_IDS order, so the record is unchanged.

The weekend question appears on FRIDAY only — the old app asked it on Sat/Sun,
which asks about a weekend that is already happening.

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

## Sleep

Its own step in the Dagstart, between mood and the body map — not bolted onto
the body screen as the old app had it, because that screen only just fits a
phone.

Times are set on a 24-hour dial (`components/TimeDial.jsx`) you drag, with
the night drawn as an arc between a moon and a sun handle. Midnight is at the
TOP and time runs clockwise, so a night crossing midnight takes the long way
round the top — the way it was actually slept. All the geometry lives in
`lib/clock.js`, away from the component, because that is the half that fails
quietly (an angle off by 90°, a wrapped night drawn the short way) and the
half that can be tested without a browser.

Three ways in, on purpose: drag (fast, coarse), arrow keys (5 min, 30 with
shift), and the plain time fields below (exact). They edit one value; none of
them suits every morning. Pointer capture is what makes a drag survive your
thumb leaving the circle.

The arc's night-to-dawn gradient is the ONE gradient in the app and the one
documented exception to the colour rules above: it says which end is evening
and which is morning, which is information about the thing being set.

Times are plain "HH:MM" strings with no date attached, and `lib/sleep.js` is
the only place that turns them into a duration. A wake time at or before the
bedtime means the next morning; 23:30 to 07:15 is 7h45m, not minus sixteen
hours. It deliberately does not go through Date — there is no calendar day
here, and dragging one in drags daylight saving in with it.

Garmin readings (Body Battery, Slaapscore, HRV Status) are transcribed by hand
from the watch, so they are clamped to 0-100 and the HRV status is checked
against the three values the watch actually reports. When `gedragen` is false
the readings are discarded: a Body Battery from a watch left on the nightstand
is not a reading. `gedragen: false` is itself a real answer and keeps the
sleep block alive — it differs from never having been asked.

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

## Colour has exactly three jobs

Defined in `src/index.css`. Keep them apart — the moment colour becomes
decoration it stops carrying information.

1. **`accent` marks what to do next**, and nothing else: the primary button,
   the current step, the active tab. One accent element per screen. Never use
   it to make something look nice.
2. **The 1-5 scales colour themselves from their VALUE** via `lib/scales.js` —
   one ramp walked up (mood, sleep, focus: 5 is green) or down (pain, tension,
   reactivity: 5 is red). Carried over from the previous app. Anker briefly
   painted every selected button the same accent blue, which looks tidy and
   tells you nothing at a glance.
3. **`done` marks something finished** and needing nothing from you.

Saturation stays low. This is opened on bad mornings; it must not shout.

`components/Scale.jsx` is the ONE 1-5 scale. There were four near-identical
copies before, which is how they drifted apart in height and wording.

`Screen`'s `tone="quiet"` is the other half of the hierarchy: on a screen with
several cards exactly one should be asking for you, and the rest recede.

## Keep the daily flow short

The Dagstart is the routine, and a routine you stop starting records nothing.
It holds the written questions, mood and sleep — and nothing else.

Three things sit on their own cards BELOW it instead, each writing into the
same day entry:

- **`BodyCard.jsx` (the body map).** Out of the morning sequence on purpose:
  opening the day by scanning yourself for pain makes the pain louder, and it
  is a poor thing to have to do before anything good has happened yet. One tap
  away, all day, for when the body actually asks.
- **`Extras.jsx`** — the Garmin readings and the free note. Worth having,
  not worth a step.
- **`EveningCheckin.jsx`** — gated on the clock AND `isDagstartDone`.

Every one of these writes the SAME day entry, so each must pass the others'
fields through untouched. Checkin passes `body` and `note`; BodyCard and
Extras spread the stored entry before overwriting only their own field. Get
this wrong and saving one silently wipes another — covered by end-to-end
tests that save from each and assert the rest survived.

## Beweging

A fourth tab (`modules/movement/`), not a card on Vandaag. Exercise does not
happen at a fixed hour — you log it after the gym at seven in the evening —
and Vandaag is already five cards deep. It also has a weekly shape the other
fields do not, and that overview is the reason to keep logging at all.

Options are VERBATIM from the previous app, for the same reason as the
Dagstart questions: renaming a category makes the old and new records
incomparable.

`"Geen"` is a sport type meaning "I did not exercise today" — an ANSWER, not
an absence, so a block holding only it is kept and counts as a logged day. It
is exclusive: `migrateMovement` collapses the list to it, because "no sport,
and also an hour of running" cannot both be true.

**The Vandaag/Gisteren toggle writes to that day's OWN entry** rather than
storing a marker on the session. A session logged Tuesday that happened Monday
night belongs to Monday; every later question about "how many days did I
train" then needs no special handling.

The week is a rolling 7 days including today, matching `daysInWindow` — a
calendar week makes Monday morning look like failure every single week. A
missed physio day is never coloured as a failure in the strip; that is the
punishment this app exists to avoid.

## Nothing here may punish a missed day

A habit tool ends habits by punishing gaps, not by being too hard. Four
things exist for this, and none of them should be softened into
encouragement — every one states a fact.

- **`daysInWindow` is the headline number** in History ("6 van je laatste 30
  dagen"), not the streak. A streak resetting to zero after one missed day
  tells you the fortnight before the gap no longer counts, which is where
  people stop. `longestStreak` sits beside it so a broken run cannot erase
  that the run happened.
- **`BackfillCard.jsx`** offers yesterday when yesterday is empty, and
  disappears the moment it is filled. It renders a second `Checkin` with a
  different `now`, which is why Checkin takes `now` and `label` as props.
  It is an exit, not a debt collector.
- **"Ik hou het hier bij"** saves and stops on any step. One tapped face is a
  real day; `isDagstartDone` already agreed, and now the UI does too.
- **`insights.js`** returns ONE factual line after saving, or null. No praise,
  no "keep it up" — invented cheerfulness is obvious, and from a health tool
  it is worse than silence. There is a test asserting it never congratulates.

The insight is DERIVED on render, never held in state: saving calls
`onSaved()`, which refreshes the Vandaag cards and remounts the component, so
state set just before that call is thrown away before it is ever painted.
This is the third time that remount has eaten something — check for it.

## Hosting

`.github/workflows/deploy-pages.yml` publishes to GitHub Pages on every push
to main, running `npm test` first so a broken build cannot reach the phone.
No third-party host and no new account; the cost is that the repository must
be PUBLIC on a free GitHub plan. The code holds no secrets and the data never
enters the repo, so public code is not public data.

Pages serves a project at `/<repo>/`, so the workflow sets `BASE_PATH` and the
PWA manifest follows it — without that the app cannot be installed.

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
