import { smoothParam } from '../dsp/helpers'

export interface ReverbNode {
  input: GainNode
  output: GainNode
  setDecay: (decay: number) => void
  setMix: (mix: number) => void
  dispose: () => void
}

/**
 * Algorithmic reverb using parallel comb filters and allpass filters.
 */
export function createReverb(ctx: AudioContext, decay: number, mix: number): ReverbNode {
  const input = ctx.createGain()
  const output = ctx.createGain()

  // Dry path
  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - mix

  // Wet path
  const wetGain = ctx.createGain()
  wetGain.gain.value = mix

  // Pre-delay
  const preDelay = ctx.createDelay(0.1)
  preDelay.delayTime.value = 0.02

  // Lowpass for warmth
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 6000

  // Highpass to remove mud
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 200

  // Comb filter delays (parallel)
  const combTimes = [0.0297, 0.0371, 0.0411, 0.0437, 0.0479, 0.0531]
  const combDelays: DelayNode[] = []
  const combGains: GainNode[] = []

  for (const time of combTimes) {
    const delay = ctx.createDelay(0.1)
    delay.delayTime.value = time

    const feedback = ctx.createGain()
    feedback.gain.value = Math.pow(0.001, time / decay)

    combDelays.push(delay)
    combGains.push(feedback)
  }

  // Allpass filters (series)
  const allpassTimes = [0.005, 0.0017, 0.0007]
  const allpassDelays: DelayNode[] = []
  const allpassFeedbacks: GainNode[] = []

  for (const time of allpassTimes) {
    const delay = ctx.createDelay(0.1)
    delay.delayTime.value = time

    const feedback = ctx.createGain()
    feedback.gain.value = 0.5

    allpassDelays.push(delay)
    allpassFeedbacks.push(feedback)
  }

  // Merger for parallel combs
  const combMerger = ctx.createGain()
  combMerger.gain.value = 0.3

  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)

  // Connect wet path
  input.connect(preDelay)
  preDelay.connect(highpass)
  highpass.connect(lowpass)

  // Connect parallel comb filters
  for (let i = 0; i < combDelays.length; i++) {
    lowpass.connect(combDelays[i])
    combDelays[i].connect(combGains[i])
    combGains[i].connect(combDelays[i]) // Feedback loop
    combDelays[i].connect(combMerger)
  }

  // Connect series allpass filters
  let currentNode: AudioNode = combMerger
  for (let i = 0; i < allpassDelays.length; i++) {
    currentNode.connect(allpassDelays[i])
    allpassDelays[i].connect(allpassFeedbacks[i])
    allpassFeedbacks[i].connect(allpassDelays[i]) // Feedback

    // Feedforward path (for allpass characteristic)
    const feedforward = ctx.createGain()
    feedforward.gain.value = -0.5
    currentNode.connect(feedforward)
    feedforward.connect(allpassDelays[i])

    currentNode = allpassDelays[i]
  }

  currentNode.connect(wetGain)
  wetGain.connect(output)

  return {
    input,
    output,

    setDecay(newDecay: number) {
      for (let i = 0; i < combDelays.length; i++) {
        const time = combTimes[i]
        const newFeedback = Math.pow(0.001, time / newDecay)
        smoothParam(combGains[i].gain, newFeedback, ctx)
      }
    },

    setMix(newMix: number) {
      smoothParam(dryGain.gain, 1 - newMix, ctx)
      smoothParam(wetGain.gain, newMix, ctx)
    },

    dispose() {
      input.disconnect()
      dryGain.disconnect()
      preDelay.disconnect()
      highpass.disconnect()
      lowpass.disconnect()
      combMerger.disconnect()

      for (const delay of combDelays) {
        delay.disconnect()
      }
      for (const gain of combGains) {
        gain.disconnect()
      }
      for (const delay of allpassDelays) {
        delay.disconnect()
      }
      for (const feedback of allpassFeedbacks) {
        feedback.disconnect()
      }

      wetGain.disconnect()
      output.disconnect()
    },
  }
}
