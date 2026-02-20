import type { SynthParams } from './params'
import { DEFAULT_PARAMS } from './params'

export interface Preset {
  name: string
  params: SynthParams
}

const STORAGE_KEY = 'ai-synth-presets'
const CURRENT_PRESET_KEY = 'ai-synth-current-preset'

// Factory presets
export const FACTORY_PRESETS: Preset[] = [
  {
    name: 'Init',
    params: DEFAULT_PARAMS,
  },
  {
    name: 'Classic Lead',
    params: {
      ...DEFAULT_PARAMS,
      osc1: {
        waveform: 'sawtooth',
        octave: 0,
        detune: 0,
        level: 0.8,
        enabled: true,
      },
      osc2: {
        waveform: 'sawtooth',
        octave: 0,
        detune: 7,
        level: 0.6,
        enabled: true,
      },
      filter: {
        type: 'lowpass',
        cutoff: 3000,
        resonance: 2,
        envAmount: 0.4,
        keyTracking: 0.3,
      },
      ampEnv: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2,
      },
      filterEnv: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.3,
      },
      glide: 0.05,
    },
  },
  {
    name: 'Soft Pad',
    params: {
      ...DEFAULT_PARAMS,
      osc1: {
        waveform: 'sawtooth',
        octave: 0,
        detune: -5,
        level: 0.6,
        enabled: true,
      },
      osc2: {
        waveform: 'sawtooth',
        octave: 0,
        detune: 5,
        level: 0.6,
        enabled: true,
      },
      filter: {
        type: 'lowpass',
        cutoff: 1500,
        resonance: 0.5,
        envAmount: 0.2,
        keyTracking: 0,
      },
      ampEnv: {
        attack: 0.5,
        decay: 0.5,
        sustain: 0.7,
        release: 1.0,
      },
      filterEnv: {
        attack: 0.8,
        decay: 0.5,
        sustain: 0.5,
        release: 1.0,
      },
      unison: {
        voices: 3,
        detune: 15,
        spread: 0.7,
      },
      fx: {
        ...DEFAULT_PARAMS.fx,
        reverb: {
          enabled: true,
          decay: 3,
          mix: 0.4,
        },
      },
    },
  },
  {
    name: 'Punchy Bass',
    params: {
      ...DEFAULT_PARAMS,
      osc1: {
        waveform: 'square',
        octave: -1,
        detune: 0,
        level: 0.8,
        enabled: true,
      },
      osc2: {
        waveform: 'sawtooth',
        octave: 0,
        detune: 0,
        level: 0.3,
        enabled: true,
      },
      subOsc: {
        enabled: true,
        level: 0.5,
        octave: -1,
      },
      filter: {
        type: 'lowpass',
        cutoff: 800,
        resonance: 3,
        envAmount: 0.6,
        keyTracking: 0.2,
      },
      ampEnv: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.6,
        release: 0.15,
      },
      filterEnv: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0.3,
        release: 0.2,
      },
      polyphony: 4,
    },
  },
  {
    name: 'Wobble',
    params: {
      ...DEFAULT_PARAMS,
      osc1: {
        waveform: 'sawtooth',
        octave: -1,
        detune: 0,
        level: 0.8,
        enabled: true,
      },
      filter: {
        type: 'lowpass',
        cutoff: 500,
        resonance: 8,
        envAmount: 0,
        keyTracking: 0,
      },
      lfo1: {
        waveform: 'sine',
        rate: 4,
        depth: 0.7,
        target: 'filter',
        enabled: true,
      },
      ampEnv: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2,
      },
    },
  },
  {
    name: 'Ethereal',
    params: {
      ...DEFAULT_PARAMS,
      osc1: {
        waveform: 'triangle',
        octave: 0,
        detune: 0,
        level: 0.7,
        enabled: true,
      },
      osc2: {
        waveform: 'sine',
        octave: 1,
        detune: 3,
        level: 0.4,
        enabled: true,
      },
      filter: {
        type: 'lowpass',
        cutoff: 4000,
        resonance: 1,
        envAmount: 0.3,
        keyTracking: 0.5,
      },
      ampEnv: {
        attack: 0.8,
        decay: 1.0,
        sustain: 0.5,
        release: 2.0,
      },
      filterEnv: {
        attack: 1.0,
        decay: 1.0,
        sustain: 0.3,
        release: 2.0,
      },
      unison: {
        voices: 5,
        detune: 20,
        spread: 0.9,
      },
      fx: {
        ...DEFAULT_PARAMS.fx,
        delay: {
          enabled: true,
          time: 0.4,
          feedback: 0.5,
          mix: 0.3,
        },
        reverb: {
          enabled: true,
          decay: 5,
          mix: 0.5,
        },
      },
    },
  },
]

/**
 * Loads user presets from localStorage.
 */
export function loadUserPresets(): Preset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load presets:', error)
  }
  return []
}

/**
 * Saves user presets to localStorage.
 */
export function saveUserPresets(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (error) {
    console.error('Failed to save presets:', error)
  }
}

/**
 * Saves the current preset name.
 */
export function saveCurrentPresetName(name: string): void {
  try {
    localStorage.setItem(CURRENT_PRESET_KEY, name)
  } catch (error) {
    console.error('Failed to save current preset:', error)
  }
}

/**
 * Loads the current preset name.
 */
export function loadCurrentPresetName(): string {
  try {
    return localStorage.getItem(CURRENT_PRESET_KEY) || 'Init'
  } catch {
    return 'Init'
  }
}

/**
 * Exports presets to JSON string.
 */
export function exportPresets(presets: Preset[]): string {
  return JSON.stringify(presets, null, 2)
}

/**
 * Imports presets from JSON string.
 */
export function importPresets(json: string): Preset[] {
  try {
    const presets = JSON.parse(json)
    if (Array.isArray(presets)) {
      return presets.filter(
        (p) => typeof p.name === 'string' && typeof p.params === 'object'
      )
    }
  } catch (error) {
    console.error('Failed to import presets:', error)
  }
  return []
}
