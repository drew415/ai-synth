import type { OscWaveform } from '../../state/params'

export interface LFONode {
  oscillator: OscillatorNode
  gain: GainNode
  connect: (param: AudioParam) => void
  disconnect: () => void
  setRate: (rate: number) => void
  setDepth: (depth: number) => void
  setWaveform: (waveform: OscWaveform) => void
}

/**
 * Creates an LFO (Low Frequency Oscillator) for modulation.
 * The LFO outputs a signal that can be connected to AudioParams.
 */
export function createLFO(ctx: AudioContext, rate: number, depth: number, waveform: OscWaveform): LFONode {
  const oscillator = ctx.createOscillator()
  oscillator.type = waveform
  oscillator.frequency.value = rate

  const gain = ctx.createGain()
  gain.gain.value = depth

  oscillator.connect(gain)
  oscillator.start()

  return {
    oscillator,
    gain,

    connect(param: AudioParam) {
      gain.connect(param)
    },

    disconnect() {
      try {
        gain.disconnect()
      } catch {
        // Already disconnected
      }
    },

    setRate(rate: number) {
      oscillator.frequency.setValueAtTime(rate, ctx.currentTime)
    },

    setDepth(depth: number) {
      gain.gain.setValueAtTime(depth, ctx.currentTime)
    },

    setWaveform(waveform: OscWaveform) {
      oscillator.type = waveform
    },
  }
}

/**
 * Creates a pitch modulation LFO.
 * Output is in cents (100 = 1 semitone).
 */
export function createPitchLFO(ctx: AudioContext, rate: number, depthCents: number, waveform: OscWaveform): LFONode {
  return createLFO(ctx, rate, depthCents, waveform)
}

/**
 * Creates a filter cutoff modulation LFO.
 * Depth is multiplicative factor (0-1).
 */
export function createFilterLFO(
  ctx: AudioContext,
  rate: number,
  depth: number,
  waveform: OscWaveform,
  baseCutoff: number
): LFONode {
  // Convert depth (0-1) to frequency range
  const frequencyRange = baseCutoff * depth
  return createLFO(ctx, rate, frequencyRange, waveform)
}

/**
 * Creates an amplitude modulation LFO (tremolo).
 * Depth is 0-1 (1 = full tremolo).
 */
export function createAmpLFO(ctx: AudioContext, rate: number, depth: number, waveform: OscWaveform): LFONode {
  // For amp LFO, we want the output to oscillate around 1
  // with depth determining the modulation amount
  const lfo = createLFO(ctx, rate, depth, waveform)

  // We'll need to add a constant offset of 1 for proper tremolo
  // This is handled externally by connecting to a gain node set to 1

  return lfo
}
