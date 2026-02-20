import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  children: ReactNode
  className?: string
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div
      className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}
