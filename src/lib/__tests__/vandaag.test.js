import { describe, expect, it } from 'vitest'
import { cardRanks, VANDAAG_CARDS, vandaagOrder } from '../vandaag.js'

const morning = { morningDone: false, eveningSaved: false, isEvening: false }
const afterMorning = { morningDone: true, eveningSaved: false, isEvening: false }
const evening = { morningDone: true, eveningSaved: false, isEvening: true }
const dayClosed = { morningDone: true, eveningSaved: true, isEvening: true }

describe('vandaagOrder', () => {
  it('puts the Dagstart first while it is unanswered', () => {
    expect(vandaagOrder(morning)[0]).toBe('checkin')
  })

  it('puts the EVENING first once the morning is done and it is evening', () => {
    // The whole point: at 20:00 the thing you came for is the evening, and
    // this morning has become something you read rather than fill in.
    const order = vandaagOrder(evening)
    expect(order[0]).toBe('evening')
    expect(order.indexOf('evening')).toBeLessThan(order.indexOf('checkin'))
  })

  it('does NOT raise the evening while the morning is still open', () => {
    // isDagstartDone gates the evening card shut; the order must agree, or
    // the screen would point at something you cannot do yet.
    const order = vandaagOrder({ morningDone: false, eveningSaved: false, isEvening: true })
    expect(order[0]).toBe('checkin')
    expect(order.indexOf('checkin')).toBeLessThan(order.indexOf('evening'))
  })

  it('does not raise the evening before the evening hour', () => {
    const order = vandaagOrder(afterMorning)
    expect(order.indexOf('checkin')).toBeLessThan(order.indexOf('evening'))
  })

  it('keeps the evening on top ALL evening, even once it is filled in', () => {
    // Asked for explicitly: above the morning "de hele avond", not only
    // while it is still due. Current-first beats chronological here.
    const order = vandaagOrder(dayClosed)
    expect(order[0]).toBe('evening')
    expect(order.indexOf('evening')).toBeLessThan(order.indexOf('checkin'))
  })

  it('reads chronologically OUTSIDE the evening', () => {
    // Fill the evening early with "Nu al invullen" and at midday the day
    // still reads morning first — the flip follows the clock, not the data.
    const filledEarly = { morningDone: true, eveningSaved: true, isEvening: false }
    const order = vandaagOrder(filledEarly)
    expect(order.indexOf('checkin')).toBeLessThan(order.indexOf('lookback'))
    expect(order.indexOf('lookback')).toBeLessThan(order.indexOf('evening'))
  })

  it('sinks the optional cards below whatever you actually did', () => {
    // The body map is "asked for by nobody" and the extras are worth having
    // but not worth a step. Neither outranks a finished Dagstart.
    for (const state of [afterMorning, evening, dayClosed]) {
      const order = vandaagOrder(state)
      for (const optional of ['body', 'extras', 'review']) {
        expect(order.indexOf('checkin')).toBeLessThan(order.indexOf(optional))
      }
    }
  })

  it('keeps the look-back directly under the Dagstart that earned it', () => {
    // True at every hour: the flip moves the evening, never the pair.
    for (const state of [dayClosed, { morningDone: true, eveningSaved: true, isEvening: false }]) {
      const order = vandaagOrder(state)
      expect(order.indexOf('lookback')).toBe(order.indexOf('checkin') + 1)
    }
  })

  it('always returns every card exactly once', () => {
    for (const state of [morning, afterMorning, evening, dayClosed]) {
      const order = vandaagOrder(state)
      expect([...order].sort()).toEqual([...VANDAAG_CARDS].sort())
    }
  })

  it('is stable within a rank, so nothing jumps for an invisible reason', () => {
    const order = vandaagOrder(dayClosed)
    const optional = order.filter((id) => ['body', 'review', 'extras'].includes(id))
    expect(optional).toEqual(['body', 'review', 'extras'])
  })
})

describe('cardRanks', () => {
  it('never has two cards asking for you at once', () => {
    for (const state of [morning, afterMorning, evening, dayClosed]) {
      const due = Object.values(cardRanks(state)).filter((r) => r === 0)
      expect(due.length).toBeLessThanOrEqual(1)
    }
  })

  it('leaves nothing demanding once the day is closed', () => {
    expect(Object.values(cardRanks(dayClosed)).every((r) => r > 0)).toBe(true)
  })

  it('treats a saved evening as record, not as a task, even at midday', () => {
    const ranks = cardRanks({ morningDone: true, eveningSaved: true, isEvening: false })
    expect(ranks.evening).toBe(1)
  })
})

describe('a shut evening card never outranks a usable one', () => {
  it('puts the body map above the evening while the evening is shut', () => {
    // Shut, the evening card is one line of placeholder text. Letting it push
    // the body map down once put the figure clean off the bottom of a phone.
    for (const state of [morning, afterMorning]) {
      const order = vandaagOrder(state)
      expect(order.indexOf('body')).toBeLessThan(order.indexOf('evening'))
    }
  })

  it('still puts the evening on top once it is actually due', () => {
    expect(vandaagOrder(evening).indexOf('evening')).toBe(0)
  })

  it('does not let the evening-first flip reach the optional cards', () => {
    // The flip is a RECORD-rank rule. If it leaked into rank 2 it would lift
    // a shut evening card back above the body map — the bug this describes.
    const order = vandaagOrder({ morningDone: false, eveningSaved: false, isEvening: true })
    expect(order.indexOf('body')).toBeLessThan(order.indexOf('evening'))
  })

  it('still puts a filled evening above the body map', () => {
    const order = vandaagOrder(dayClosed)
    expect(order.indexOf('evening')).toBeLessThan(order.indexOf('body'))
  })
})
