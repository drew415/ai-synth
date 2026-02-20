/**
 * Smoothly ramps an AudioParam to avoid clicks.
 */
export function smoothParam(
  param: AudioParam,
  value: number,
  ctx: AudioContext,
  rampTime: number = 0.02
): void {
  param.cancelScheduledValues(ctx.currentTime)
  param.setValueAtTime(param.value, ctx.currentTime)
  param.linearRampToValueAtTime(value, ctx.currentTime + rampTime)
}

/**
 * Sets a param immediately (use sparingly - can cause clicks).
 */
export function setParamNow(param: AudioParam, value: number, ctx: AudioContext): void {
  param.cancelScheduledValues(ctx.currentTime)
  param.setValueAtTime(value, ctx.currentTime)
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Converts decibels to linear gain.
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

/**
 * Converts linear gain to decibels.
 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(gain, 0.0001))
}

/**
 * Maps a 0-1 value to a logarithmic frequency range.
 */
export function normalizedToFreq(normalized: number, minFreq: number = 20, maxFreq: number = 20000): number {
  const minLog = Math.log2(minFreq)
  const maxLog = Math.log2(maxFreq)
  return Math.pow(2, minLog + normalized * (maxLog - minLog))
}

/**
 * Maps a frequency to a 0-1 normalized value.
 */
export function freqToNormalized(freq: number, minFreq: number = 20, maxFreq: number = 20000): number {
  const minLog = Math.log2(minFreq)
  const maxLog = Math.log2(maxFreq)
  const freqLog = Math.log2(clamp(freq, minFreq, maxFreq))
  return (freqLog - minLog) / (maxLog - minLog)
}

/**
 * Generates a detune spread for unison voices.
 * Returns an array of detune values in cents, centered around 0.
 */
export function generateUnisonDetunes(voiceCount: number, maxDetune: number): number[] {
  if (voiceCount <= 1) return [0]

  const detunes: number[] = []
  for (let i = 0; i < voiceCount; i++) {
    // Spread evenly from -maxDetune to +maxDetune
    const t = i / (voiceCount - 1) // 0 to 1
    detunes.push((t * 2 - 1) * maxDetune) // -maxDetune to +maxDetune
  }
  return detunes
}

/**
 * Generates stereo pan positions for unison voices.
 * Returns an array of pan values from -1 (left) to 1 (right).
 */
export function generateUnisonPans(voiceCount: number, spread: number): number[] {
  if (voiceCount <= 1) return [0]

  const pans: number[] = []
  for (let i = 0; i < voiceCount; i++) {
    const t = i / (voiceCount - 1) // 0 to 1
    pans.push((t * 2 - 1) * spread) // -spread to +spread
  }
  return pans
}
