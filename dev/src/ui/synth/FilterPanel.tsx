import type { FilterParams, FilterType } from '../../state/params'
import { Panel } from '../components/Panel'
import { Knob } from '../components/Knob'
import { Select } from '../components/Select'

interface FilterPanelProps {
  params: FilterParams
  onChange: (params: Partial<FilterParams>) => void
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'lowpass', label: 'Lowpass' },
  { value: 'highpass', label: 'Highpass' },
  { value: 'bandpass', label: 'Bandpass' },
]

export function FilterPanel({ params, onChange }: FilterPanelProps) {
  return (
    <Panel title="Filter">
      <div className="flex flex-col gap-3">
        <Select
          label="Type"
          value={params.type}
          options={FILTER_OPTIONS}
          onChange={(type) => onChange({ type })}
        />

        <div className="flex gap-2 justify-between">
          <Knob
            label="Cutoff"
            value={params.cutoff}
            min={20}
            max={20000}
            onChange={(cutoff) => onChange({ cutoff })}
            unit="Hz"
            logarithmic
            size="sm"
          />
          <Knob
            label="Reso"
            value={params.resonance}
            min={0.1}
            max={30}
            onChange={(resonance) => onChange({ resonance })}
            logarithmic
            size="sm"
          />
          <Knob
            label="Env"
            value={params.envAmount}
            min={-1}
            max={1}
            onChange={(envAmount) => onChange({ envAmount })}
            bipolar
            size="sm"
          />
          <Knob
            label="Key"
            value={params.keyTracking}
            min={0}
            max={1}
            onChange={(keyTracking) => onChange({ keyTracking })}
            size="sm"
          />
        </div>
      </div>
    </Panel>
  )
}
