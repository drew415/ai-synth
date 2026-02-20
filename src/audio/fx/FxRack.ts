import type { FXParams } from '../../state/params'
import { createDistortion, type DistortionNode } from './Distortion'
import { createDelay, type DelayNode } from './Delay'
import { createReverb, type ReverbNode } from './Reverb'
import { createChorus, type ChorusNode } from './Chorus'
import { createLimiter, type LimiterNode } from './Limiter'

export interface FxRack {
  input: GainNode
  output: GainNode
  updateParams: (params: FXParams) => void
  dispose: () => void
}

/**
 * Creates a complete FX chain:
 * Distortion -> Chorus -> Delay -> Reverb -> Limiter
 */
export function createFxRack(ctx: AudioContext, params: FXParams): FxRack {
  const input = ctx.createGain()
  const output = ctx.createGain()

  // Create FX modules
  let distortion: DistortionNode | null = null
  let chorus: ChorusNode | null = null
  let delay: DelayNode | null = null
  let reverb: ReverbNode | null = null
  let limiter: LimiterNode | null = null

  // Bypass nodes for disabled effects
  const distortionBypass = ctx.createGain()
  const chorusBypass = ctx.createGain()
  const delayBypass = ctx.createGain()
  const reverbBypass = ctx.createGain()

  // Initialize effects
  if (params.distortion.enabled) {
    distortion = createDistortion(ctx, params.distortion.amount, params.distortion.mix)
  }

  if (params.chorus.enabled) {
    chorus = createChorus(ctx, params.chorus.rate, params.chorus.depth, params.chorus.mix)
  }

  if (params.delay.enabled) {
    delay = createDelay(ctx, params.delay.time, params.delay.feedback, params.delay.mix)
  }

  if (params.reverb.enabled) {
    reverb = createReverb(ctx, params.reverb.decay, params.reverb.mix)
  }

  // Always have limiter at the end
  limiter = createLimiter(ctx)

  // Wire up the chain
  function rebuildChain() {
    // Disconnect everything first
    input.disconnect()
    distortionBypass.disconnect()
    chorusBypass.disconnect()
    delayBypass.disconnect()
    reverbBypass.disconnect()
    distortion?.output.disconnect()
    chorus?.output.disconnect()
    delay?.output.disconnect()
    reverb?.output.disconnect()

    // Build chain: input -> distortion/bypass -> chorus/bypass -> delay/bypass -> reverb/bypass -> limiter -> output
    let currentNode: AudioNode = input

    // Distortion
    if (distortion) {
      currentNode.connect(distortion.input)
      currentNode = distortion.output
    } else {
      currentNode.connect(distortionBypass)
      currentNode = distortionBypass
    }

    // Chorus
    if (chorus) {
      currentNode.connect(chorus.input)
      currentNode = chorus.output
    } else {
      currentNode.connect(chorusBypass)
      currentNode = chorusBypass
    }

    // Delay
    if (delay) {
      currentNode.connect(delay.input)
      currentNode = delay.output
    } else {
      currentNode.connect(delayBypass)
      currentNode = delayBypass
    }

    // Reverb
    if (reverb) {
      currentNode.connect(reverb.input)
      currentNode = reverb.output
    } else {
      currentNode.connect(reverbBypass)
      currentNode = reverbBypass
    }

    // Limiter
    if (limiter) {
      currentNode.connect(limiter.input)
      limiter.output.connect(output)
    } else {
      currentNode.connect(output)
    }
  }

  rebuildChain()

  return {
    input,
    output,

    updateParams(newParams: FXParams) {
      // Distortion
      if (newParams.distortion.enabled !== (distortion !== null)) {
        if (newParams.distortion.enabled) {
          distortion = createDistortion(ctx, newParams.distortion.amount, newParams.distortion.mix)
        } else {
          distortion?.dispose()
          distortion = null
        }
        rebuildChain()
      } else if (distortion) {
        distortion.setAmount(newParams.distortion.amount)
        distortion.setMix(newParams.distortion.mix)
      }

      // Chorus
      if (newParams.chorus.enabled !== (chorus !== null)) {
        if (newParams.chorus.enabled) {
          chorus = createChorus(ctx, newParams.chorus.rate, newParams.chorus.depth, newParams.chorus.mix)
        } else {
          chorus?.dispose()
          chorus = null
        }
        rebuildChain()
      } else if (chorus) {
        chorus.setRate(newParams.chorus.rate)
        chorus.setDepth(newParams.chorus.depth)
        chorus.setMix(newParams.chorus.mix)
      }

      // Delay
      if (newParams.delay.enabled !== (delay !== null)) {
        if (newParams.delay.enabled) {
          delay = createDelay(ctx, newParams.delay.time, newParams.delay.feedback, newParams.delay.mix)
        } else {
          delay?.dispose()
          delay = null
        }
        rebuildChain()
      } else if (delay) {
        delay.setTime(newParams.delay.time)
        delay.setFeedback(newParams.delay.feedback)
        delay.setMix(newParams.delay.mix)
      }

      // Reverb
      if (newParams.reverb.enabled !== (reverb !== null)) {
        if (newParams.reverb.enabled) {
          reverb = createReverb(ctx, newParams.reverb.decay, newParams.reverb.mix)
        } else {
          reverb?.dispose()
          reverb = null
        }
        rebuildChain()
      } else if (reverb) {
        reverb.setDecay(newParams.reverb.decay)
        reverb.setMix(newParams.reverb.mix)
      }
    },

    dispose() {
      distortion?.dispose()
      chorus?.dispose()
      delay?.dispose()
      reverb?.dispose()
      limiter?.dispose()

      input.disconnect()
      distortionBypass.disconnect()
      chorusBypass.disconnect()
      delayBypass.disconnect()
      reverbBypass.disconnect()
      output.disconnect()
    },
  }
}
