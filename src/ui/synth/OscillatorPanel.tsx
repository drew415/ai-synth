import type { OscParams, OscWaveform } from '../../state/params'
import { Panel } from '../components/Panel'
import { Knob } from '../components/Knob'
import { Select } from '../components/Select'
import { Toggle } from '../components/Toggle'

interface OscillatorPanelProps {
  title: string
  params: OscParams
  onChange: (params: Partial<OscParams>) => void
}

const WAVEFORM_OPTIONS: { value: OscWaveform; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
]

export function OscillatorPanel({ title, params, onChange }: OscillatorPanelProps) {
  return (
    <Panel title={title}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Toggle
            label="On"
            value={params.enabled}
            onChange={(enabled) => onChange({ enabled })}
          />
          <Select
            label="Wave"
            value={params.waveform}
            options={WAVEFORM_OPTIONS}
            onChange={(waveform) => onChange({ waveform })}
          />
        </div>

        <div className="flex gap-2 justify-between">
          <Knob
            label="Level"
            value={params.level}
            min={0}
            max={1}
            onChange={(level) => onChange({ level })}
            size="sm"
          />
          <Knob
            label="Octave"
            value={params.octave}
            min={-2}
            max={2}
            step={1}
            onChange={(octave) => onChange({ octave })}
            size="sm"
          />
          <Knob
            label="Detune"
            value={params.detune}
            min={-100}
            max={100}
            step={1}
            onChange={(detune) => onChange({ detune })}
            unit="c"
            bipolar
            size="sm"
          />
        </div>
      </div>
    </Panel>
  )
}
