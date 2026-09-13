/**
 * The canonical body regions for pain tracking.
 *
 * These ids are a PERMANENT contract. Pain is stored as
 * [{ region: <id>, intensity: 1-5 }], and the future visual body map will
 * map onto exactly these ids — so the map is a picture change, not a data
 * migration. Never rename or remove an id; only ever add.
 *
 * `side` tells the future body map which view a region belongs to.
 * `label` is Dutch because it is user-facing.
 */
export const BODY_REGIONS = [
  { id: 'head', label: 'Hoofd', side: 'front' },
  { id: 'neck', label: 'Nek', side: 'front' },
  { id: 'shoulder_l', label: 'Schouder links', side: 'front' },
  { id: 'shoulder_r', label: 'Schouder rechts', side: 'front' },
  { id: 'chest', label: 'Borst', side: 'front' },
  { id: 'abdomen', label: 'Buik', side: 'front' },
  { id: 'arm_l', label: 'Arm links', side: 'front' },
  { id: 'arm_r', label: 'Arm rechts', side: 'front' },
  { id: 'upper_back', label: 'Bovenrug', side: 'back' },
  { id: 'lower_back', label: 'Onderrug', side: 'back' },
  { id: 'hip_l', label: 'Heup links', side: 'back' },
  { id: 'hip_r', label: 'Heup rechts', side: 'back' },
  { id: 'knee_l', label: 'Knie links', side: 'front' },
  { id: 'knee_r', label: 'Knie rechts', side: 'front' },
  { id: 'leg_l', label: 'Been links', side: 'front' },
  { id: 'leg_r', label: 'Been rechts', side: 'front' },
]

/** Look up a region's Dutch label by id; unknown ids fall back to the id. */
export function getRegionLabel(id) {
  return BODY_REGIONS.find((r) => r.id === id)?.label ?? id
}

/** The 1-5 mental state scale, low to high. */
export const MOOD_SCALE = [
  { value: 1, emoji: '😖', label: 'Heel slecht' },
  { value: 2, emoji: '😕', label: 'Slecht' },
  { value: 3, emoji: '😐', label: 'Gaat wel' },
  { value: 4, emoji: '🙂', label: 'Goed' },
  { value: 5, emoji: '😄', label: 'Heel goed' },
]
