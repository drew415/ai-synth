import { smoothParam } from '../dsp/helpers'

export interface DelayNode {
  input: GainNode
  output: GainNode
  setTime: (time: number) => void
  setFeedback: (feedback: number) => void
  setMix: (mix: number) => void
  dispose: () => void
}

/**
 * Stereo delay with feedback.
 */
export function createDelay(ctx: AudioContext, time: number, feedback: number, mix: number): DelayNode {
  const input = ctx.createGain()
  const output = ctx.createGain()

  // Dry path
  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - mix

  // Wet path
  const wetGain = ctx.createGain()
  wetGain.gain.value = mix

  // Delay lines (slightly different times for stereo width)
  const delayL = ctx.createDelay(5)
  const delayR = ctx.createDelay(5)
  delayL.delayTime.value = time
  delayR.delayTime.value = time * 1.02 // Slight offset for stereo

  // Feedback gains
  const feedbackL = ctx.createGain()
  const feedbackR = ctx.createGain()
  feedbackL.gain.value = feedback
  feedbackR.gain.value = feedback

  // Cross-feedback for ping-pong effect
  const crossFeedback = ctx.createGain()
  crossFeedback.gain.value = feedback * 0.3

  // Highpass to prevent mud in feedback
  const feedbackFilter = ctx.createBiquadFilter()
  feedbackFilter.type = 'highpass'
  feedbackFilter.frequency.value = 200

  // Lowpass to soften repeats
  const damping = ctx.createBiquadFilter()
  damping.type = 'lowpass'
  damping.frequency.value = 4000

  // Merger for stereo output
  const merger = ctx.createChannelMerger(2)

  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)

  // Connect wet path - left
  input.connect(delayL)
  delayL.connect(feedbackFilter)
  feedbackFilter.connect(damping)
  damping.connect(feedbackL)
  feedbackL.connect(delayL)

  // Connect wet path - right
  input.connect(delayR)
  delayR.connect(feedbackR)
  feedbackR.connect(delayR)

  // Cross feedback
  delayL.connect(crossFeedback)
  crossFeedback.connect(delayR)

  // Output
  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)
  merger.connect(wetGain)
  wetGain.connect(output)

  return {
    input,
    output,

    setTime(newTime: number) {
      smoothParam(delayL.delayTime, newTime, ctx)
      smoothParam(delayR.delayTime, newTime * 1.02, ctx)
    },

    setFeedback(newFeedback: number) {
      // Clamp to prevent runaway
      const clampedFeedback = Math.min(newFeedback, 0.95)
      smoothParam(feedbackL.gain, clampedFeedback, ctx)
      smoothParam(feedbackR.gain, clampedFeedback, ctx)
      smoothParam(crossFeedback.gain, clampedFeedback * 0.3, ctx)
    },

    setMix(newMix: number) {
      smoothParam(dryGain.gain, 1 - newMix, ctx)
      smoothParam(wetGain.gain, newMix, ctx)
    },

    dispose() {
      input.disconnect()
      dryGain.disconnect()
      delayL.disconnect()
      delayR.disconnect()
      feedbackL.disconnect()
      feedbackR.disconnect()
      crossFeedback.disconnect()
      feedbackFilter.disconnect()
      damping.disconnect()
      merger.disconnect()
      wetGain.disconnect()
      output.disconnect()
    },
  }
}
