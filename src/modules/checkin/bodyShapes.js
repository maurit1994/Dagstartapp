/**
 * Geometry for the body map, in a 200 x 400 viewBox.
 *
 * Proportions are deliberately stylised rather than anatomical: the torso is
 * large and the legs are short, so the whole figure fits on a phone screen and
 * every region stays big enough to hit with a thumb. A realistic 1:2.5 figure
 * either scrolls off the screen or shrinks the neck to a target too small to
 * tap.
 *
 * Each shape is positioned as seen by the VIEWER. Which region id a shape
 * belongs to therefore depends on the view: looking at someone's front, their
 * left side is on your right; looking at their back, their left is on your
 * left. That flip is the whole reason this file exists, and why it has tests.
 */

/** Region suffix for the shape drawn on the viewer's left-hand side. */
const viewerLeftSide = (view) => (view === 'front' ? 'r' : 'l')
/** Region suffix for the shape drawn on the viewer's right-hand side. */
const viewerRightSide = (view) => (view === 'front' ? 'l' : 'r')

/** Head, neck, shoulders, arms and legs: present on both views. */
function sharedShapes(view) {
  const L = viewerLeftSide(view)
  const R = viewerRightSide(view)

  return [
    { id: 'head', el: 'ellipse', cx: 100, cy: 30, rx: 22, ry: 26 },
    { id: 'neck', el: 'path', d: 'M88 52 H112 V70 Q100 75 88 70 Z' },

    // Overlap the torso edge so the shoulders read as part of the body
    // rather than as two balls floating beside it.
    { id: `shoulder_${L}`, el: 'ellipse', cx: 62, cy: 92, rx: 18, ry: 19 },
    { id: `shoulder_${R}`, el: 'ellipse', cx: 138, cy: 92, rx: 18, ry: 19 },

    {
      id: `arm_${L}`,
      el: 'path',
      d: 'M44 102 Q36 140 38 178 Q39 200 45 212 L59 208 Q53 178 55 148 Q57 122 61 108 Z',
    },
    {
      id: `arm_${R}`,
      el: 'path',
      d: 'M156 102 Q164 140 162 178 Q161 200 155 212 L141 208 Q147 178 145 148 Q143 122 139 108 Z',
    },

    {
      id: `leg_${L}`,
      el: 'path',
      d: 'M76 192 Q68 238 73 286 Q71 336 76 386 H93 Q96 336 94 286 Q99 238 97 196 Z',
    },
    {
      id: `leg_${R}`,
      el: 'path',
      d: 'M124 192 Q132 238 127 286 Q129 336 124 386 H107 Q104 336 106 286 Q101 238 103 196 Z',
    },
  ]
}

/** Chest, abdomen and knees are only meaningful from the front. */
export function frontShapes() {
  const L = viewerLeftSide('front')
  const R = viewerRightSide('front')

  return [
    ...sharedShapes('front'),
    {
      id: 'chest',
      el: 'path',
      d: 'M74 86 Q80 76 100 76 Q120 76 126 86 Q131 112 129 140 H71 Q69 112 74 86 Z',
    },
    {
      id: 'abdomen',
      el: 'path',
      d: 'M71 140 H129 Q127 168 126 192 Q100 199 74 192 Q73 168 71 140 Z',
    },
    { id: `knee_${L}`, el: 'ellipse', cx: 84, cy: 285, rx: 13, ry: 16 },
    { id: `knee_${R}`, el: 'ellipse', cx: 116, cy: 285, rx: 13, ry: 16 },
  ]
}

/** Upper back, lower back and hips are only meaningful from behind. */
export function backShapes() {
  const L = viewerLeftSide('back')
  const R = viewerRightSide('back')

  return [
    ...sharedShapes('back'),
    {
      id: 'upper_back',
      el: 'path',
      d: 'M74 86 Q80 76 100 76 Q120 76 126 86 Q131 112 129 144 H71 Q69 112 74 86 Z',
    },
    {
      id: 'lower_back',
      el: 'path',
      d: 'M71 144 H129 Q128 166 127 186 H73 Q72 166 71 144 Z',
    },
    { id: `hip_${L}`, el: 'path', d: 'M73 186 H100 V214 Q85 220 76 208 Q72 198 73 186 Z' },
    { id: `hip_${R}`, el: 'path', d: 'M127 186 H100 V214 Q115 220 124 208 Q128 198 127 186 Z' },
  ]
}

export function shapesForView(view) {
  return view === 'front' ? frontShapes() : backShapes()
}
