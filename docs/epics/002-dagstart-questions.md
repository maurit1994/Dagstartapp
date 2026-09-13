# 002 — Dagstart questions (Lite/Full) and the full evening check-in

## Why

Anker replaced an older app that is still in the user's GitHub account
(`maurit1994/ds-k9m4x2`). Using Anker, the user found the thing they actually
relied on was missing: a set of written morning reflection questions, and an
evening check-in that reports back on them.

The old app's design carried two ideas Anker lost. First, a **Lite/Full
switch**: three questions on a bad morning, six on a good one. The switch is
the ADHD-friendly part — it lowers the bar to starting at all, which beats a
richer form that gets skipped. Second, the evening asked **"Prioriteit
behaald?"** and quoted that morning's answer back. Without it a daily priority
is a wish typed each morning and never revisited.

Question wording is taken verbatim from the old app, not reinvented.

## Scope

**Morning — Lite (3):** goed, bereiken, zin.
**Morning — Full (6):** the three above plus dankbaar, gedragen, onrustig.
**Weekend:** on Saturday and Sunday a seventh question (`weekend`) is inserted
before the body step, matching the old app's `isWknd` rule exactly.

The mode switch sits at the top of the flow and can be changed mid-check-in.
Lite is the default.

**Evening — six questions plus a note**, from 17:00 local:
pijn nu, focus vandaag, prioriteit behaald, emotionele reactiviteit, cafeïne
na 14:00, eerste ding vanochtend.

**The existing "Intentie" module merges into the `bereiken` question** — they
asked the same thing twice. The Vandaag screen keeps a prominent read-only
card showing today's priority, which links back into the flow to edit it.

## Out of scope

- The old app's Garmin fields, sleep times, sport log and physio notes. Anker
  has its own richer body map; importing the old body step wholesale would
  duplicate it.
- The old app's AI chat panel ("Verdiep je antwoorden") and weekly summary.
  Both called an external API with a user-supplied key; Anker is local-first
  and stays that way.
- Speech input/output.
- Moving the weekend question to Friday. The old app asked it on Sat/Sun; that
  is preserved. Changing it is a separate decision.

## Data

Changes an EXISTING shape. Schema **v3 → v4**, additive plus one move.

```json
"2026-09-14": {
  "mental": 4,
  "mode": "lite",
  "answers": {
    "goed": "eindelijk doorgeslapen",
    "bereiken": "huisarts bellen",
    "zin": "koffie met R."
  },
  "body": [{ "region": "hip_l", "pain": 3, "tension": 2 }],
  "note": "",
  "evening": {
    "mental": 3,
    "intention": "partly",
    "pijn": 2,
    "focus": 4,
    "reactief": 2,
    "cafeine": false,
    "eerste": "Daglicht",
    "note": "",
    "savedAt": 1789300311585
  },
  "updatedAt": 1789300311585
}
```

- `mode` is `lite` or `full`; anything else, or absent, becomes `lite`.
- `answers` holds only the question ids that were answered. Blank answers are
  dropped rather than stored as empty strings.
- `evening.intention` already existed and means exactly "Prioriteit behaald?",
  so it is reused rather than duplicated as `prioriteit`.
- The five new evening fields are `null` when unanswered.

**The move:** today's priority currently lives in its own key,
`anker_v1_intentions` (a date → text map). It becomes `answers.bereiken`. The
migration folds that legacy map into each day's answers on read. An existing
`answers.bereiken` always wins; the legacy value only fills a gap. A date that
exists only in the legacy map gets a check-in entry created for it, so nothing
written before this change becomes unreachable. The legacy key is left in
place, unread-from-once-migrated — never deleted, so a mistake is recoverable.

## Acceptance criteria

1. Lite shows exactly 3 text questions; Full shows exactly 6, in the old app's
   order.
2. Switching Lite → Full mid-check-in keeps answers already given.
3. On Saturday and Sunday the weekend question appears, before the body step;
   on other days it does not.
4. Saving, then reloading, shows every answer given.
5. Blank answers are not stored as empty strings.
6. The evening card shows all six questions plus a note, and quotes that
   morning's `bereiken` answer in the "Prioriteit behaald?" question.
7. An unanswered evening field is stored as `null`, not 0 or "".
8. A v3 export still imports: its days come back with `mode: "lite"`, empty
   `answers`, and the new evening fields `null`.
9. A day that existed only in `anker_v1_intentions` comes back as a check-in
   whose `answers.bereiken` is that text.
10. Where both exist, `answers.bereiken` wins over the legacy intentions value.
11. `mode` values outside lite/full, and `eerste` values outside the four
    options, never reach storage.

## Open questions

1. Should the weekend question move to Friday, where "this weekend" is still
   ahead? **Left as-is** — matching the old app is the safer default; this is
   the user's call to change.
2. Should Full mode be remembered as the new default once chosen, or reset to
   Lite each day? **Reset to Lite each day** — a remembered Full is exactly the
   friction the switch exists to remove.
