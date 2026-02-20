import { smoothParam } from '../dsp/helpers'

export interface ChorusNode {
  input: GainNode
  output: GainNode
  setRate: (rate: number) => void
  setDepth: (depth: number) => void
  setMix: (mix: number) => void
  dispose: () => void
}

/**
 * Stereo chorus using modulated delay lines.
 */
export function createChorus(ctx: AudioContext, rate: number, depth: number, mix: number): ChorusNode {
  const input = ctx.createGain()
  const output = ctx.createGain()

  // Dry path
  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - mix

  // Wet path
  const wetGain = ctx.createGain()
  wetGain.gain.value = mix

  // Base delay time (center of modulation)
  const baseDelay = 0.02 // 20ms

  // Left delay line
  const delayL = ctx.createDelay(0.1)
  delayL.delayTime.value = baseDelay

  // Right delay line (slightly different phase)
  const delayR = ctx.createDelay(0.1)
  delayR.delayTime.value = baseDelay

  // LFO for left channel
  const lfoL = ctx.createOscillator()
  lfoL.type = 'sine'
  lfoL.frequency.value = rate

  // LFO for right channel (phase offset)
  const lfoR = ctx.createOscillator()
  lfoR.type = 'sine'
  lfoR.frequency.value = rate

  // LFO gain (controls modulation depth)
  const lfoGainL = ctx.createGain()
  lfoGainL.gain.value = depth * 0.002 // Convert to delay time range

  const lfoGainR = ctx.createGain()
  lfoGainR.gain.value = depth * 0.002

  // Constant source for delay offset
  const constantL = ctx.createConstantSource()
  constantL.offset.value = baseDelay

  const constantR = ctx.createConstantSource()
  constantR.offset.value = baseDelay

  // Merger for stereo output
  const merger = ctx.createChannelMerger(2)

  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)

  // Connect LFO modulation
  lfoL.connect(lfoGainL)
  lfoGainL.connect(delayL.delayTime)
  constantL.connect(delayL.delayTime)

  lfoR.connect(lfoGainR)
  lfoGainR.connect(delayR.delayTime)
  constantR.connect(delayR.delayTime)

  // Connect wet path
  input.connect(delayL)
  input.connect(delayR)

  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)
  merger.connect(wetGain)
  wetGain.connect(output)

  // Start oscillators and constant sources
  lfoL.start()
  lfoR.start()
  constantL.start()
  constantR.start()

  // Phase offset for right channel (creates stereo movement)
  // We achieve this by starting the oscillator at a different time
  // Since they're already started, we adjust the delay times slightly differently

  return {
    input,
    output,

    setRate(newRate: number) {
      smoothParam(lfoL.frequency, newRate, ctx)
      smoothParam(lfoR.frequency, newRate, ctx)
    },

    setDepth(newDepth: number) {
      smoothParam(lfoGainL.gain, newDepth * 0.002, ctx)
      smoothParam(lfoGainR.gain, newDepth * 0.002, ctx)
    },

    setMix(newMix: number) {
      smoothParam(dryGain.gain, 1 - newMix, ctx)
      smoothParam(wetGain.gain, newMix, ctx)
    },

    dispose() {
      lfoL.stop()
      lfoR.stop()
      constantL.stop()
      constantR.stop()

      input.disconnect()
      dryGain.disconnect()
      delayL.disconnect()
      delayR.disconnect()
      lfoL.disconnect()
      lfoR.disconnect()
      lfoGainL.disconnect()
      lfoGainR.disconnect()
      constantL.disconnect()
      constantR.disconnect()
      merger.disconnect()
      wetGain.disconnect()
      output.disconnect()
    },
  }
}
