/**
 * What order the Vandaag cards appear in.
 *
 * The order is not fixed: whatever the day is asking of you right now sits at
 * the top, the record of the day sits under it, and the optional tools sink
 * to the bottom. In the evening that means the evening check-in is the first
 * thing you see and this morning's Dagstart has become something you read
 * rather than something you fill in.
 *
 * Three ranks, and the reasoning for each boundary:
 *
 * 0 — ASKING FOR YOU. Exactly one card can be here, because `isDagstartDone`
 *     already guarantees the morning and the evening are never both open.
 *     This is the one thing the app wants from you at this hour.
 *
 * 1 — THE RECORD. What you have already written today, in the order it
 *     happened: morning, then the look-back it earned, then the evening. This
 *     is the half that should read like a diary, so it is chronological and
 *     never reshuffled by how recently you touched it.
 *
 * 2 — ALWAYS THERE. The body map, the extras, the Sunday cue, and the evening
 *     card while it is still shut. None of these is ever due: the body map is
 *     explicitly "asked for by nobody", and the extras are worth having but
 *     not worth a step. Ranking them above a finished Dagstart would put
 *     things nobody asked for on top of the thing you actually did.
 *
 * Returning ids rather than components keeps this testable without a browser,
 * which is the half of the app that fails quietly — an order that is subtly
 * wrong looks fine in a screenshot.
 */

/**
 * Every card the Vandaag tab can show, in their within-rank order.
 *
 * `body` sits BEFORE `evening` here, which only matters while the evening
 * card is still shut: shut, it is a line of placeholder text ("Vanaf 17:00
 * vraag ik hoe de dag ging") and the body map is something you can actually
 * use. A placeholder must never push a usable card further down the page —
 * doing so once pushed the figure clean off the bottom of a phone screen.
 *
 * Once the evening is due it outranks everything anyway, and once it is saved
 * it joins the record, where the sort puts it after the morning regardless of
 * its place here. So this order changes nothing about the diary.
 */
export const VANDAAG_CARDS = [
  'checkin',
  'lookback',
  'body',
  'evening',
  'review',
  'extras',
]

/**
 * @param {object} state
 * @param {boolean} state.morningDone  isDagstartDone for the viewed day
 * @param {boolean} state.eveningSaved an evening block exists for that day
 * @param {boolean} state.isEvening    the clock has reached EVENING_HOUR
 * @returns {Record<string, 0|1|2>}
 */
export function cardRanks({ morningDone, eveningSaved, isEvening }) {
  // The evening is only ever DUE once the morning is answered and the clock
  // agrees — the same gate EveningCheckin uses to decide whether to open
  // itself, so the two can never disagree about which card is the live one.
  const eveningDue = morningDone && isEvening && !eveningSaved

  return {
    checkin: morningDone ? 1 : 0,
    lookback: 1,
    evening: eveningSaved ? 1 : eveningDue ? 0 : 2,
    body: 2,
    review: 2,
    extras: 2,
  }
}

/**
 * The cards in the order they should be rendered.
 *
 * A stable sort on the rank, so within one rank the cards keep the order of
 * VANDAAG_CARDS and nothing jumps about for reasons the user cannot see.
 */
export function vandaagOrder(state) {
  const ranks = cardRanks(state)
  return [...VANDAAG_CARDS].sort((a, b) => ranks[a] - ranks[b])
}
