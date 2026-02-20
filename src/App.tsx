import { useState, useCallback, useEffect } from 'react'
import { AudioEngine } from './audio/AudioEngine'
import { DEFAULT_PARAMS, type SynthParams } from './state/params'
import { Keyboard } from './ui/keyboard/Keyboard'
import { OscillatorPanel } from './ui/synth/OscillatorPanel'
import { EnvelopePanel } from './ui/synth/EnvelopePanel'
import { FilterPanel } from './ui/synth/FilterPanel'
import { Panel } from './ui/components/Panel'
import { Knob } from './ui/components/Knob'
import { Toggle } from './ui/components/Toggle'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [params, setParams] = useState<SynthParams>(DEFAULT_PARAMS)

  // Initialize audio on first interaction
  const handleInit = useCallback(async () => {
    await AudioEngine.init()
    setIsInitialized(true)
  }, [])

  // Update params in state and engine
  const updateParams = useCallback((updates: Partial<SynthParams>) => {
    setParams((prev) => {
      const next = { ...prev, ...updates }
      AudioEngine.setParams(next)
      return next
    })
  }, [])

  // Deep param updates for nested objects
  const updateOsc1 = useCallback(
    (updates: Partial<SynthParams['osc1']>) => {
      updateParams({ osc1: { ...params.osc1, ...updates } })
    },
    [params.osc1, updateParams]
  )

  const updateOsc2 = useCallback(
    (updates: Partial<SynthParams['osc2']>) => {
      updateParams({ osc2: { ...params.osc2, ...updates } })
    },
    [params.osc2, updateParams]
  )

  const updateFilter = useCallback(
    (updates: Partial<SynthParams['filter']>) => {
      updateParams({ filter: { ...params.filter, ...updates } })
    },
    [params.filter, updateParams]
  )

  const updateAmpEnv = useCallback(
    (updates: Partial<SynthParams['ampEnv']>) => {
      updateParams({ ampEnv: { ...params.ampEnv, ...updates } })
    },
    [params.ampEnv, updateParams]
  )

  const updateFilterEnv = useCallback(
    (updates: Partial<SynthParams['filterEnv']>) => {
      updateParams({ filterEnv: { ...params.filterEnv, ...updates } })
    },
    [params.filterEnv, updateParams]
  )

  const updateSubOsc = useCallback(
    (updates: Partial<SynthParams['subOsc']>) => {
      updateParams({ subOsc: { ...params.subOsc, ...updates } })
    },
    [params.subOsc, updateParams]
  )

  const updateNoise = useCallback(
    (updates: Partial<SynthParams['noise']>) => {
      updateParams({ noise: { ...params.noise, ...updates } })
    },
    [params.noise, updateParams]
  )

  const updateUnison = useCallback(
    (updates: Partial<SynthParams['unison']>) => {
      updateParams({ unison: { ...params.unison, ...updates } })
    },
    [params.unison, updateParams]
  )

  // Note handlers
  const handleNoteOn = useCallback(
    (note: number, velocity: number) => {
      if (!isInitialized) return
      AudioEngine.noteOn(note, velocity)
    },
    [isInitialized]
  )

  const handleNoteOff = useCallback(
    (note: number) => {
      if (!isInitialized) return
      AudioEngine.noteOff(note)
    },
    [isInitialized]
  )

  // Panic button
  const handlePanic = useCallback(() => {
    AudioEngine.panic()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      AudioEngine.dispose()
    }
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={handleInit}
          className="px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white text-lg font-medium rounded-lg transition-colors"
        >
          Start Synth
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Synth</h1>
          <div className="flex items-center gap-4">
            <Knob
              label="Master"
              value={params.masterVolume}
              min={0}
              max={1}
              onChange={(masterVolume) => updateParams({ masterVolume })}
              size="sm"
            />
            <button
              onClick={handlePanic}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm
                font-medium rounded transition-colors"
            >
              Panic
            </button>
          </div>
        </header>

        {/* Main synth controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Oscillators */}
          <OscillatorPanel title="OSC 1" params={params.osc1} onChange={updateOsc1} />
          <OscillatorPanel title="OSC 2" params={params.osc2} onChange={updateOsc2} />

          {/* Sub & Noise */}
          <Panel title="Sub / Noise">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Toggle
                  label="Sub"
                  value={params.subOsc.enabled}
                  onChange={(enabled) => updateSubOsc({ enabled })}
                />
                <Knob
                  label="Level"
                  value={params.subOsc.level}
                  min={0}
                  max={1}
                  onChange={(level) => updateSubOsc({ level })}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Toggle
                  label="Noise"
                  value={params.noise.enabled}
                  onChange={(enabled) => updateNoise({ enabled })}
                />
                <Knob
                  label="Level"
                  value={params.noise.level}
                  min={0}
                  max={1}
                  onChange={(level) => updateNoise({ level })}
                  size="sm"
                />
              </div>
            </div>
          </Panel>

          {/* Unison */}
          <Panel title="Unison">
            <div className="flex gap-2 justify-between">
              <Knob
                label="Voices"
                value={params.unison.voices}
                min={1}
                max={7}
                step={1}
                onChange={(voices) => updateUnison({ voices })}
                size="sm"
              />
              <Knob
                label="Detune"
                value={params.unison.detune}
                min={0}
                max={50}
                onChange={(detune) => updateUnison({ detune })}
                unit="c"
                size="sm"
              />
              <Knob
                label="Spread"
                value={params.unison.spread}
                min={0}
                max={1}
                onChange={(spread) => updateUnison({ spread })}
                size="sm"
              />
            </div>
          </Panel>
        </div>

        {/* Filter & Envelopes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterPanel params={params.filter} onChange={updateFilter} />
          <EnvelopePanel title="Amp Envelope" params={params.ampEnv} onChange={updateAmpEnv} />
          <EnvelopePanel title="Filter Envelope" params={params.filterEnv} onChange={updateFilterEnv} />
        </div>

        {/* Glide */}
        <Panel title="Performance">
          <div className="flex gap-4">
            <Knob
              label="Glide"
              value={params.glide}
              min={0}
              max={1}
              onChange={(glide) => updateParams({ glide })}
              unit="s"
              size="sm"
            />
            <Knob
              label="Polyphony"
              value={params.polyphony}
              min={1}
              max={16}
              step={1}
              onChange={(polyphony) => updateParams({ polyphony })}
              size="sm"
            />
          </div>
        </Panel>

        {/* Keyboard */}
        <Panel title="Keyboard">
          <Keyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
        </Panel>
      </div>
    </div>
  )
}

export default App
