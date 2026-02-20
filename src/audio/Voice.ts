import type { SynthParams } from '../state/params'
import { midiToFreq } from '../state/params'
import { createEnvelope, type EnvelopeNode } from './dsp/envelope'
import { smoothParam, generateUnisonDetunes, generateUnisonPans } from './dsp/helpers'

export interface VoiceState {
  active: boolean
  noteNumber: number
  velocity: number
  startTime: number
}

interface UnisonVoice {
  osc1: OscillatorNode
  osc2: OscillatorNode | null
  subOsc: OscillatorNode | null
  panner: StereoPannerNode
}

/**
 * A single synthesizer voice with oscillators, filter, and envelopes.
 *
 * Signal chain:
 * osc1 + osc2 + subOsc + noise -> mixer -> filter -> ampEnvGain -> output
 */
export class Voice {
  private ctx: AudioContext
  private params: SynthParams

  // State
  state: VoiceState = {
    active: false,
    noteNumber: 0,
    velocity: 0,
    startTime: 0,
  }

  // Nodes
  private unisonVoices: UnisonVoice[] = []
  private noiseNode: AudioBufferSourceNode | null = null
  private noiseGain: GainNode
  private mixer: GainNode
  private filter: BiquadFilterNode
  private ampEnvGain: GainNode
  private output: GainNode

  // Envelopes
  private ampEnvelope!: EnvelopeNode
  private filterEnvelope!: EnvelopeNode

  // Target frequency for glide
  private targetFreq: number = 440

  constructor(ctx: AudioContext, params: SynthParams, destination: AudioNode) {
    this.ctx = ctx
    this.params = params

    // Create static nodes
    this.mixer = ctx.createGain()
    this.mixer.gain.value = 1

    this.noiseGain = ctx.createGain()
    this.noiseGain.gain.value = 0

    this.filter = ctx.createBiquadFilter()
    this.filter.type = params.filter.type
    this.filter.frequency.value = params.filter.cutoff
    this.filter.Q.value = params.filter.resonance

    this.ampEnvGain = ctx.createGain()
    this.ampEnvGain.gain.value = 0

    this.output = ctx.createGain()
    this.output.gain.value = 1

    // Connect static chain
    this.noiseGain.connect(this.mixer)
    this.mixer.connect(this.filter)
    this.filter.connect(this.ampEnvGain)
    this.ampEnvGain.connect(this.output)
    this.output.connect(destination)

    // Create envelopes
    this.ampEnvelope = createEnvelope(
      ctx,
      this.ampEnvGain.gain,
      params.ampEnv,
      0,
      1
    )
  }

  /**
   * Starts the voice playing a note.
   */
  noteOn(noteNumber: number, velocity: number = 1, time?: number): void {
    const now = time ?? this.ctx.currentTime
    const freq = midiToFreq(noteNumber)

    // Update state
    this.state = {
      active: true,
      noteNumber,
      velocity,
      startTime: now,
    }

    // Handle glide
    const glideTime = this.params.glide
    if (glideTime > 0 && this.targetFreq !== freq) {
      // Glide from current frequency
      this.setFrequencyWithGlide(freq, glideTime, now)
    } else {
      this.targetFreq = freq
    }

    // Create unison oscillators
    this.createOscillators(freq, now)

    // Create noise if enabled
    if (this.params.noise.enabled) {
      this.createNoise(now)
    }

    // Trigger envelopes
    this.ampEnvelope.triggerAttack(now, velocity)

    // Create and trigger filter envelope
    this.filterEnvelope = createEnvelope(
      this.ctx,
      this.filter.frequency,
      this.params.filterEnv,
      this.params.filter.cutoff,
      this.calculateFilterEnvPeak()
    )
    this.filterEnvelope.triggerAttack(now, velocity)
  }

  /**
   * Releases the voice.
   */
  noteOff(time?: number): void {
    const now = time ?? this.ctx.currentTime

    // Trigger release envelopes
    this.ampEnvelope.triggerRelease(now)
    this.filterEnvelope?.triggerRelease(now)

    // Schedule cleanup after release
    const releaseTime = this.params.ampEnv.release + 0.1
    setTimeout(() => {
      if (!this.state.active) {
        this.cleanup()
      }
    }, releaseTime * 1000)

    this.state.active = false
  }

  /**
   * Immediately stops and cleans up the voice.
   */
  stop(): void {
    this.state.active = false
    this.cleanup()
  }

  /**
   * Updates voice parameters in real-time.
   */
  updateParams(params: SynthParams): void {
    this.params = params

    // Update filter
    this.filter.type = params.filter.type
    smoothParam(this.filter.frequency, params.filter.cutoff, this.ctx)
    smoothParam(this.filter.Q, params.filter.resonance, this.ctx)

    // Update oscillator levels
    this.unisonVoices.forEach((uv) => {
      if (uv.osc1) {
        uv.osc1.type = params.osc1.waveform
      }
      if (uv.osc2) {
        uv.osc2.type = params.osc2.waveform
      }
    })

    // Update noise
    if (this.noiseNode) {
      smoothParam(
        this.noiseGain.gain,
        params.noise.enabled ? params.noise.level : 0,
        this.ctx
      )
    }
  }

  /**
   * Returns the output node for routing.
   */
  getOutput(): AudioNode {
    return this.output
  }

  private createOscillators(baseFreq: number, time: number): void {
    // Clean up existing oscillators
    this.cleanupOscillators()

    const { unison, osc1, osc2, subOsc } = this.params
    const detunes = generateUnisonDetunes(unison.voices, unison.detune)
    const pans = generateUnisonPans(unison.voices, unison.spread)

    // Calculate per-voice gain to maintain constant volume
    const voiceGain = 1 / Math.sqrt(unison.voices)

    for (let i = 0; i < unison.voices; i++) {
      const uv: UnisonVoice = {
        osc1: this.ctx.createOscillator(),
        osc2: null,
        subOsc: null,
        panner: this.ctx.createStereoPanner(),
      }

      // Configure panner
      uv.panner.pan.value = pans[i]

      // OSC1
      uv.osc1.type = osc1.waveform
      uv.osc1.frequency.value = baseFreq * Math.pow(2, osc1.octave)
      uv.osc1.detune.value = osc1.detune + detunes[i]

      const osc1Gain = this.ctx.createGain()
      osc1Gain.gain.value = osc1.enabled ? osc1.level * voiceGain : 0
      uv.osc1.connect(osc1Gain)
      osc1Gain.connect(uv.panner)

      // OSC2
      if (osc2.enabled) {
        uv.osc2 = this.ctx.createOscillator()
        uv.osc2.type = osc2.waveform
        uv.osc2.frequency.value = baseFreq * Math.pow(2, osc2.octave)
        uv.osc2.detune.value = osc2.detune + detunes[i]

        const osc2Gain = this.ctx.createGain()
        osc2Gain.gain.value = osc2.level * voiceGain
        uv.osc2.connect(osc2Gain)
        osc2Gain.connect(uv.panner)
      }

      // Sub oscillator (only on center voice for clarity)
      if (subOsc.enabled && i === Math.floor(unison.voices / 2)) {
        uv.subOsc = this.ctx.createOscillator()
        uv.subOsc.type = 'sine'
        uv.subOsc.frequency.value = baseFreq * Math.pow(2, subOsc.octave)

        const subGain = this.ctx.createGain()
        subGain.gain.value = subOsc.level
        uv.subOsc.connect(subGain)
        subGain.connect(uv.panner)
      }

      // Connect to mixer
      uv.panner.connect(this.mixer)

      // Start oscillators
      uv.osc1.start(time)
      uv.osc2?.start(time)
      uv.subOsc?.start(time)

      this.unisonVoices.push(uv)
    }
  }

  private createNoise(time: number): void {
    // Clean up existing noise
    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
        this.noiseNode.disconnect()
      } catch {
        // Already stopped
      }
    }

    // Create noise buffer
    const bufferSize = 2 * this.ctx.sampleRate
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    if (this.params.noise.type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }
    } else {
      // Pink noise using Paul Kellet's algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    }

    this.noiseNode = this.ctx.createBufferSource()
    this.noiseNode.buffer = noiseBuffer
    this.noiseNode.loop = true
    this.noiseNode.connect(this.noiseGain)

    this.noiseGain.gain.value = this.params.noise.level
    this.noiseNode.start(time)
  }

  private setFrequencyWithGlide(targetFreq: number, glideTime: number, time: number): void {
    this.unisonVoices.forEach((uv) => {
      const { osc1, osc2 } = this.params

      uv.osc1.frequency.cancelScheduledValues(time)
      uv.osc1.frequency.setValueAtTime(uv.osc1.frequency.value, time)
      uv.osc1.frequency.exponentialRampToValueAtTime(
        targetFreq * Math.pow(2, osc1.octave),
        time + glideTime
      )

      if (uv.osc2) {
        uv.osc2.frequency.cancelScheduledValues(time)
        uv.osc2.frequency.setValueAtTime(uv.osc2.frequency.value, time)
        uv.osc2.frequency.exponentialRampToValueAtTime(
          targetFreq * Math.pow(2, osc2.octave),
          time + glideTime
        )
      }

      if (uv.subOsc) {
        uv.subOsc.frequency.cancelScheduledValues(time)
        uv.subOsc.frequency.setValueAtTime(uv.subOsc.frequency.value, time)
        uv.subOsc.frequency.exponentialRampToValueAtTime(
          targetFreq * Math.pow(2, this.params.subOsc.octave),
          time + glideTime
        )
      }
    })

    this.targetFreq = targetFreq
  }

  private calculateFilterEnvPeak(): number {
    const { cutoff, envAmount } = this.params.filter
    const minFreq = 20
    const maxFreq = 20000

    if (envAmount >= 0) {
      return Math.min(cutoff * Math.pow(2, envAmount * 4), maxFreq)
    } else {
      return Math.max(cutoff * Math.pow(2, envAmount * 4), minFreq)
    }
  }

  private cleanupOscillators(): void {
    this.unisonVoices.forEach((uv) => {
      try {
        uv.osc1.stop()
        uv.osc1.disconnect()
        uv.osc2?.stop()
        uv.osc2?.disconnect()
        uv.subOsc?.stop()
        uv.subOsc?.disconnect()
        uv.panner.disconnect()
      } catch {
        // Already stopped
      }
    })
    this.unisonVoices = []
  }

  private cleanup(): void {
    this.cleanupOscillators()

    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
        this.noiseNode.disconnect()
      } catch {
        // Already stopped
      }
      this.noiseNode = null
    }
  }

  /**
   * Disconnects all nodes - call before discarding voice.
   */
  dispose(): void {
    this.stop()
    this.mixer.disconnect()
    this.noiseGain.disconnect()
    this.filter.disconnect()
    this.ampEnvGain.disconnect()
    this.output.disconnect()
  }
}
