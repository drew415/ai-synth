# AI Synth

A production-quality polyphonic subtractive synthesizer built with Web Audio API.

## Features

### Sound Generation
- **Dual Oscillators** - Sine, triangle, sawtooth, square waveforms with octave and detune controls
- **Sub Oscillator** - Adds low-end foundation
- **Noise Generator** - White and pink noise with level control
- **Unison** - Up to 7 voices with detune and stereo spread

### Modulation
- **Amp Envelope** - ADSR for amplitude shaping
- **Filter Envelope** - ADSR for filter cutoff modulation
- **2 LFOs** - Modulate pitch, filter, or amplitude with selectable waveforms

### Filter
- **Types** - Lowpass, highpass, bandpass
- **Controls** - Cutoff, resonance, envelope amount, key tracking

### Effects
- **Distortion** - Soft clipping waveshaper
- **Chorus** - Modulated stereo delay for width
- **Delay** - Stereo ping-pong delay with feedback
- **Reverb** - Algorithmic reverb with decay control

### Performance
- **Polyphony** - Up to 16 voices with voice stealing
- **Glide/Portamento** - Smooth pitch transitions
- **MIDI Support** - Connect any MIDI controller
- **Computer Keyboard** - Play with ASDF/QWERTY rows (Z/X to shift octave)

### Presets
- 6 factory presets
- Save/load custom presets
- Import/export preset files

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Web Audio API
- Web MIDI API
- Vitest

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Keyboard Mapping

| Keys | Notes |
|------|-------|
| A-L | C3-B3 |
| W-P | C#3-E4 |
| Z | Octave down |
| X | Octave up |

## Browser Support

Requires a modern browser with Web Audio API support:
- Chrome 66+
- Firefox 76+
- Safari 14.1+
- Edge 79+

## License

MIT
