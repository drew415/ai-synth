export type OscWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square'
export type FilterType = 'lowpass' | 'highpass' | 'bandpass'

export interface OscParams {
  waveform: OscWaveform
  octave: number // -2 to +2
  detune: number // cents, -100 to +100
  level: number // 0 to 1
  enabled: boolean
}

export interface ADSRParams {
  attack: number // seconds, 0.001 to 5
  decay: number // seconds, 0.001 to 5
  sustain: number // 0 to 1
  release: number // seconds, 0.001 to 10
}

export interface FilterParams {
  type: FilterType
  cutoff: number // Hz, 20 to 20000
  resonance: number // Q, 0.1 to 30
  envAmount: number // -1 to 1 (bipolar)
  keyTracking: number // 0 to 1
}

export interface LFOParams {
  waveform: OscWaveform
  rate: number // Hz, 0.1 to 20
  depth: number // 0 to 1
  target: 'pitch' | 'filter' | 'amp'
  enabled: boolean
}

export interface UnisonParams {
  voices: number // 1 to 7
  detune: number // cents, 0 to 50
  spread: number // stereo spread, 0 to 1
}

export interface FXParams {
  distortion: {
    enabled: boolean
    amount: number // 0 to 1
    mix: number // 0 to 1
  }
  delay: {
    enabled: boolean
    time: number // seconds, 0.01 to 2
    feedback: number // 0 to 0.95
    mix: number // 0 to 1
  }
  reverb: {
    enabled: boolean
    decay: number // seconds, 0.1 to 10
    mix: number // 0 to 1
  }
  chorus: {
    enabled: boolean
    rate: number // Hz, 0.1 to 5
    depth: number // 0 to 1
    mix: number // 0 to 1
  }
}

export interface SynthParams {
  masterVolume: number // 0 to 1
  polyphony: number // 1 to 16
  glide: number // seconds, 0 to 1

  osc1: OscParams
  osc2: OscParams
  subOsc: {
    enabled: boolean
    level: number // 0 to 1
    octave: number // -1 or -2
  }
  noise: {
    enabled: boolean
    level: number // 0 to 1
    type: 'white' | 'pink'
  }

  filter: FilterParams
  ampEnv: ADSRParams
  filterEnv: ADSRParams

  lfo1: LFOParams
  lfo2: LFOParams

  unison: UnisonParams

  fx: FXParams
}

export const DEFAULT_PARAMS: SynthParams = {
  masterVolume: 0.7,
  polyphony: 8,
  glide: 0,

  osc1: {
    waveform: 'sawtooth',
    octave: 0,
    detune: 0,
    level: 0.8,
    enabled: true,
  },
  osc2: {
    waveform: 'square',
    octave: 0,
    detune: 7,
    level: 0,
    enabled: false,
  },
  subOsc: {
    enabled: false,
    level: 0.5,
    octave: -1,
  },
  noise: {
    enabled: false,
    level: 0.1,
    type: 'white',
  },

  filter: {
    type: 'lowpass',
    cutoff: 2000,
    resonance: 1,
    envAmount: 0.3,
    keyTracking: 0,
  },
  ampEnv: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
  },
  filterEnv: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 0.5,
  },

  lfo1: {
    waveform: 'sine',
    rate: 2,
    depth: 0,
    target: 'filter',
    enabled: false,
  },
  lfo2: {
    waveform: 'sine',
    rate: 5,
    depth: 0,
    target: 'pitch',
    enabled: false,
  },

  unison: {
    voices: 1,
    detune: 10,
    spread: 0.5,
  },

  fx: {
    distortion: {
      enabled: false,
      amount: 0.3,
      mix: 0.5,
    },
    delay: {
      enabled: false,
      time: 0.3,
      feedback: 0.4,
      mix: 0.3,
    },
    reverb: {
      enabled: false,
      decay: 2,
      mix: 0.3,
    },
    chorus: {
      enabled: false,
      rate: 1.5,
      depth: 0.5,
      mix: 0.5,
    },
  },
}

// MIDI note to frequency conversion
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Frequency to MIDI note
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}
