import { describe, expect, it } from 'vitest'
import {
  ALL_QUESTION_IDS,
  FIRST_THING_VALUES,
  isWeekendPlanningDay,
  questionsForMode,
  QUESTIONS,
} from '../questions.js'

// Local dates, so these never drift with the runner's timezone.
const MONDAY = new Date(2026, 8, 14)
const FRIDAY = new Date(2026, 8, 18)
const SATURDAY = new Date(2026, 8, 19)
const SUNDAY = new Date(2026, 8, 20)

const ids = (mode, date) => questionsForMode(mode, date).map((q) => q.id)

describe('questionsForMode', () => {
  it('lite asks exactly three questions, in the old app\'s order', () => {
    expect(ids('lite', MONDAY)).toEqual(['goed', 'bereiken', 'zin'])
  })

  it("full asks six, with Lite's three FIRST and the extras after", () => {
    // Deliberately not the old app's interleaved order: the short set has to
    // be answerable without committing to the long one.
    expect(ids('full', MONDAY)).toEqual([
      'goed',
      'bereiken',
      'zin',
      'dankbaar',
      'gedragen',
      'onrustig',
    ])
  })

  it("full BEGINS with exactly the Lite questions, so a mid-flow switch keeps your place", () => {
    expect(ids('full', MONDAY).slice(0, 3)).toEqual(ids('lite', MONDAY))
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

describe('isWeekendPlanningDay', () => {
  it('is Friday only', () => {
    expect(isWeekendPlanningDay(FRIDAY)).toBe(true)
    expect(isWeekendPlanningDay(SATURDAY)).toBe(false)
    expect(isWeekendPlanningDay(SUNDAY)).toBe(false)
    expect(isWeekendPlanningDay(MONDAY)).toBe(false)
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

  it('puts bereiken before the evening-facing questions it feeds', () => {
    expect(ALL_QUESTION_IDS.indexOf('goed')).toBeLessThan(
      ALL_QUESTION_IDS.indexOf('bereiken'),
    )
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
