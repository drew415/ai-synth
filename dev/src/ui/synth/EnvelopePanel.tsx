import type { ADSRParams } from '../../state/params'
import { Panel } from '../components/Panel'
import { Knob } from '../components/Knob'

interface EnvelopePanelProps {
  title: string
  params: ADSRParams
  onChange: (params: Partial<ADSRParams>) => void
}

export function EnvelopePanel({ title, params, onChange }: EnvelopePanelProps) {
  return (
    <Panel title={title}>
      <div className="flex gap-2 justify-between">
        <Knob
          label="Attack"
          value={params.attack}
          min={0.001}
          max={5}
          onChange={(attack) => onChange({ attack })}
          unit="s"
          logarithmic
          size="sm"
        />
        <Knob
          label="Decay"
          value={params.decay}
          min={0.001}
          max={5}
          onChange={(decay) => onChange({ decay })}
          unit="s"
          logarithmic
          size="sm"
        />
        <Knob
          label="Sustain"
          value={params.sustain}
          min={0}
          max={1}
          onChange={(sustain) => onChange({ sustain })}
          size="sm"
        />
        <Knob
          label="Release"
          value={params.release}
          min={0.001}
          max={10}
          onChange={(release) => onChange({ release })}
          unit="s"
          logarithmic
          size="sm"
        />
      </div>
    </Panel>
  )
}
