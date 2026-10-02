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
  `mentalload.js` (the household look-ahead list), `migrate.js` (schema
  versions), `streak.js`, `insights.js` (the one line shown after saving,
  and the evening's closing fact), `lookback.js` (one past answer, shown
  back), `trends.js` (the last N days of one field), `vandaag.js` (what
  order the Vandaag cards appear in), `backup.js`, `persist.js`.
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

**That freeze is on the WORDS, not on how often each one is asked.** Cadence
is a separate decision and lives in the same file: every question declares
either a `tier` (asked daily, at that tier) or a `weekday` (asked on that day
only, whatever the mode). A test asserts each question has exactly one of the
two, and that every question is reachable — one nobody is ever asked is worse
than a deleted one, because it sits in the file looking answered-for.

Two modes, Lite (2) and Full (5). Full is a strict superset AND begins with
exactly Lite's, so switching mid-flow keeps your place and loses nothing
(the step you are on does not move; only the total grows). Lite is the
default every day and is never remembered.

### Why the daily set is smaller than the old app's

Six of seven questions asked for free text. Free recall is the most expensive
thing you can ask for at the hour there is least of it, while the scales
beside them cost one tap — the balance was backwards. The user reported the
questions "felt wrong" and stopped filling them in; this is what that was.

- **`goed`** ("Wat ging er GISTEREN goed?") is the hardest retrieval in the
  set and it sat in the SHORT morning set. Now Full only.
- **`dankbaar`** is the one question the evidence says to ask less often, not
  more: counting blessings once a week beat three times a week in
  Lyubomirsky's frequency work, with the more frequent group doing worse.
  Weekly, on Sunday. Weekly questions are asked in BOTH modes, or the ones
  meant to be rare would also be the ones most likely never asked at all.
- **Lite is two**, not three. `bereiken` is load-bearing (the evening quotes
  it, Vandaag shows it all day). `zin` stays beside it because it is the only
  positively-framed question in the short set, and a bad morning opening with
  nothing but "what must I achieve" is a bleak way in.
- Never put two weekly questions on the same day — there is a test.

**`onrustig` is asked in the morning and shown again in the evening.** Its
hint promises "geef het een plek" and for a long time there was none: the
answer was stored and never surfaced again, which is how parking a worry
turns into rehearsing it. `EveningCheckin` renders it read-only above the
priority. Read-only on purpose — the point is a designated moment to look at
it once more, not another field. Do not delete that block without either
closing the loop some other way or dropping the question.

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

## Vandaag reorders itself

The cards are NOT in a fixed order. `lib/vandaag.js` ranks them and `App.jsx`
only maps ids to components, so the rule is testable without a browser — an
order that is subtly wrong looks fine in a screenshot.

Three ranks:

0. **Asking for you.** At most one card is ever here, because `isDagstartDone`
   already guarantees the morning and the evening are never both open. In the
   evening this is the evening check-in, which is why it appears ABOVE the
   morning: at 20:00 the Dagstart is something you read, not something you
   fill in.
1. **The record.** What you have written today. In the EVENING the evening
   comes FIRST, even once it is filled in — the user asked for it above the
   morning "de hele avond", not only while it was still due, choosing
   current-first over chronological. Before the evening hour the same three
   read chronologically: morning, the look-back it earned, then the evening.
   So the record is ordered by where you are in the day, never by what you
   touched last — the latter would make the screen jump for a reason you
   cannot see.
2. **Always there.** Body map, extras, the Sunday cue, and the evening card
   while it is still SHUT. None is ever due — the body map is "asked for by
   nobody" — so none of them outranks the thing you actually did.

Within a rank: rank 1 follows the record order for this hour, everything else
follows `VANDAAG_CARDS`. Keeping the evening-first flip inside rank 1 is what
stops it reaching rank 2 and lifting a SHUT evening card above the body map —
that card is one line of placeholder text, and letting it push the figure down
once put it clean off the bottom of a phone screen. `body` therefore sits
before `evening` in `VANDAAG_CARDS`, and there is a test for each half.

Keys are stable per card id so React MOVES a card rather than remounting it;
a remount here would throw away an open body-map draft mid-edit.

The `DaySwitcher` and `Intention` are pinned above all of it. Everything else
moves, so the screen needs a fixed point, and the priority is meant to stay in
front of you all day regardless.

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

### The evening opens SHORT, like the Dagstart

Three things are in view — **Prioriteit behaald?**, **Focus vandaag**,
**Hoe eindig je de dag?** — with "Dag afsluiten" directly under them. The
other four (reactivity, caffeine, first thing, note) sit behind "Nog 4 dingen
erbij?", collapsed every evening and never remembered, exactly like Lite.

The priority comes FIRST because it closes the loop the morning opened and
quotes your own words back; focus and the closing mood follow. Before this the
evening was seven fields in one scroll with the save button at the bottom —
all-or-nothing at the hour you have least left.

**Four of the seven evening fields used to be WRITE-ONLY.** Only `intention`
(History + insights) and `mental` (History) were ever read back; focus,
reactivity, caffeine and first thing went in and never came out. Collecting a
number nobody looks at is the sharpest version of "I fill it in and nothing
happens". `FocusWeek` in History fixed that for focus. Caffeine and first
thing are still unread: they only pay off as CORRELATES, which needs months,
so they are an investment, not a return — do not pretend otherwise in the UI,
and if they are still unread in a few months, cut them rather than leave them
looking answered-for.

`trends.js`'s `recentSeries` returns the raw series and nothing derived — no
average, no trend line, no correlation. Six points cannot support a claim
about a pattern, and a chart that implies one is a lie with axes on it. Gaps
stay as `null` and render dashed, because a strip that silently closes up
would make six scattered days look like a solid week.

`eveningInsightFor` closes the day with ONE fact: the arc from the morning's
mood to the evening's ("Je begon op 4 en eindigt op 2."). It is the only
honest line available from TODAY alone — no history, no threshold, no
statistics — which is why it works on the first evening rather than in some
month when enough data has accumulated. Both ends are the same 1-5 scale, so
it is one ruler and not two. Like every line in `insights.js` it reports a
decline as readily as a rise, and there is a test for that.

**"Eerste ding vanochtend" is asked in the MORNING** (`FirstThing.jsx`, on
the sleep step) and stored as `entry.eerste`. It used to sit in the evening,
answered at 22:00 about 07:00 — the same retrieval error that moved `goed`
out of the short morning set. Its purpose is to test whether the morning
affects that night's SLEEP, and measurement error in a predictor attenuates
exactly the correlation it is meant to reveal, so a reconstruction that
drifts toward "what I usually do" is the one thing that would hide a real
effect.

It rides along on the sleep step rather than becoming a step of its own: the
Dagstart was just pruned, and the predictor belongs beside the thing it is
hypothesised to affect. `migrateCheckin` folds `evening.eerste` onto the day
and NEVER deletes the evening's copy, so every export written before v9 still
carries the answer and the move stays reversible — the same pattern as
`bereiken` in v4. The evening no longer asks it and no longer lists it in its
summary (the Dagstart summary does, and the fold means that covers old days
too), but `EveningCheckin` still carries the field through a re-save so an
old answer is never wiped, exactly as `pijn` is carried.

Two things to know before building the analysis it exists for:

1. **The day alignment is off by one.** Morning behaviour on day D affects the
   night recorded as `entry[D+1].sleep`, because Anker stores sleep in the
   FOLLOWING morning's Dagstart. Joining day to day compares the morning with
   the night before it — the wrong direction entirely.
2. **The four options are mutually exclusive**, so "Daglicht" competes with
   "Bewegen" when you may have done both: it measures a ranking, not an
   exposure. Renaming or splitting them would make the old and new records
   incomparable, so they stay — but if the analysis finds nothing, this is
   the first place to look before concluding there is no effect.

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
incomparable. The fixed list therefore never grows — `"Anders"` carries a
typed `label` instead, and that name is what the tallies count, via
`sessionName()`. Everything that counts or displays a session goes through
that function, so "Bouldern ×14" appears rather than a useless "Anders ×14",
while an unnamed `Anders` from before v7 still falls back to `"Anders"` and
never vanishes from the tally. The label is cleared whenever the type moves
away from `Anders`, in the form AND in `migrateMovement`: a session must
never read "Gym" with "Bouldern" sitting beside it.

`"Geen"` is a sport type meaning "I did not exercise today" — an ANSWER, not
an absence, so a block holding only it is kept and counts as a logged day. It
is exclusive: `migrateMovement` collapses the list to it, because "no sport,
and also an hour of running" cannot both be true.

**The day is chosen in the week strip, which is why that strip sits ABOVE the
log.** Exercise gets logged late — you remember on Tuesday that you swam on
Saturday — so any of the last 7 days can be filled in, not just today and
yesterday. The strip already says which days are blank, so tapping the blank
one you mean is the shortest route from noticing a gap to closing it, and it
keeps ONE day control on the screen instead of two (the Vandaag tab's
`DaySwitcher` is not used here). Whichever day is selected, the log writes to
that day's OWN entry rather than storing a marker on the session: a session
logged Tuesday that happened Saturday night belongs to Saturday, and every
later question about "how many days did I train" then needs no special
handling.

The selected day lives in `App.jsx` as an OFFSET, not a date key, for two
reasons: saving bumps `dataVersion` and remounts the tab, which would
otherwise snap you back to today halfway through filling in Saturday (the
same remount hazard as everywhere else); and an offset re-derives correctly
across midnight, where a stored key would quietly point at the wrong day.

The week is a rolling 7 days including today, matching `daysInWindow` — a
calendar week makes Monday morning look like failure every single week. A
missed physio day is never coloured as a failure in the strip; that is the
punishment this app exists to avoid. The selection ring sits OUTSIDE the box
so the fill keeps saying how the day went, not where you are.

## Vooruit — the household's mental load

`modules/load/` + `lib/mentalload.js`. A fifth tab. Five is the ceiling at
390px; a sixth would push the labels below a readable size.

Daminger's study of cognitive labour (American Sociological Review, 2019)
splits it into four phases: ANTICIPATING a need before it is urgent,
identifying options, DECIDING, and MONITORING that it happens. The division
between partners is most lopsided at anticipating and monitoring, while
deciding is roughly equal. "Waiting until she says something" is exactly that
shape — taking part in the decision while someone else carries the noticing.

So this is deliberately **not a to-do list**. A task list only starts once
somebody has already noticed, and the noticing is the work being
redistributed. The unit is a thing coming up, how soon it needs someone, and
whether this user RAISED it. `raised` is the measure, not `done`: doing a job
you were handed is not the labour in question.

**It is private to this user, by their explicit choice.** A shared ledger of
who carries what becomes evidence in an argument. Do not add partner
visibility, sharing or comparison without asking — and the stored shape keeps
that door open rather than assuming it.

**Nothing here scores you.** No percentage, no target, no streak; `loadStats`
returns counts and there is a test asserting it exposes no score, target or
streak field. An item noticed three weeks ago and still unraised sorts to the
top, which is information, not a reprimand.

`ReviewCue` is one quiet card on SUNDAY, on the Vandaag tab, offering a way
in. Anticipating is a week-scale operation — a daily prompt would turn it
into the form-filling the Dagstart was just pruned of — and Sunday is the
evening you can still do something about the week ahead. It never says you
are behind and never counts the Sundays you skipped.

The list lives in its own `anker_v1_load` key, beside the check-ins rather
than inside a day: an item is noticed on one day and still true three weeks
later, so it does not belong to a date the way a mood score does. It is in
the backup, and import merges by id — a restore can never un-raise something
you raised.

## Nothing here may punish a missed day

A habit tool ends habits by punishing gaps, not by being too hard. Four
things exist for this, and none of them should be softened into
encouragement — every one states a fact.

- **`daysInWindow` is the headline number** in History ("6 van je laatste 30
  dagen"), not the streak. A streak resetting to zero after one missed day
  tells you the fortnight before the gap no longer counts, which is where
  people stop. `longestStreak` sits beside it so a broken run cannot erase
  that the run happened.
- **`DaySwitcher.jsx`** puts Gisteren beside Vandaag on the Vandaag tab
  (Beweging picks its day from the week strip instead — see above).
  Yesterday is EDITABLE, not merely fillable-when-empty: you remember the
  evening at breakfast, or you tapped the wrong face. Every Vandaag card
  takes `now` as a prop and derives its own date key from it, so App only
  has to hand them a different moment — for yesterday that moment is its
  END (23:59), or the evening card would judge a finished day by this
  morning's clock and stay shut. The container is keyed
  `` `${dataVersion}-${viewDay}` `` because BodyCard, Extras and Checkin
  cache stored values in `useState` initialisers; without the remount a day
  switch would show the other day's answers. It is an exit, not a debt
  collector: the switcher is always there, it never nags, and the only nudge
  is the quiet line under Vandaag when yesterday stayed empty.
  Two days only. Further back belongs in Historie; a date picker on the
  daily screen answers a question nobody has at breakfast.
  (It replaced `BackfillCard.jsx`, which only appeared when yesterday was
  COMPLETELY empty — so a half-filled or simply wrong yesterday could not be
  corrected at all.)
- **"Ik hou het hier bij"** saves and stops on any step. One tapped face is a
  real day; `isDagstartDone` already agreed, and now the UI does too.
- **`insights.js`** returns ONE factual line after saving, or null. No praise,
  no "keep it up" — invented cheerfulness is obvious, and from a health tool
  it is worse than silence. There is a test asserting it never congratulates.
  Its thresholds were once so high it returned null on almost every day, which
  is what "I fill it in and nothing happens" actually was. Two rules fixed
  that: the priority tally needs FOUR evenings in a fortnight, not seven, and
  an extreme mood is named once there are five prior days. Extremes are
  reported SYMMETRICALLY — an app that mentions your best days and stays
  quiet about your worst is flattering you by selection, which is the same
  failure as inventing praise outright. They are phrased in RECORDED days
  ("van je laatste 7 ingevulde dagen"), never calendar days, because "in 30
  days" is a lie when six of them were filled in.
- **`LookbackCard`** shows ONE thing you wrote on an earlier day, picked by
  `lookback.js`. It is the only honest return the app can give in its first
  weeks: real pattern-finding needs dense data before an answer would be true
  rather than merely printable, and printing one sooner is a lie dressed as
  an insight. Your own sentence from three weeks ago needs no statistics.
  The pick is DETERMINISTIC (seeded by the date), because this screen remounts
  after every save and a random pick would flicker and could repeat. It
  prefers days at least a week old — the point is something you could not
  recall unaided — but falls back to recent ones, or the card would stay empty
  for the first week, which is exactly when the habit is least established.
  It sits directly under the Dagstart, not at the bottom: a reward you must
  scroll past four cards to collect is not a reward.

The insight is DERIVED on render, never held in state: saving calls
`onSaved()`, which refreshes the Vandaag cards and remounts the component, so
state set just before that call is thrown away before it is ever painted.
This is the third time that remount has eaten something — check for it.

## Historie: a day opens when you tap it

`DayCard` is a disclosure, not a label. The collapsed row is a glance — face,
date, body summary — and tapping it reveals `DayDetail`: the written answers,
sleep and its Garmin readings, the first thing that morning, sport and physio,
and the whole evening. In place rather than on its own screen, so two days
can be open side by side and there is no back button to find.

`DayDetail` renders answers from `ALL_QUESTION_IDS`, never from today's rules
— the same reason the Dagstart summary does. Which questions get asked depends
on the mode and the weekday and those rules have already changed twice; an
answer given under an older rule has to stay readable, or the record quietly
shrinks every time the app changes its mind.

Every block is skipped when it holds nothing. A day where you only tapped a
face shows one line, not a page of dashes — `Row` returns null rather than
rendering an em dash, because a screen full of "—" reads as data you lost.

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
