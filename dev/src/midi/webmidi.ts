export interface MIDIInput {
  id: string
  name: string
  manufacturer: string
}

export interface MIDIMessage {
  type: 'noteon' | 'noteoff' | 'cc'
  channel: number
  note?: number
  velocity?: number
  cc?: number
  value?: number
}

type MIDICallback = (message: MIDIMessage) => void

class WebMIDI {
  private access: MIDIAccess | null = null
  private inputs: MIDIInput[] = []
  private activeInput: MIDIInput | null = null
  private callback: MIDICallback | null = null
  private supported = false

  /**
   * Initializes Web MIDI access.
   */
  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI not supported')
      return false
    }

    try {
      this.access = await navigator.requestMIDIAccess()
      this.supported = true
      this.updateInputs()

      // Listen for device changes
      this.access.onstatechange = () => {
        this.updateInputs()
      }

      return true
    } catch (error) {
      console.error('Failed to get MIDI access:', error)
      return false
    }
  }

  /**
   * Returns whether MIDI is supported.
   */
  isSupported(): boolean {
    return this.supported
  }

  /**
   * Returns available MIDI inputs.
   */
  getInputs(): MIDIInput[] {
    return [...this.inputs]
  }

  /**
   * Returns the currently selected input.
   */
  getActiveInput(): MIDIInput | null {
    return this.activeInput
  }

  /**
   * Selects a MIDI input by ID.
   */
  selectInput(id: string): boolean {
    if (!this.access) return false

    const input = this.access.inputs.get(id)
    if (!input) return false

    // Disconnect previous input
    if (this.activeInput) {
      const prevInput = this.access.inputs.get(this.activeInput.id)
      if (prevInput) {
        prevInput.onmidimessage = null
      }
    }

    // Connect new input
    input.onmidimessage = this.handleMIDIMessage.bind(this)
    this.activeInput = {
      id: input.id,
      name: input.name || 'Unknown',
      manufacturer: input.manufacturer || 'Unknown',
    }

    return true
  }

  /**
   * Disconnects the active input.
   */
  disconnect(): void {
    if (!this.access || !this.activeInput) return

    const input = this.access.inputs.get(this.activeInput.id)
    if (input) {
      input.onmidimessage = null
    }
    this.activeInput = null
  }

  /**
   * Sets the callback for MIDI messages.
   */
  onMessage(callback: MIDICallback): void {
    this.callback = callback
  }

  private updateInputs(): void {
    if (!this.access) return

    this.inputs = []
    this.access.inputs.forEach((input) => {
      this.inputs.push({
        id: input.id,
        name: input.name || 'Unknown',
        manufacturer: input.manufacturer || 'Unknown',
      })
    })

    // Auto-connect to first available input if none selected
    if (!this.activeInput && this.inputs.length > 0) {
      this.selectInput(this.inputs[0].id)
    }

    // Check if active input was disconnected
    if (this.activeInput && !this.inputs.find((i) => i.id === this.activeInput?.id)) {
      this.activeInput = null
    }
  }

  private handleMIDIMessage(event: MIDIMessageEvent): void {
    if (!this.callback || !event.data) return

    const [status, data1, data2] = event.data
    const channel = (status & 0x0f) + 1
    const type = status & 0xf0

    switch (type) {
      case 0x90: // Note On
        if (data2 > 0) {
          this.callback({
            type: 'noteon',
            channel,
            note: data1,
            velocity: data2 / 127,
          })
        } else {
          // Note On with velocity 0 is Note Off
          this.callback({
            type: 'noteoff',
            channel,
            note: data1,
          })
        }
        break

      case 0x80: // Note Off
        this.callback({
          type: 'noteoff',
          channel,
          note: data1,
        })
        break

      case 0xb0: // Control Change
        this.callback({
          type: 'cc',
          channel,
          cc: data1,
          value: data2 / 127,
        })
        break
    }
  }
}

// Export singleton instance
export const midi = new WebMIDI()
