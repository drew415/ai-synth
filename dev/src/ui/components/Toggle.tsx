interface ToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors
        ${
          value
            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
            : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-hover)]'
        }`}
    >
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </button>
  )
}
