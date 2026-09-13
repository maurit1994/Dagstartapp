/**
 * The one door to Anker's data.
 *
 * Every feature module reads and writes through this file — no module ever
 * calls localStorage directly. That rule is the whole architecture bet: when
 * localStorage is outgrown, this single file changes and nothing else does.
 *
 * Contract, locked from Phase 1 onward:
 *  - every key is prefixed `anker_v1_`
 *  - date keys are ALWAYS derived from LOCAL time, never toISOString()
 *    (toISOString converts to UTC, which silently shifts the day abroad)
 *  - data never leaves the device
 *
 * Deliberately empty of functions: the read/write API and the stored data
 * shape get designed and signed off in Phase 2, not guessed at now.
 */

export const STORAGE_PREFIX = 'anker_v1_'
