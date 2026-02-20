export interface LimiterNode {
  input: GainNode
  output: GainNode
  dispose: () => void
}

/**
 * Soft limiter to prevent clipping.
 * Uses a compressor with fast attack and high ratio.
 */
export function createLimiter(ctx: AudioContext): LimiterNode {
  const input = ctx.createGain()
  const output = ctx.createGain()

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -3 // Start limiting at -3dB
  compressor.knee.value = 0 // Hard knee for limiting
  compressor.ratio.value = 20 // High ratio for limiting
  compressor.attack.value = 0.001 // Very fast attack
  compressor.release.value = 0.1 // Quick release

  // Makeup gain to restore some level
  const makeup = ctx.createGain()
  makeup.gain.value = 1.1

  input.connect(compressor)
  compressor.connect(makeup)
  makeup.connect(output)

  return {
    input,
    output,

    dispose() {
      input.disconnect()
      compressor.disconnect()
      makeup.disconnect()
      output.disconnect()
    },
  }
}
