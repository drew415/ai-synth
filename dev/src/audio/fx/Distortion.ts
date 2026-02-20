import { smoothParam } from '../dsp/helpers'

export interface DistortionNode {
  input: GainNode
  output: GainNode
  setAmount: (amount: number) => void
  setMix: (mix: number) => void
  dispose: () => void
}

/**
 * Soft clipping distortion using waveshaper.
 */
export function createDistortion(ctx: AudioContext, amount: number, mix: number): DistortionNode {
  const input = ctx.createGain()
  const output = ctx.createGain()

  // Dry path
  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - mix

  // Wet path
  const wetGain = ctx.createGain()
  wetGain.gain.value = mix

  const waveshaper = ctx.createWaveShaper()
  waveshaper.oversample = '4x'
  waveshaper.curve = makeDistortionCurve(amount)

  // Pre-gain to drive the distortion
  const preGain = ctx.createGain()
  preGain.gain.value = 1 + amount * 2

  // Post-gain to compensate for volume increase
  const postGain = ctx.createGain()
  postGain.gain.value = 1 / (1 + amount)

  // Connect dry path
  input.connect(dryGain)
  dryGain.connect(output)

  // Connect wet path
  input.connect(preGain)
  preGain.connect(waveshaper)
  waveshaper.connect(postGain)
  postGain.connect(wetGain)
  wetGain.connect(output)

  return {
    input,
    output,

    setAmount(newAmount: number) {
      waveshaper.curve = makeDistortionCurve(newAmount)
      smoothParam(preGain.gain, 1 + newAmount * 2, ctx)
      smoothParam(postGain.gain, 1 / (1 + newAmount), ctx)
    },

    setMix(newMix: number) {
      smoothParam(dryGain.gain, 1 - newMix, ctx)
      smoothParam(wetGain.gain, newMix, ctx)
    },

    dispose() {
      input.disconnect()
      dryGain.disconnect()
      preGain.disconnect()
      waveshaper.disconnect()
      postGain.disconnect()
      wetGain.disconnect()
      output.disconnect()
    },
  }
}

/**
 * Creates a soft-clipping distortion curve.
 */
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100
  const curve = new Float32Array(samples)
  const k = amount * 50

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1

    if (k === 0) {
      // No distortion
      curve[i] = x
    } else {
      // Soft clipping using tanh-like curve
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
    }
  }

  return curve
}
