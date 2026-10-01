import { describe, expect, it } from 'vitest'
import {
  ALL_QUESTION_IDS,
  FIRST_THING_VALUES,
  questionsForMode,
  QUESTIONS,
  weeklyQuestionsOn,
} from '../questions.js'

// Local dates, so these never drift with the runner's timezone.
const MONDAY = new Date(2026, 8, 14)
const FRIDAY = new Date(2026, 8, 18)
const SATURDAY = new Date(2026, 8, 19)
const SUNDAY = new Date(2026, 8, 20)

const ids = (mode, date) => questionsForMode(mode, date).map((q) => q.id)

describe('questionsForMode', () => {
  it('lite asks two typed questions on an ordinary day', () => {
    // Was three. `goed` asks you to reconstruct yesterday evening, which is
    // the most expensive retrieval in the set and the worst fit for the
    // morning it used to sit in.
    expect(ids('lite', MONDAY)).toEqual(['bereiken', 'zin'])
  })

  it('keeps one positively-framed question in the short set', () => {
    // A bad morning that opens with nothing but "what must I achieve" is a
    // bleak way in, which is why `zin` survives the prune and `goed` does not.
    expect(ids('lite', MONDAY)).toContain('zin')
  })

  it("full asks five, with Lite's FIRST and the extras after", () => {
    expect(ids('full', MONDAY)).toEqual([
      'bereiken',
      'zin',
      'goed',
      'gedragen',
      'onrustig',
    ])
  })

  it('full BEGINS with exactly the Lite questions, so a mid-flow switch keeps your place', () => {
    expect(ids('full', MONDAY).slice(0, 2)).toEqual(ids('lite', MONDAY))
  })

  it('never asks dankbaar on an ordinary day, in either mode', () => {
    // The one question the evidence says to ask less often, not more.
    expect(ids('lite', MONDAY)).not.toContain('dankbaar')
    expect(ids('full', MONDAY)).not.toContain('dankbaar')
  })

  it('full is a superset of lite', () => {
    for (const id of ids('lite', MONDAY)) {
      expect(ids('full', MONDAY)).toContain(id)
    }
  })

  it('treats an unknown mode as lite rather than throwing', () => {
    expect(ids('turbo', MONDAY)).toEqual(ids('lite', MONDAY))
  })

  it('asks bereiken in both modes — the evening checks back on it', () => {
    expect(ids('lite', MONDAY)).toContain('bereiken')
    expect(ids('full', MONDAY)).toContain('bereiken')
  })
})

describe('the weekend question', () => {
  it('appears on Friday, while the weekend is still ahead', () => {
    expect(ids('lite', FRIDAY)).toContain('weekend')
    expect(ids('full', FRIDAY)).toContain('weekend')
  })

  it('does NOT appear during the weekend itself', () => {
    // Asking "what am I planning this weekend" on Sunday afternoon is a
    // question about a weekend that is already over.
    expect(ids('full', SATURDAY)).not.toContain('weekend')
    expect(ids('full', SUNDAY)).not.toContain('weekend')
  })

  it('does not appear on other weekdays', () => {
    expect(ids('full', MONDAY)).not.toContain('weekend')
  })

  it('comes last, so the regular questions keep their order', () => {
    const list = ids('full', FRIDAY)
    expect(list[list.length - 1]).toBe('weekend')
  })
})

describe('the gratitude question', () => {
  it('is asked on Sunday only', () => {
    expect(ids('lite', SUNDAY)).toContain('dankbaar')
    for (const day of [MONDAY, FRIDAY, SATURDAY]) {
      expect(ids('full', day)).not.toContain('dankbaar')
    }
  })

  it('is asked in BOTH modes on its day', () => {
    // A question meant to be rare must not also be the one most likely never
    // to be asked: gating it on Full would do exactly that.
    expect(ids('lite', SUNDAY)).toContain('dankbaar')
    expect(ids('full', SUNDAY)).toContain('dankbaar')
  })

  it('adds exactly one question to the Sunday short set', () => {
    expect(ids('lite', SUNDAY)).toEqual(['bereiken', 'zin', 'dankbaar'])
  })
})

describe('weeklyQuestionsOn', () => {
  it('returns the question whose day it is, and nothing else', () => {
    expect(weeklyQuestionsOn(FRIDAY).map((q) => q.id)).toEqual(['weekend'])
    expect(weeklyQuestionsOn(SUNDAY).map((q) => q.id)).toEqual(['dankbaar'])
  })

  it('returns nothing on a day no weekly question falls on', () => {
    expect(weeklyQuestionsOn(MONDAY)).toEqual([])
    expect(weeklyQuestionsOn(SATURDAY)).toEqual([])
  })

  it('never puts two weekly questions on the same day', () => {
    // Two extra questions on one morning is the pile-up the prune was for.
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(2026, 8, 14 + d)
      expect(weeklyQuestionsOn(date).length).toBeLessThanOrEqual(1)
    }
  })
})

describe('every question has exactly one cadence', () => {
  it('declares either a tier or a weekday, never both and never neither', () => {
    for (const question of Object.values(QUESTIONS)) {
      const daily = question.tier !== undefined
      const weekly = question.weekday !== undefined
      expect(daily !== weekly).toBe(true)
    }
  })

  it('is reachable: every question is asked by some mode on some day', () => {
    // A question nobody is ever asked is worse than a deleted one — it sits
    // in the file looking answered-for.
    const asked = new Set()
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(2026, 8, 14 + d)
      for (const id of ids('full', date)) asked.add(id)
    }
    for (const id of Object.keys(QUESTIONS)) expect(asked).toContain(id)
  })
})

describe('ALL_QUESTION_IDS — the render order for stored answers', () => {
  it('contains every question, including ones not asked today', () => {
    for (const id of Object.keys(QUESTIONS)) expect(ALL_QUESTION_IDS).toContain(id)
  })

  it('still contains weekend, so an answer given under the OLD Sat/Sun rule\n      stays visible now that it is asked on Friday', () => {
    expect(ALL_QUESTION_IDS).toContain('weekend')
  })

  it('is a superset of what any mode or day asks', () => {
    for (const date of [MONDAY, FRIDAY, SATURDAY, SUNDAY]) {
      for (const mode of ['lite', 'full']) {
        for (const id of ids(mode, date)) expect(ALL_QUESTION_IDS).toContain(id)
      }
    }
  })

  it('still contains goed and dankbaar, now that neither is asked daily', () => {
    // Months of answers were stored under the old rules. What was recorded
    // outlives the rule that prompted it.
    expect(ALL_QUESTION_IDS).toContain('goed')
    expect(ALL_QUESTION_IDS).toContain('dankbaar')
  })

  it('keeps its order unchanged by the prune, so old summaries read the same', () => {
    expect(ALL_QUESTION_IDS).toEqual([
      'goed',
      'dankbaar',
      'bereiken',
      'gedragen',
      'onrustig',
      'zin',
      'weekend',
    ])
  })
})

describe('question wording', () => {
  it('carries the previous app\'s wording verbatim', () => {
    expect(QUESTIONS.goed.q).toBe('Wat ging er gisteren goed?')
    expect(QUESTIONS.bereiken.q).toBe('Wat wil ik vandaag écht bereiken?')
    expect(QUESTIONS.onrustig.q).toBe('Wat houdt me bezig of maakt me onrustig?')
  })

  it('gives every question a hint', () => {
    for (const question of Object.values(QUESTIONS)) {
      expect(question.hint.length).toBeGreaterThan(0)
    }
  })
})

describe('first-thing options', () => {
  it('are exactly the four from the previous app', () => {
    expect(FIRST_THING_VALUES).toEqual(['Telefoon', 'Daglicht', 'Bewegen', 'Anders'])
  })
})
