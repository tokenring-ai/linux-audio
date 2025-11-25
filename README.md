# @tokenring-ai/linux-audio

A Linux-specific audio provider plugin for Token Ring AI, built on naudiodon3 for native audio operations.

## Overview

The `@tokenring-ai/linux-audio` package provides a Linux-specific implementation of the AudioProvider interface using the naudiodon3 library for native audio operations. It enables recording, playback, transcription, and text-to-speech capabilities on Linux systems within the Token Ring AI framework.

This package is designed to work seamlessly with the Token Ring AI ecosystem, integrating with the AudioService and leveraging AI model registries for transcription and text-to-speech functionality.

## Features

- **Recording**: Capture audio from microphone using naudiodon3
- **Playback**: Play WAV audio files through system audio
- **Transcription**: Convert audio to text using AI transcription models
- **Text-to-Speech**: Generate speech from text using AI TTS models
- **Format Support**: WAV format for recording/playback
- **Plugin Integration**: Automatically registers with Token Ring AI AudioService

## Installation

### Prerequisites

This package requires system-level audio dependencies for Linux:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install libasound2-dev

# Install additional dependencies if needed
sudo apt-get install build-essential
```

### Package Installation

The package is designed to work within the Token Ring AI monorepo:

```bash
# Install as part of the monorepo
npm install
```

Or as a standalone package:

```bash
npm install @tokenring-ai/linux-audio
```

## Usage

### Plugin Registration (Automatic)

When used as a Token Ring AI plugin, the LinuxAudioProvider is automatically registered with the AudioService:

```typescript
// The plugin is automatically registered when installed in a Token Ring AI app
// No manual registration required
```

### Manual Usage

```typescript
import { LinuxAudioProvider } from '@tokenring-ai/linux-audio';
import { AudioService } from '@tokenring-ai/audio';
import { TokenRingApp } from '@tokenring-ai/app';

// Create provider with custom options
const provider = new LinuxAudioProvider({
  sampleRate: 48000,
  channels: 1,
  format: 'wav'
});

// Register with AudioService
const audioService = new AudioService();
audioService.registerProvider('linux', provider);
audioService.setActiveProvider('linux');

// Use audio operations
const recording = await audioService.record(abortSignal);
const transcription = await audioService.transcribe(recording.filePath);
const speech = await audioService.speak('Hello, world!');
```

### Configuration via Token Ring AI App

Configure the Linux audio provider through the app's configuration:

```typescript
// In your app configuration
const config = {
  audio: {
    providers: {
      linux: {
        type: 'linux',
        sampleRate: 48000,
        channels: 1,
        format: 'wav'
      }
    }
  }
};
```

## API Reference

### LinuxAudioProvider

The main class that implements the AudioProvider interface for Linux systems.

#### Constructor

```typescript
new LinuxAudioProvider(options?: LinuxAudioProviderOptions)
```

**Parameters:**
- `options` (LinuxAudioProviderOptions, optional): Configuration options

**Options:**
- `sampleRate` (number): Audio sample rate in Hz (default: 48000)
- `channels` (number): Number of audio channels (default: 1)
- `format` (string): Audio format (default: 'wav')

#### Methods

##### `record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult>`

Records audio from the system microphone.

**Parameters:**
- `abortSignal`: AbortSignal to stop recording
- `options`: Recording options (sample rate, channels, format)

**Returns:** `Promise<RecordingResult>` with file path to the recorded audio

##### `transcribe(audioFile: any, options?: TranscriptionOptions, agent?: Agent): Promise<TranscriptionResult>`

Transcribes audio to text using AI models.

**Parameters:**
- `audioFile`: Path to audio file or audio buffer
- `options`: Transcription options (language, model, prompt)
- `agent`: Token Ring AI agent instance (required)

**Returns:** `Promise<TranscriptionResult>` with transcribed text

##### `speak(text: string, options?: TextToSpeechOptions, agent?: Agent): Promise<AudioResult>`

Converts text to speech using AI models.

**Parameters:**
- `text`: Text to convert to speech
- `options`: TTS options (voice, speed, model)
- `agent`: Token Ring AI agent instance (required)

**Returns:** `Promise<AudioResult>` with audio data

##### `playback(filename: string, options?: PlaybackOptions): Promise<string>`

Plays a WAV audio file through the system audio.

**Parameters:**
- `filename`: Path to WAV file
- `options`: Playback options

**Returns:** `Promise<string>` with the filename

## Configuration

### LinuxAudioProviderOptions

```typescript
interface LinuxAudioProviderOptions {
  sampleRate?: number;    // Audio sample rate in Hz (default: 48000)
  channels?: number;      // Number of audio channels (default: 1)
  format?: string;        // Audio format (default: 'wav')
}
```

### Audio Service Configuration

Configure the provider in your Token Ring AI app configuration:

```json
{
  "audio": {
    "providers": {
      "linux": {
        "type": "linux",
        "sampleRate": 48000,
        "channels": 1,
        "format": "wav"
      }
    }
  }
}
```

## Dependencies

### Runtime Dependencies

- `@tokenring-ai/agent`: Token Ring AI agent framework
- `@tokenring-ai/audio`: Audio service and interfaces
- `@tokenring-ai/chat`: Chat functionality
- `@tokenring-ai/naudiodon3`: Native audio I/O for Node.js (v2.5.0+)
- `wav`: WAV file format support (v1.0.2+)
- `zod`: Schema validation (v4.1.12+)

### Development Dependencies

- `@types/wav`: TypeScript definitions for WAV library

## System Requirements

- Linux operating system
- ALSA (Advanced Linux Sound Architecture)
- Node.js 16+ or later
- System audio libraries: `libasound2-dev`

## Troubleshooting

### Audio Device Issues

If you encounter audio device problems:

1. Check if ALSA is properly installed: `aplay -l`
2. Verify audio permissions: Ensure your user has access to audio devices
3. Test audio manually: `arecord -d 5 test.wav && aplay test.wav`

### Transcription/TTS Issues

For transcription and text-to-speech functionality:

1. Ensure you have a valid AI model registry configured
2. Check that the required AI services are available
3. Verify network connectivity to AI services

### Performance Considerations

- Higher sample rates improve audio quality but increase file size
- Mono channels reduce file size compared to stereo
- Recording duration is limited by available disk space

## License

MIT License - see LICENSE file for details.

## Contributing

This package is part of the Token Ring AI ecosystem. Please refer to the main repository for contribution guidelines.