import Scale from '../../components/Scale.jsx'
import { MOOD_SCALE } from '../../lib/regions.js'

const WORDS = ['', ...MOOD_SCALE.map((m) => m.label)]
const EMOJI = ['', ...MOOD_SCALE.map((m) => m.emoji)]

/** Step: how are you mentally, on a 1-5 scale. */
export default function MoodStep({ value, onChange }) {
  return (
    <div>
      <p className="text-base text-anker-text">Hoe voel je je mentaal?</p>
      <div className="mt-4">
        <Scale
          label="Mentale staat"
          words={WORDS}
          emoji={EMOJI}
          direction="up"
          value={value}
          onSelect={onChange}
          size="lg"
          hideLabel
        />
      </div>
    </div>
  )
}
