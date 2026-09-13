---
description: Ship one feature end to end — epic, implement, test, review — pausing for approval at every handoff.
---

Ship this, one stage at a time: **$ARGUMENTS**

Agents share no memory. Each handoff below passes FILE PATHS, never "the
findings" or "the epic" — the file is the message.

**Pause after every stage and wait for my go-ahead before the next.**

## 1 — Epic
Run the `epic-writer` agent on the request above.
Then show me the path it wrote and its **Open questions**. Do not answer those
questions yourself. Wait: I answer them, and you append my answers to the epic.

## 2 — Implement
Read the epic file. Implement it and nothing beyond it.
Stop and ask me first if the work would: change a stored data shape, add a
dependency, or delete a file. Those are mine to approve, always.
Then show me the diff summary and wait.

## 3 — Test
Run the `tester` agent with this prompt: "Read docs/epics/NNN-<slug>.md and
test the implementation on the current branch. Write docs/reports/NNN-test.md."
Show me its verdict line and wait.

## 4 — Review
Run the `reviewer` agent with this prompt: "Review the diff on the current
branch against main. Read docs/epics/NNN-<slug>.md for intent. Write
docs/reports/NNN-review.md."
Show me its verdict and every CRITICAL and HIGH finding, then wait.

## 5 — Fix
Fix CRITICAL and HIGH findings. Tell me which MEDIUM and LOW ones you are
leaving and why. Re-run `npm test`. Show me the result and wait.

## 6 — Hand back
Summarise in five lines: what shipped, what the tests say, what the review
said, what you deliberately left, and what I still have to verify on my phone.
Do not commit, push, merge or deploy. Those stay mine.
