/**
 * Shared button.
 *
 * `primary` is the only element on a screen allowed to carry the accent at
 * full strength: it is how you find "what do I do next" without reading. One
 * per screen, always.
 *
 * min-h-14 for primary, min-h-12 otherwise — comfortably past Apple's ~44px
 * minimum, because this app is used one-handed and often in a hurry.
 */
const VARIANTS = {
  primary:
    'min-h-14 bg-anker-accent text-anker-accent-ink text-base font-semibold hover:brightness-110 disabled:opacity-40',
  secondary:
    'min-h-12 bg-anker-raised text-anker-text border border-anker-border hover:border-anker-accent disabled:opacity-40',
  ghost: 'min-h-12 text-anker-muted hover:text-anker-text disabled:opacity-40',
  danger:
    'min-h-12 bg-transparent text-red-300 border border-red-400/40 hover:bg-red-500/10 disabled:opacity-40',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-xl px-4 text-sm transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
