import { useState, useCallback, useEffect, useRef } from 'react'

interface KeyboardProps {
  onNoteOn: (note: number, velocity: number) => void
  onNoteOff: (note: number) => void
  startOctave?: number
  octaves?: number
}

interface KeyDef {
  note: number
  isBlack: boolean
  label: string
}

// Computer keyboard to note mapping (QWERTY layout)
const KEY_MAP: Record<string, number> = {
  // Lower row - C3 to B3
  a: 48, // C3
  w: 49, // C#3
  s: 50, // D3
  e: 51, // D#3
  d: 52, // E3
  f: 53, // F3
  t: 54, // F#3
  g: 55, // G3
  y: 56, // G#3
  h: 57, // A3
  u: 58, // A#3
  j: 59, // B3
  // Upper row - C4 to E4
  k: 60, // C4
  o: 61, // C#4
  l: 62, // D4
  p: 63, // D#4
  ';': 64, // E4
  "'": 65, // F4
}

function generateKeys(startOctave: number, octaves: number): KeyDef[] {
  const keys: KeyDef[] = []
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const blackNotes = [1, 3, 6, 8, 10]

  const startNote = (startOctave + 1) * 12 // MIDI note number

  for (let octave = 0; octave < octaves; octave++) {
    for (let i = 0; i < 12; i++) {
      const note = startNote + octave * 12 + i
      const noteName = noteNames[i]
      const isBlack = blackNotes.includes(i)

      keys.push({
        note,
        isBlack,
        label: `${noteName}${startOctave + octave}`,
      })
    }
  }

  // Add final C
  const finalNote = startNote + octaves * 12
  keys.push({
    note: finalNote,
    isBlack: false,
    label: `C${startOctave + octaves}`,
  })

  return keys
}

export function Keyboard({
  onNoteOn,
  onNoteOff,
  startOctave = 3,
  octaves = 2,
}: KeyboardProps) {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set())
  const [octaveOffset, setOctaveOffset] = useState(0)
  const pressedKeysRef = useRef<Set<string>>(new Set())

  const keys = generateKeys(startOctave + octaveOffset, octaves)
  const whiteKeys = keys.filter((k) => !k.isBlack)
  const blackKeys = keys.filter((k) => k.isBlack)

  const handleNoteOn = useCallback(
    (note: number, velocity: number = 0.8) => {
      if (!activeNotes.has(note)) {
        setActiveNotes((prev) => new Set(prev).add(note))
        onNoteOn(note, velocity)
      }
    },
    [activeNotes, onNoteOn]
  )

  const handleNoteOff = useCallback(
    (note: number) => {
      setActiveNotes((prev) => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
      onNoteOff(note)
    },
    [onNoteOff]
  )

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return

      const key = e.key.toLowerCase()

      // Octave shift
      if (key === 'z') {
        setOctaveOffset((prev) => Math.max(prev - 1, -2))
        return
      }
      if (key === 'x') {
        setOctaveOffset((prev) => Math.min(prev + 1, 2))
        return
      }

      // Note mapping
      const baseNote = KEY_MAP[key]
      if (baseNote !== undefined && !pressedKeysRef.current.has(key)) {
        pressedKeysRef.current.add(key)
        const note = baseNote + octaveOffset * 12
        handleNoteOn(note)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const baseNote = KEY_MAP[key]

      if (baseNote !== undefined && pressedKeysRef.current.has(key)) {
        pressedKeysRef.current.delete(key)
        const note = baseNote + octaveOffset * 12
        handleNoteOff(note)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [octaveOffset, handleNoteOn, handleNoteOff])

  // Calculate black key positions
  const getBlackKeyPosition = (note: number): number => {
    const noteInOctave = note % 12
    const octaveStart = Math.floor(note / 12) - (startOctave + octaveOffset + 1)

    // Position map for black keys relative to white key widths
    const positions: Record<number, number> = {
      1: 0.65, // C#
      3: 1.75, // D#
      6: 3.6, // F#
      8: 4.7, // G#
      10: 5.8, // A#
    }

    const posInOctave = positions[noteInOctave] ?? 0
    return (octaveStart * 7 + posInOctave) * (100 / whiteKeys.length)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Octave indicator */}
      <div className="flex items-center justify-between px-2 text-sm text-[var(--text-secondary)]">
        <span>
          Octave: {startOctave + octaveOffset} (Z/X to shift)
        </span>
        <span>Keys: A-L, W-P</span>
      </div>

      {/* Piano keyboard */}
      <div className="relative h-32 select-none">
        {/* White keys */}
        <div className="absolute inset-0 flex">
          {whiteKeys.map((key) => (
            <button
              key={key.note}
              className={`flex-1 border border-[var(--border)] rounded-b-md transition-colors
                ${
                  activeNotes.has(key.note)
                    ? 'bg-[var(--accent)]'
                    : 'bg-white hover:bg-gray-100'
                }`}
              onMouseDown={() => handleNoteOn(key.note)}
              onMouseUp={() => handleNoteOff(key.note)}
              onMouseLeave={() => {
                if (activeNotes.has(key.note)) handleNoteOff(key.note)
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                handleNoteOn(key.note)
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                handleNoteOff(key.note)
              }}
            >
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                {key.label.replace('#', '')}
              </span>
            </button>
          ))}
        </div>

        {/* Black keys */}
        {blackKeys.map((key) => (
          <button
            key={key.note}
            className={`absolute top-0 h-[60%] w-[6%] rounded-b-md transition-colors z-10
              ${
                activeNotes.has(key.note)
                  ? 'bg-[var(--accent)]'
                  : 'bg-gray-900 hover:bg-gray-700'
              }`}
            style={{
              left: `${getBlackKeyPosition(key.note)}%`,
            }}
            onMouseDown={() => handleNoteOn(key.note)}
            onMouseUp={() => handleNoteOff(key.note)}
            onMouseLeave={() => {
              if (activeNotes.has(key.note)) handleNoteOff(key.note)
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              handleNoteOn(key.note)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              handleNoteOff(key.note)
            }}
          />
        ))}
      </div>
    </div>
  )
}
