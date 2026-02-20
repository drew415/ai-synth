interface SelectProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--text-secondary)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1
          text-sm text-[var(--text-primary)] cursor-pointer
          hover:border-[var(--accent-hover)] focus:border-[var(--accent)] focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
