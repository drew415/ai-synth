import { useState, useCallback, useRef, useEffect } from 'react'

interface KnobProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  unit?: string
  logarithmic?: boolean
  bipolar?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit = '',
  logarithmic = false,
  bipolar = false,
  size = 'md',
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const sizes = {
    sm: { container: 'w-12', knob: 'w-8 h-8', text: 'text-[10px]' },
    md: { container: 'w-16', knob: 'w-12 h-12', text: 'text-xs' },
    lg: { container: 'w-20', knob: 'w-16 h-16', text: 'text-sm' },
  }

  const s = sizes[size]

  // Convert value to normalized (0-1)
  const normalize = useCallback(
    (val: number): number => {
      if (logarithmic) {
        const minLog = Math.log(min)
        const maxLog = Math.log(max)
        return (Math.log(val) - minLog) / (maxLog - minLog)
      }
      return (val - min) / (max - min)
    },
    [min, max, logarithmic]
  )

  // Convert normalized to value
  const denormalize = useCallback(
    (norm: number): number => {
      if (logarithmic) {
        const minLog = Math.log(min)
        const maxLog = Math.log(max)
        return Math.exp(minLog + norm * (maxLog - minLog))
      }
      return min + norm * (max - min)
    },
    [min, max, logarithmic]
  )

  // Calculate rotation angle (-135 to +135 degrees)
  const normalized = normalize(value)
  const angle = -135 + normalized * 270

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startY.current = e.clientY
      startValue.current = normalized
    },
    [normalized]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = (startY.current - e.clientY) / 150
      const newNorm = Math.max(0, Math.min(1, startValue.current + delta))
      let newValue = denormalize(newNorm)

      // Snap to step
      newValue = Math.round(newValue / step) * step

      onChange(newValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, denormalize, onChange, step])

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    if (bipolar) {
      onChange(0)
    } else {
      onChange(min + (max - min) / 2)
    }
  }, [bipolar, min, max, onChange])

  // Format display value
  const displayValue = useCallback(() => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    if (value < 0.01 && value > 0) {
      return value.toFixed(3)
    }
    if (Number.isInteger(value) || Math.abs(value) >= 10) {
      return Math.round(value).toString()
    }
    return value.toFixed(2)
  }, [value])

  return (
    <div className={`flex flex-col items-center gap-1 ${s.container}`}>
      <span className={`${s.text} text-[var(--text-secondary)] truncate w-full text-center`}>
        {label}
      </span>

      <div
        className={`${s.knob} rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border)]
          cursor-pointer relative select-none
          ${isDragging ? 'border-[var(--accent)]' : 'hover:border-[var(--accent-hover)]'}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Knob indicator */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-[var(--accent)] rounded-full" />
        </div>

        {/* Center ring for bipolar */}
        {bipolar && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
          </div>
        )}
      </div>

      <span className={`${s.text} text-[var(--text-primary)] font-mono`}>
        {displayValue()}
        {unit && <span className="text-[var(--text-secondary)]">{unit}</span>}
      </span>
    </div>
  )
}
