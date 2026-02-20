import type { SynthParams } from '../state/params'
import { Voice } from './Voice'

/**
 * Polyphonic synthesizer with voice allocation and stealing.
 */
export class PolySynth {
  private ctx: AudioContext
  private params: SynthParams
  private voices: Voice[] = []
  private activeNotes: Map<number, Voice> = new Map()
  private output: GainNode

  constructor(ctx: AudioContext, params: SynthParams, destination: AudioNode) {
    this.ctx = ctx
    this.params = params

    this.output = ctx.createGain()
    this.output.gain.value = 1
    this.output.connect(destination)

    // Pre-create voice pool
    this.initVoices()
  }

  /**
   * Triggers a note.
   */
  noteOn(noteNumber: number, velocity: number = 1): void {
    // Check if note is already playing - retrigger it
    const existingVoice = this.activeNotes.get(noteNumber)
    if (existingVoice) {
      existingVoice.noteOff()
      this.activeNotes.delete(noteNumber)
    }

    // Find free voice or steal oldest
    const voice = this.allocateVoice()
    if (!voice) return

    voice.noteOn(noteNumber, velocity)
    this.activeNotes.set(noteNumber, voice)
  }

  /**
   * Releases a note.
   */
  noteOff(noteNumber: number): void {
    const voice = this.activeNotes.get(noteNumber)
    if (voice) {
      voice.noteOff()
      this.activeNotes.delete(noteNumber)
    }
  }

  /**
   * Releases all notes immediately.
   */
  panic(): void {
    this.activeNotes.forEach((voice) => {
      voice.stop()
    })
    this.activeNotes.clear()
  }

  /**
   * Updates parameters for all voices.
   */
  updateParams(params: SynthParams): void {
    this.params = params

    // Update existing voices
    this.voices.forEach((voice) => {
      voice.updateParams(params)
    })

    // Adjust voice pool size if polyphony changed
    if (this.voices.length !== params.polyphony) {
      this.resizeVoicePool(params.polyphony)
    }
  }

  /**
   * Returns the output node.
   */
  getOutput(): AudioNode {
    return this.output
  }

  /**
   * Cleans up all resources.
   */
  dispose(): void {
    this.panic()
    this.voices.forEach((voice) => voice.dispose())
    this.voices = []
    this.output.disconnect()
  }

  private initVoices(): void {
    for (let i = 0; i < this.params.polyphony; i++) {
      const voice = new Voice(this.ctx, this.params, this.output)
      this.voices.push(voice)
    }
  }

  private allocateVoice(): Voice | null {
    // Find a free voice (not active)
    const freeVoice = this.voices.find((v) => !v.state.active)
    if (freeVoice) return freeVoice

    // Voice stealing: find oldest playing voice
    let oldestVoice: Voice | undefined = undefined
    let oldestTime = Infinity

    for (const [, voice] of this.activeNotes) {
      if (voice.state.startTime < oldestTime) {
        oldestTime = voice.state.startTime
        oldestVoice = voice
      }
    }

    if (oldestVoice) {
      // Stop the stolen voice and remove from active notes
      for (const [note, v] of this.activeNotes) {
        if (v === oldestVoice) {
          this.activeNotes.delete(note)
          break
        }
      }
      oldestVoice.stop()
      return oldestVoice
    }

    return null
  }

  private resizeVoicePool(newSize: number): void {
    const currentSize = this.voices.length

    if (newSize > currentSize) {
      // Add voices
      for (let i = currentSize; i < newSize; i++) {
        const voice = new Voice(this.ctx, this.params, this.output)
        this.voices.push(voice)
      }
    } else if (newSize < currentSize) {
      // Remove voices (dispose inactive ones first)
      const toRemove = currentSize - newSize
      let removed = 0

      // First pass: remove inactive voices
      for (let i = this.voices.length - 1; i >= 0 && removed < toRemove; i--) {
        if (!this.voices[i].state.active) {
          this.voices[i].dispose()
          this.voices.splice(i, 1)
          removed++
        }
      }

      // Second pass: force remove if needed
      while (this.voices.length > newSize) {
        const voice = this.voices.pop()
        if (voice) {
          // Remove from active notes if present
          this.activeNotes.forEach((v, note) => {
            if (v === voice) {
              this.activeNotes.delete(note)
            }
          })
          voice.dispose()
        }
      }
    }
  }
}
