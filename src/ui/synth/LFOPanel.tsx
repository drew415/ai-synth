import type { LFOParams, OscWaveform } from '../../state/params'
import { Panel } from '../components/Panel'
import { Knob } from '../components/Knob'
import { Select } from '../components/Select'
import { Toggle } from '../components/Toggle'

interface LFOPanelProps {
  title: string
  params: LFOParams
  onChange: (params: Partial<LFOParams>) => void
}

const WAVEFORM_OPTIONS: { value: OscWaveform; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
]

const TARGET_OPTIONS: { value: LFOParams['target']; label: string }[] = [
  { value: 'pitch', label: 'Pitch' },
  { value: 'filter', label: 'Filter' },
  { value: 'amp', label: 'Amp' },
]

export function LFOPanel({ title, params, onChange }: LFOPanelProps) {
  return (
    <Panel title={title}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Toggle
            label="On"
            value={params.enabled}
            onChange={(enabled) => onChange({ enabled })}
          />
          <Select
            label="Target"
            value={params.target}
            options={TARGET_OPTIONS}
            onChange={(target) => onChange({ target })}
          />
        </div>

        <div className="flex gap-2 justify-between">
          <Select
            label="Wave"
            value={params.waveform}
            options={WAVEFORM_OPTIONS}
            onChange={(waveform) => onChange({ waveform })}
          />
          <Knob
            label="Rate"
            value={params.rate}
            min={0.1}
            max={20}
            onChange={(rate) => onChange({ rate })}
            unit="Hz"
            logarithmic
            size="sm"
          />
          <Knob
            label="Depth"
            value={params.depth}
            min={0}
            max={1}
            onChange={(depth) => onChange({ depth })}
            size="sm"
          />
        </div>
      </div>
    </Panel>
  )
}
