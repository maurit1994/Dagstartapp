# 001 — Evening check-in

## Why

Anker asks how the day starts but never how it ended. That leaves two gaps.
The daily intention has no feedback loop: you write down the one thing that
matters, and nothing ever asks whether it happened, so over time the intention
becomes a wish you type each morning rather than a commitment. And a single
morning mood reading misses the shape of a day — mornings are often the worst
part of it, which makes the record read bleaker than the day actually was.

## Scope

- An evening block on the Vandaag screen, below the morning check-in.
- Three questions: end-of-day mood (1-5), whether the morning's intention
  happened (gelukt / deels / niet), and an optional note.
- Collapsed before 17:00 local, with a "Nu al invullen" escape hatch; open by
  default from 17:00 so the app asks rather than waits to be asked.
- Editable afterwards, like the morning check-in.
- The result shows in the history card for that day.

## Out of scope

- Notifications or reminders at a set time. iOS web push from a home-screen
  app is its own project, and a nag you cannot silence is worse than none.
- A separate evening tab. One day, one screen.
- Asking the intention question when no intention was set that morning.
- Any charting or trend analysis of morning-versus-evening mood.

## Data

Changes an EXISTING shape, so it needs a schema bump and a migration.

Schema **v2 → v3**. Purely additive: a day gains an optional `evening` key.

```json
"2026-09-14": {
  "mental": 4,
  "body": [{ "region": "hip_l", "pain": 3, "tension": 2 }],
  "note": "slecht geslapen",
  "evening": {
    "mental": 3,
    "intention": "partly",
    "note": "wel gebeld, te laat",
    "savedAt": 1789300311585
  },
  "updatedAt": 1789300311585
}
```

`evening` is `null` when no evening check-in was recorded — which is the
truthful value for every day written before this feature existed, and what the
v2 → v3 migration fills in.

`intention` is one of `done` / `partly` / `missed`, or `null` when unanswered.
Anything else is rejected by the migration rather than stored.

## Acceptance criteria

1. With no evening entry and the local time before 17:00, the card is
   collapsed and offers "Nu al invullen".
2. From 17:00 local, the card is open without being tapped.
3. Saving mood + outcome + note, then reloading the app, shows the saved
   values.
4. The stored day keeps its morning `mental`, `body` and `note` untouched.
5. The intention question appears only when an intention was set that day, and
   quotes it.
6. An evening where nothing was answered is stored as `null`, not as an empty
   object.
7. An intention outcome outside done/partly/missed never reaches storage.
8. A v2 export still imports, and every day in it comes back with
   `evening: null`.
9. The history card for a day with an evening entry shows it.

## Open questions

1. Should a day with a morning check-in but no evening one break the streak?
   **Answered: no.** The streak counts days checked in at all; adding a second
   daily obligation to keep it alive would make the streak punishing rather
   than encouraging.
2. Should the evening mood replace the morning one in the history card's
   emoji, or sit beside it?
   **Answered: beside it.** Replacing it would quietly destroy the morning
   reading, which is the one most likely to matter for a health pattern.
