import type { SynthParams } from '../state/params'
import { DEFAULT_PARAMS } from '../state/params'
import { PolySynth } from './PolySynth'
import { createFxRack, type FxRack } from './fx/FxRack'
import { smoothParam } from './dsp/helpers'

/**
 * Singleton audio engine managing the Web Audio context and synth.
 */
class AudioEngineClass {
  private ctx: AudioContext | null = null
  private synth: PolySynth | null = null
  private fxRack: FxRack | null = null
  private masterGain: GainNode | null = null
  private params: SynthParams = { ...DEFAULT_PARAMS }
  private initialized = false

  /**
   * Initializes the audio context. Must be called from a user gesture.
   */
  async init(): Promise<void> {
    if (this.initialized) return

    this.ctx = new AudioContext()

    // Resume if suspended (required by browsers)
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    // Create master gain
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.params.masterVolume
    this.masterGain.connect(this.ctx.destination)

    // Create FX rack
    this.fxRack = createFxRack(this.ctx, this.params.fx)
    this.fxRack.output.connect(this.masterGain)

    // Create synth
    this.synth = new PolySynth(this.ctx, this.params, this.fxRack.input)

    this.initialized = true
  }

  /**
   * Returns whether the engine is initialized.
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Returns the audio context.
   */
  getContext(): AudioContext | null {
    return this.ctx
  }

  /**
   * Triggers a note.
   */
  noteOn(noteNumber: number, velocity: number = 1): void {
    if (!this.synth) return
    this.synth.noteOn(noteNumber, velocity)
  }

  /**
   * Releases a note.
   */
  noteOff(noteNumber: number): void {
    if (!this.synth) return
    this.synth.noteOff(noteNumber)
  }

  /**
   * Immediately stops all notes.
   */
  panic(): void {
    this.synth?.panic()
  }

  /**
   * Updates synth parameters.
   */
  setParams(params: Partial<SynthParams>): void {
    this.params = { ...this.params, ...params }

    if (this.synth) {
      this.synth.updateParams(this.params)
    }

    if (this.fxRack) {
      this.fxRack.updateParams(this.params.fx)
    }

    if (this.masterGain && this.ctx) {
      smoothParam(this.masterGain.gain, this.params.masterVolume, this.ctx)
    }
  }

  /**
   * Returns current parameters.
   */
  getParams(): SynthParams {
    return { ...this.params }
  }

  /**
   * Sets master volume (0-1).
   */
  setMasterVolume(volume: number): void {
    this.params.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.masterGain && this.ctx) {
      smoothParam(this.masterGain.gain, this.params.masterVolume, this.ctx)
    }
  }

  /**
   * Suspends the audio context to save resources.
   */
  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend()
    }
  }

  /**
   * Resumes the audio context.
   */
  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  /**
   * Disposes all resources.
   */
  dispose(): void {
    this.synth?.dispose()
    this.fxRack?.dispose()
    this.masterGain?.disconnect()
    this.ctx?.close()

    this.synth = null
    this.fxRack = null
    this.masterGain = null
    this.ctx = null
    this.initialized = false
  }
}

// Export singleton instance
export const AudioEngine = new AudioEngineClass()
