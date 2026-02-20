import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioEngine } from './AudioEngine'

// Mock AudioContext
class MockAudioContext {
  state = 'suspended'
  currentTime = 0
  sampleRate = 44100

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }

  createDynamicsCompressor() {
    return {
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }

  get destination() {
    return {}
  }

  async resume() {
    this.state = 'running'
  }

  async suspend() {
    this.state = 'suspended'
  }

  async close() {
    this.state = 'closed'
  }
}

vi.stubGlobal('AudioContext', MockAudioContext)

describe('AudioEngine', () => {
  beforeEach(() => {
    // Reset the engine state between tests
    AudioEngine.dispose()
  })

  it('should not be initialized by default', () => {
    expect(AudioEngine.isInitialized()).toBe(false)
  })

  it('should return default params', () => {
    const params = AudioEngine.getParams()
    expect(params.masterVolume).toBe(0.7)
    expect(params.polyphony).toBe(8)
    expect(params.osc1.waveform).toBe('sawtooth')
  })
})
