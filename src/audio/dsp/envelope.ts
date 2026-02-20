import type { ADSRParams } from '../../state/params'

// Time constant for exponential ramps (prevents clicks)
const MIN_TIME = 0.005

export interface EnvelopeNode {
  param: AudioParam
  triggerAttack: (time: number, velocity?: number) => void
  triggerRelease: (time: number) => void
  cancel: (time: number) => void
}

/**
 * Creates an ADSR envelope controller for an AudioParam.
 * Uses exponential ramps for natural-sounding envelopes.
 */
export function createEnvelope(
  _ctx: AudioContext,
  param: AudioParam,
  env: ADSRParams,
  baseValue: number = 0,
  peakValue: number = 1
): EnvelopeNode {
  return {
    param,

    triggerAttack(time: number, velocity: number = 1) {
      const peak = baseValue + (peakValue - baseValue) * velocity
      const sustainLevel = baseValue + (peak - baseValue) * env.sustain

      // Cancel any scheduled values
      param.cancelScheduledValues(time)

      // Start from base value
      param.setValueAtTime(baseValue, time)

      // Attack phase
      const attackEnd = time + Math.max(env.attack, MIN_TIME)
      param.linearRampToValueAtTime(peak, attackEnd)

      // Decay phase
      const decayEnd = attackEnd + Math.max(env.decay, MIN_TIME)
      param.exponentialRampToValueAtTime(
        Math.max(sustainLevel, 0.0001), // Prevent 0 for exponential ramp
        decayEnd
      )
    },

    triggerRelease(time: number) {
      // Cancel future scheduled values but keep current value
      param.cancelScheduledValues(time)

      // Get current value and hold it
      const currentValue = param.value
      param.setValueAtTime(currentValue, time)

      // Release phase - ramp to near-zero
      const releaseEnd = time + Math.max(env.release, MIN_TIME)
      param.exponentialRampToValueAtTime(0.0001, releaseEnd)
    },

    cancel(time: number) {
      param.cancelScheduledValues(time)
      param.setValueAtTime(baseValue, time)
    },
  }
}

/**
 * Creates a gain node with ADSR envelope control.
 */
export function createEnvelopeGain(
  ctx: AudioContext,
  env: ADSRParams
): { gainNode: GainNode; envelope: EnvelopeNode } {
  const gainNode = ctx.createGain()
  gainNode.gain.value = 0

  const envelope = createEnvelope(ctx, gainNode.gain, env, 0, 1)

  return { gainNode, envelope }
}

/**
 * Applies filter envelope modulation.
 * The envelope modulates around a center frequency.
 */
export function createFilterEnvelope(
  ctx: AudioContext,
  filterNode: BiquadFilterNode,
  env: ADSRParams,
  baseCutoff: number,
  envAmount: number // -1 to 1
): EnvelopeNode {
  // Calculate the frequency range for envelope modulation
  const minFreq = 20
  const maxFreq = 20000

  // envAmount determines direction and depth
  // Positive: envelope opens filter, Negative: envelope closes filter
  const peakFreq =
    envAmount >= 0
      ? Math.min(baseCutoff * Math.pow(2, envAmount * 4), maxFreq)
      : Math.max(baseCutoff * Math.pow(2, envAmount * 4), minFreq)

  return createEnvelope(ctx, filterNode.frequency, env, baseCutoff, peakFreq)
}
