import { describe, expect, it } from 'vitest'
import {
  FIRST_THING_VALUES,
  isWeekend,
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

  it('full asks exactly six, in the old app\'s order', () => {
    expect(ids('full', MONDAY)).toEqual([
      'goed',
      'dankbaar',
      'bereiken',
      'gedragen',
      'onrustig',
      'zin',
    ])
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
  it('appears on Saturday and Sunday', () => {
    expect(ids('lite', SATURDAY)).toContain('weekend')
    expect(ids('full', SUNDAY)).toContain('weekend')
  })

  it('does not appear on a weekday, including Friday', () => {
    expect(ids('full', MONDAY)).not.toContain('weekend')
    expect(ids('full', FRIDAY)).not.toContain('weekend')
  })

  it('comes last, so the regular questions keep their order', () => {
    const list = ids('full', SATURDAY)
    expect(list[list.length - 1]).toBe('weekend')
  })
})

describe('isWeekend', () => {
  it('is Saturday and Sunday only — matching the previous app', () => {
    expect(isWeekend(SATURDAY)).toBe(true)
    expect(isWeekend(SUNDAY)).toBe(true)
    expect(isWeekend(MONDAY)).toBe(false)
    expect(isWeekend(FRIDAY)).toBe(false)
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
