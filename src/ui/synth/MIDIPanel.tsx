import { useState, useEffect } from 'react'
import { midi, type MIDIInput } from '../../midi/webmidi'
import { Panel } from '../components/Panel'

interface MIDIPanelProps {
  onNoteOn: (note: number, velocity: number) => void
  onNoteOff: (note: number) => void
}

export function MIDIPanel({ onNoteOn, onNoteOff }: MIDIPanelProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [inputs, setInputs] = useState<MIDIInput[]>([])
  const [activeInput, setActiveInput] = useState<MIDIInput | null>(null)

  useEffect(() => {
    async function initMIDI() {
      const supported = await midi.init()
      setIsSupported(supported)

      if (supported) {
        setInputs(midi.getInputs())
        setActiveInput(midi.getActiveInput())

        // Set up message handler
        midi.onMessage((msg) => {
          if (msg.type === 'noteon' && msg.note !== undefined && msg.velocity !== undefined) {
            onNoteOn(msg.note, msg.velocity)
          } else if (msg.type === 'noteoff' && msg.note !== undefined) {
            onNoteOff(msg.note)
          }
          // CC messages could be used for mod wheel, etc.
        })
      }
    }

    initMIDI()

    // Poll for device changes
    const interval = setInterval(() => {
      if (midi.isSupported()) {
        const currentInputs = midi.getInputs()
        const currentActive = midi.getActiveInput()

        if (JSON.stringify(currentInputs) !== JSON.stringify(inputs)) {
          setInputs(currentInputs)
        }
        if (JSON.stringify(currentActive) !== JSON.stringify(activeInput)) {
          setActiveInput(currentActive)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [onNoteOn, onNoteOff, inputs, activeInput])

  const handleSelectInput = (id: string) => {
    midi.selectInput(id)
    setActiveInput(midi.getActiveInput())
  }

  if (!isSupported) {
    return (
      <Panel title="MIDI">
        <p className="text-sm text-[var(--text-secondary)]">
          Web MIDI is not supported in this browser.
        </p>
      </Panel>
    )
  }

  return (
    <Panel title="MIDI">
      {inputs.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No MIDI devices found. Connect a device and it will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[var(--text-secondary)]">Input Device</label>
          <select
            value={activeInput?.id || ''}
            onChange={(e) => handleSelectInput(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1
              text-sm text-[var(--text-primary)] cursor-pointer
              hover:border-[var(--accent-hover)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">Select a device...</option>
            {inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name} ({input.manufacturer})
              </option>
            ))}
          </select>
          {activeInput && (
            <p className="text-xs text-green-500">
              Connected to {activeInput.name}
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}
