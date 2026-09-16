/**
 * The canonical body regions.
 *
 * These ids are a PERMANENT contract. The body map draws onto exactly these
 * ids, and stored entries reference them, so ids may be added but never
 * renamed or removed.
 *
 * `views` says which side of the figure a region is drawn on. Limbs appear on
 * both views and map to the SAME id: tapping the left arm from the front or
 * the back edits one region, because you only have one left arm.
 *
 * `label` is Dutch because it is user-facing.
 */
export const BODY_REGIONS = [
  { id: 'head', label: 'Hoofd', views: ['front', 'back'] },
  { id: 'neck', label: 'Nek', views: ['front', 'back'] },
  { id: 'shoulder_l', label: 'Schouder links', views: ['front', 'back'] },
  { id: 'shoulder_r', label: 'Schouder rechts', views: ['front', 'back'] },
  { id: 'chest', label: 'Borst', views: ['front'] },
  { id: 'abdomen', label: 'Buik', views: ['front'] },
  { id: 'upper_back', label: 'Bovenrug', views: ['back'] },
  { id: 'lower_back', label: 'Onderrug', views: ['back'] },
  { id: 'arm_l', label: 'Arm links', views: ['front', 'back'] },
  { id: 'arm_r', label: 'Arm rechts', views: ['front', 'back'] },
  { id: 'hip_l', label: 'Heup links', views: ['back'] },
  { id: 'hip_r', label: 'Heup rechts', views: ['back'] },
  { id: 'knee_l', label: 'Knie links', views: ['front'] },
  { id: 'knee_r', label: 'Knie rechts', views: ['front'] },
  { id: 'leg_l', label: 'Been links', views: ['front', 'back'] },
  { id: 'leg_r', label: 'Been rechts', views: ['front', 'back'] },
]

export const REGION_IDS = BODY_REGIONS.map((r) => r.id)

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

/** The two things scored per body region. 0 means "nothing here". */
export const BODY_MEASURES = [
  { key: 'pain', label: 'Pijn', color: 'rose' },
  { key: 'tension', label: 'Spanning', color: 'amber' },
]
