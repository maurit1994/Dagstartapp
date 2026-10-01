import { describe, expect, it } from 'vitest'
import { eveningInsightFor, insightFor } from '../insights.js'

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

describe('insightFor: firing early enough to be worth the filling in', () => {
  const day = (mental, extra = {}) => ({ mental, body: [], note: '', answers: {}, ...extra })

  it('names a high as a fact, in RECORDED days', () => {
    const checkins = { '2026-09-18': day(5) }
    for (let d = 1; d <= 6; d += 1) {
      checkins[`2026-09-${String(18 - d).padStart(2, '0')}`] = day(2)
    }
    const out = insightFor(checkins, '2026-09-18')
    expect(out).toBe('Je hoogste stemming van je laatste 7 ingevulde dagen.')
  })

  it('names a low just as readily as a high', () => {
    // Reporting only the good days would be flattery by selection.
    const checkins = { '2026-09-18': day(1) }
    for (let d = 1; d <= 6; d += 1) {
      checkins[`2026-09-${String(18 - d).padStart(2, '0')}`] = day(4)
    }
    expect(insightFor(checkins, '2026-09-18')).toBe(
      'Je laagste stemming van je laatste 7 ingevulde dagen.',
    )
  })

  it('says nothing about an extreme on too little data', () => {
    const checkins = { '2026-09-18': day(5), '2026-09-17': day(2), '2026-09-16': day(2) }
    const out = insightFor(checkins, '2026-09-18')
    expect(out).not.toMatch(/hoogste|laagste/)
  })

  it('counts only days that were actually filled in', () => {
    // Six entries spread over a month must not be reported as "in 30 days".
    const checkins = { '2026-09-18': day(5) }
    for (const key of ['2026-09-16', '2026-09-12', '2026-09-08', '2026-09-05', '2026-08-30']) {
      checkins[key] = day(2)
    }
    expect(insightFor(checkins, '2026-09-18')).toBe(
      'Je hoogste stemming van je laatste 6 ingevulde dagen.',
    )
  })

  it('reports the priority tally from four evenings, not seven', () => {
    const checkins = { '2026-09-18': day(3) }
    for (let d = 1; d <= 4; d += 1) {
      checkins[`2026-09-${String(18 - d).padStart(2, '0')}`] = day(3, {
        evening: { intention: d <= 2 ? 'done' : 'missed' },
      })
    }
    const out = insightFor(checkins, '2026-09-18')
    expect(out).toBe('Je prioriteit lukte 2 van de laatste 4 keer.')
  })

  it('still invents no praise in any of the new lines', () => {
    const checkins = { '2026-09-18': day(5) }
    for (let d = 1; d <= 6; d += 1) {
      checkins[`2026-09-${String(18 - d).padStart(2, '0')}`] = day(1)
    }
    const out = insightFor(checkins, '2026-09-18')
    expect(out).not.toMatch(/goed bezig|knap|trots|ga zo door|geweldig|top!|lekker/i)
  })
})

describe('eveningInsightFor', () => {
  const entry = (morning, evening) => ({
    mental: morning, body: [], answers: {},
    evening: evening === undefined ? null : { mental: evening },
  })

  it('states the arc from morning to evening', () => {
    expect(eveningInsightFor(entry(4, 2))).toBe('Je begon op 4 en eindigt op 2.')
    expect(eveningInsightFor(entry(2, 5))).toBe('Je begon op 2 en eindigt op 5.')
  })

  it('says so when the day did not move', () => {
    expect(eveningInsightFor(entry(3, 3))).toBe('Je begon en eindigt de dag op 3.')
  })

  it('says nothing when either end is missing', () => {
    // Half an arc is not an arc.
    expect(eveningInsightFor(entry(4, undefined))).toBeNull()
    expect(eveningInsightFor(entry(null, 3))).toBeNull()
    expect(eveningInsightFor(entry(undefined, undefined))).toBeNull()
  })

  it('needs no history at all — this is the point', () => {
    // Every other line in this file waits for days of data. This one works on
    // the very first evening, which is when the habit is least established.
    expect(eveningInsightFor(entry(5, 1))).toBe('Je begon op 5 en eindigt op 1.')
  })

  it('reports a decline as readily as an improvement, and never praises', () => {
    for (const [m, e] of [[1, 5], [5, 1], [3, 3]]) {
      const out = eveningInsightFor(entry(m, e))
      expect(out).not.toMatch(/goed bezig|knap|trots|ga zo door|geweldig|top!|jammer|helaas/i)
    }
  })

  it('survives nonsense', () => {
    expect(eveningInsightFor(null)).toBeNull()
    expect(eveningInsightFor({})).toBeNull()
  })
})
