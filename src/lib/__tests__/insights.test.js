import { describe, expect, it } from 'vitest'
import { insightFor } from '../insights.js'

const TODAY = '2026-09-15'
const day = (extra = {}) => ({
  mental: 3,
  mode: 'lite',
  answers: {},
  sleep: null,
  body: [],
  note: '',
  evening: null,
  updatedAt: 1,
  ...extra,
})
const sleptBadly = () => day({ sleep: { subjectief: 1, garmin: {} } })

describe('insightFor', () => {
  it('says nothing when there is no entry for today', () => {
    expect(insightFor({}, TODAY)).toBeNull()
    expect(insightFor(null, TODAY)).toBeNull()
  })

  it('says nothing when nothing stands out', () => {
    expect(insightFor({ [TODAY]: day() }, TODAY)).toBeNull()
  })

  it('reports a run of bad nights', () => {
    const out = insightFor(
      {
        '2026-09-13': sleptBadly(),
        '2026-09-14': sleptBadly(),
        [TODAY]: sleptBadly(),
      },
      TODAY,
    )
    expect(out).toBe('3 nachten op rij slecht geslapen.')
  })

  it('does not report two bad nights — a run needs three', () => {
    const out = insightFor(
      { '2026-09-14': sleptBadly(), [TODAY]: sleptBadly() },
      TODAY,
    )
    expect(out ?? '').not.toMatch(/nachten op rij/)
  })

  it('breaks the run on a good night rather than counting around it', () => {
    const out = insightFor(
      {
        '2026-09-12': sleptBadly(),
        '2026-09-13': sleptBadly(),
        '2026-09-14': day({ sleep: { subjectief: 5, garmin: {} } }),
        [TODAY]: sleptBadly(),
      },
      TODAY,
    )
    expect(out ?? '').not.toMatch(/nachten op rij/)
  })

  it('reports a region that keeps coming back', () => {
    const hurts = () => day({ body: [{ region: 'lower_back', pain: 3, tension: 1 }] })
    const out = insightFor(
      {
        '2026-09-12': hurts(),
        '2026-09-13': hurts(),
        '2026-09-14': hurts(),
        [TODAY]: hurts(),
      },
      TODAY,
    )
    expect(out).toBe('Onderrug speelde 4 van de laatste 7 dagen.')
  })

  it('ignores a region scored zero on both', () => {
    const zero = () => day({ body: [{ region: 'neck', pain: 0, tension: 0 }] })
    const out = insightFor(
      {
        '2026-09-12': zero(),
        '2026-09-13': zero(),
        '2026-09-14': zero(),
        [TODAY]: zero(),
      },
      TODAY,
    )
    expect(out ?? '').not.toMatch(/speelde/)
  })

  it('reports a clear jump from yesterday, but not a one-point wobble', () => {
    expect(
      insightFor({ '2026-09-14': day({ mental: 2 }), [TODAY]: day({ mental: 5 }) }, TODAY),
    ).toBe('Je voelt je beduidend beter dan gisteren.')

    expect(
      insightFor({ '2026-09-14': day({ mental: 3 }), [TODAY]: day({ mental: 4 }) }, TODAY),
    ).toBeNull()
  })

  it('states a streak milestone as a fact, without congratulating', () => {
    const out = insightFor(
      { '2026-09-13': day(), '2026-09-14': day(), [TODAY]: day() },
      TODAY,
    )
    expect(out).toBe('3 dagen op rij ingevuld.')
    expect(out).not.toMatch(/goed bezig|knap|ga zo door|top/i)
  })

  it('only reports on the milestone days, not every day', () => {
    const four = {
      '2026-09-12': day(), '2026-09-13': day(), '2026-09-14': day(), [TODAY]: day(),
    }
    expect(insightFor(four, TODAY)).toBeNull()
  })

  it('counts how often the priority was reached, once there is enough to count', () => {
    const checkins = {}
    for (let i = 0; i < 8; i += 1) {
      const d = new Date(`${TODAY}T12:00:00`)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      checkins[key] = day({
        evening: { intention: i < 5 ? 'done' : 'missed', mental: null, note: '', savedAt: 1 },
      })
    }
    expect(insightFor(checkins, TODAY)).toBe('Je prioriteit lukte 5 van de laatste 8 keer.')
  })

  it('never invents praise', () => {
    const cases = [
      { [TODAY]: day() },
      { '2026-09-14': day({ mental: 1 }), [TODAY]: day({ mental: 5 }) },
      { '2026-09-13': day(), '2026-09-14': day(), [TODAY]: day() },
    ]
    for (const checkins of cases) {
      const out = insightFor(checkins, TODAY)
      if (out) expect(out).not.toMatch(/goed bezig|knap|trots|ga zo door|geweldig|top!/i)
    }
  })
})
