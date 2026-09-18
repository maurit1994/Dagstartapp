# 003 — Beweging: sport and physio, on their own tab

## Why

The previous app (`maurit1994/ds-k9m4x2`) logged sport and physio exercises
inside its body step. Anker dropped both when that step was reworked, and the
user asked for them back.

They belong nowhere near the Dagstart. Exercise does not happen at a fixed
hour — you log it after the gym at seven in the evening — and the morning
routine is already the thing most at risk of being skipped. And unlike the
other daily fields, movement has an obvious weekly shape: how often did I
train, did I keep up the physio. That is a screen, not a card.

The physio note matters more than it looks. It is written on the day
something felt off and read out loud at an appointment two weeks later, which
is exactly when nobody can remember it.

## Scope

A fourth tab, **Beweging**, holding two things:

- **Log** — up to 4 sessions per day, each with a type, a duration and an
  intensity; whether the rest/physio exercises were done; a note for the
  physio. A Vandaag/Gisteren toggle picks which day is being logged.
- **Deze week** — a seven-day strip, counts (days trained, sessions, physio
  done, days logged), a tally per sport type, and the week's physio notes
  gathered in one place.

Options are taken VERBATIM from the previous app: Gym, Hardlopen, Wandelen,
Fietsen, Pilates, Yoga, Zwemmen, Anders, Geen · < 30 min, 30–60 min, 60+ min ·
Laag, Medium, Hoog · Ja/Deels/Nee.

## Out of scope

- The old app's travel-day sport ordering (`SPORT_REIS`). It reordered the
  same list; not worth a mode.
- A derived "recovery score" combining sport, sleep, pain and Garmin. The old
  app had one. A single number computed from six half-measured inputs invites
  more trust than it earns; if it comes back it should be its own decision.
- Anything from Apple Health or Garmin automatically. Local-first, no
  integrations.

## Data

Changes an EXISTING shape. Schema **v5 → v6**, purely additive: a day gains an
optional `movement` block.

```json
"2026-09-18": {
  "movement": {
    "sports": [{ "type": "Gym", "duration": "30–60 min", "intensity": "Medium" }],
    "physio": "done",
    "physioNote": "heup voelde stug bij squats"
  }
}
```

- `movement` is `null` when nothing was answered — true of every day written
  before this existed.
- `"Geen"` is a sport type meaning "I did not exercise today". It is an
  ANSWER, not an absence, so a block holding only that is kept. It is also
  exclusive: if it appears at all the migration collapses the list to it,
  because "no sport, and also an hour of running" cannot both be true.
- `physio` is `done` / `partly` / `missed`, or `null`.
- At most 4 sessions reach storage.

**The day toggle writes to that day's own entry**, rather than storing a
`gisteren`/`vandaag` marker on the session as the old app did. A session
logged on Tuesday that happened Monday night belongs to Monday; every later
question about "how many days did I train" then needs no special handling.

## Acceptance criteria

1. Beweging is a fourth tab, and the Dagstart flow is unchanged in length.
2. A session stores its type, duration and intensity.
3. Choosing "Geen" collapses the list to a single entry and hides duration and
   intensity.
4. A day whose only answer is "Geen" still counts as logged, and does not
   count as a day trained.
5. Logging with the toggle on Gisteren writes to yesterday's key and leaves
   today's entry untouched.
6. Switching the toggle loads that day's stored answers rather than carrying
   the other day's over.
7. The week counts days trained, sessions, physio done (with partly shown
   separately) and days logged, over the last 7 days including today.
8. The physio notes from the last 7 days are gathered in one place.
9. Saving movement leaves the Dagstart's own fields untouched.
10. A v5 export still imports, and its days come back with `movement: null`.

## Open questions

1. Should the week be 7 days or a calendar week (Mon–Sun)? **Answered:
   rolling 7 days**, consistent with `daysInWindow` in History. A calendar
   week makes Monday morning look like failure every single week.
2. Should a missed physio day show in the strip? **Answered: no.** The strip
   is about training; physio has its own counts. Colouring a day red for a
   missed exercise set is the punishment this app deliberately avoids.
