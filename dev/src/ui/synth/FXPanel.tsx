import type { FXParams } from '../../state/params'
import { Panel } from '../components/Panel'
import { Knob } from '../components/Knob'
import { Toggle } from '../components/Toggle'

interface FXPanelProps {
  params: FXParams
  onChange: (params: Partial<FXParams>) => void
}

export function FXPanel({ params, onChange }: FXPanelProps) {
  const updateDistortion = (updates: Partial<FXParams['distortion']>) => {
    onChange({ distortion: { ...params.distortion, ...updates } })
  }

  const updateDelay = (updates: Partial<FXParams['delay']>) => {
    onChange({ delay: { ...params.delay, ...updates } })
  }

  const updateReverb = (updates: Partial<FXParams['reverb']>) => {
    onChange({ reverb: { ...params.reverb, ...updates } })
  }

  const updateChorus = (updates: Partial<FXParams['chorus']>) => {
    onChange({ chorus: { ...params.chorus, ...updates } })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Distortion */}
      <Panel title="Distortion">
        <div className="flex flex-col gap-3">
          <Toggle
            label="On"
            value={params.distortion.enabled}
            onChange={(enabled) => updateDistortion({ enabled })}
          />
          <div className="flex gap-2">
            <Knob
              label="Drive"
              value={params.distortion.amount}
              min={0}
              max={1}
              onChange={(amount) => updateDistortion({ amount })}
              size="sm"
            />
            <Knob
              label="Mix"
              value={params.distortion.mix}
              min={0}
              max={1}
              onChange={(mix) => updateDistortion({ mix })}
              size="sm"
            />
          </div>
        </div>
      </Panel>

      {/* Chorus */}
      <Panel title="Chorus">
        <div className="flex flex-col gap-3">
          <Toggle
            label="On"
            value={params.chorus.enabled}
            onChange={(enabled) => updateChorus({ enabled })}
          />
          <div className="flex gap-2">
            <Knob
              label="Rate"
              value={params.chorus.rate}
              min={0.1}
              max={5}
              onChange={(rate) => updateChorus({ rate })}
              unit="Hz"
              size="sm"
            />
            <Knob
              label="Depth"
              value={params.chorus.depth}
              min={0}
              max={1}
              onChange={(depth) => updateChorus({ depth })}
              size="sm"
            />
            <Knob
              label="Mix"
              value={params.chorus.mix}
              min={0}
              max={1}
              onChange={(mix) => updateChorus({ mix })}
              size="sm"
            />
          </div>
        </div>
      </Panel>

      {/* Delay */}
      <Panel title="Delay">
        <div className="flex flex-col gap-3">
          <Toggle
            label="On"
            value={params.delay.enabled}
            onChange={(enabled) => updateDelay({ enabled })}
          />
          <div className="flex gap-2">
            <Knob
              label="Time"
              value={params.delay.time}
              min={0.01}
              max={2}
              onChange={(time) => updateDelay({ time })}
              unit="s"
              logarithmic
              size="sm"
            />
            <Knob
              label="Feedback"
              value={params.delay.feedback}
              min={0}
              max={0.95}
              onChange={(feedback) => updateDelay({ feedback })}
              size="sm"
            />
            <Knob
              label="Mix"
              value={params.delay.mix}
              min={0}
              max={1}
              onChange={(mix) => updateDelay({ mix })}
              size="sm"
            />
          </div>
        </div>
      </Panel>

      {/* Reverb */}
      <Panel title="Reverb">
        <div className="flex flex-col gap-3">
          <Toggle
            label="On"
            value={params.reverb.enabled}
            onChange={(enabled) => updateReverb({ enabled })}
          />
          <div className="flex gap-2">
            <Knob
              label="Decay"
              value={params.reverb.decay}
              min={0.1}
              max={10}
              onChange={(decay) => updateReverb({ decay })}
              unit="s"
              logarithmic
              size="sm"
            />
            <Knob
              label="Mix"
              value={params.reverb.mix}
              min={0}
              max={1}
              onChange={(mix) => updateReverb({ mix })}
              size="sm"
            />
          </div>
        </div>
      </Panel>
    </div>
  )
}
