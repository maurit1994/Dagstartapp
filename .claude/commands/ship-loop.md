---
description: Like /ship, but stages 3-5 (test, review, fix) cycle on their own until done — with brakes.
---

Ship this: **$ARGUMENTS**

Same chain as `/ship`, except stages 3-5 repeat without asking me each round.
That only works because "done" is machine-checkable and the brakes are real.
**Read the brakes before you start. A loop without brakes is not automation,
it is a runaway.**

## Stages 1-2 — still supervised
Run `epic-writer`, show me the Open questions, wait for my answers. Then
implement. **Pause before implementing** if the work would change a stored data
shape, add a dependency, or delete a file. Those never become automatic.

## Stages 3-5 — the loop

Repeat:
1. Run the `tester` agent. Capture its verdict.
2. Run the `reviewer` agent. Capture its verdict.
3. If done (below): stop, report.
   Otherwise fix every CRITICAL and HIGH finding plus every failing test, and
   go back to 1.

Append ONE entry per iteration to `docs/reports/NNN-loop-log.md`:

```
Iteration N — tests: <pass | n failing: which>
            — review: <VERDICT> (<n CRITICAL, n HIGH>)
            — action: <what you changed, in one line>
```

## Done criteria — all three, no exceptions
1. `npm test` exits 0.
2. Reviewer verdict is `APPROVE` or `APPROVE WITH COMMENTS`.
3. Every acceptance criterion in the epic is ticked, each with evidence
   (a test name, or a command and its output). An unticked criterion is not
   done, however green the tests are.

## Brakes — any one of these stops the loop immediately
- **Max 3 iterations.** Then stop and report, done or not.
- **Stuck**: the same test fails twice in a row, or the reviewer repeats a
  finding you thought you fixed. Stop — repeating yourself is not progress,
  and a human needs to look.
- **Human triggers**, regardless of iteration count: anything touching a
  stored data shape, deleting a file, adding a dependency, or changing
  `src/lib/storage.js`, `src/lib/migrate.js` or `src/lib/regions.js`.
- **Never** skip, delete or `.only` a test to reach green. If that looks like
  the way out, the brake has already fired — stop and say so.

## When the loop ends
Report in this order: done or which brake fired, the loop log path, what
shipped, what you left undone, and what I still have to verify on my phone.
Do not commit, push, merge or deploy.
