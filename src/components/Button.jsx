/**
 * Shared button. `variant` picks the look; everything else (onClick, type,
 * disabled, aria-*) is forwarded straight through to the real <button>.
 *
 * min-h-12 keeps every button comfortably above Apple's ~44px minimum touch
 * target — this app is used one-handed, often in a hurry.
 */
const VARIANTS = {
  primary:
    'bg-anker-accent text-slate-900 font-semibold hover:brightness-110 disabled:opacity-40',
  secondary:
    'bg-anker-surface text-anker-text border border-anker-border hover:border-anker-accent disabled:opacity-40',
  ghost: 'text-anker-muted hover:text-anker-text disabled:opacity-40',
  danger:
    'bg-transparent text-red-300 border border-red-400/40 hover:bg-red-500/10 disabled:opacity-40',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
