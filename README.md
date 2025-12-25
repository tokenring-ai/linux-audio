# @tokenring-ai/linux-audio

Linux audio integration using naudiodon3 for Token Ring AI, providing native audio recording, playback, transcription, and text-to-speech capabilities on Linux systems.

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
- **Configurable Options**: Sample rate, channels, and format customization
- **Error Handling**: Comprehensive error handling for audio operations

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
bun install
```

Or as a standalone package:

```bash
bun install @tokenring-ai/linux-audio
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

```typescript
const recording = await provider.record(abortSignal, {
  sampleRate: 44100,
  channels: 2
});
console.log('Recording saved to:', recording.filePath);
```

##### `transcribe(audioFile: string | Buffer, options?: TranscriptionOptions, agent?: Agent): Promise<TranscriptionResult>`

Transcribes audio to text using AI models.

**Parameters:**
- `audioFile`: Path to audio file or audio buffer
- `options`: Transcription options (language, model, prompt)
- `agent`: Token Ring AI agent instance (required)

**Returns:** `Promise<TranscriptionResult>` with transcribed text

```typescript
const transcription = await provider.transcribe(recording.filePath, {
  language: 'en',
  model: 'whisper-1'
}, agent);
console.log('Transcription:', transcription.text);
```

##### `speak(text: string, options?: TextToSpeechOptions, agent?: Agent): Promise<AudioResult>`

Converts text to speech using AI models.

**Parameters:**
- `text`: Text to convert to speech
- `options`: TTS options (voice, speed, model)
- `agent`: Token Ring AI agent instance (required)

**Returns:** `Promise<AudioResult>` with audio data

```typescript
const speech = await provider.speak('Hello, world!', {
  voice: 'alloy',
  speed: 1.0
}, agent);
console.log('Speech generated with length:', speech.data.length);
```

##### `playback(filename: string, options?: PlaybackOptions): Promise<string>`

Plays a WAV audio file through the system audio.

**Parameters:**
- `filename`: Path to WAV file
- `options`: Playback options

**Returns:** `Promise<string>` with the filename

```typescript
await provider.playback(speech.filePath);
console.log('Playback completed');
```

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
- `@tokenring-ai/ai-client`: AI client for transcription and speech generation
- `@tokenring-ai/naudiodon3`: Native audio I/O for Node.js (v2.5.0+)
- `wav`: WAV file format support (v1.0.2+)
- `zod`: Schema validation (v4.1.12+)

### Development Dependencies

- `@types/wav`: TypeScript definitions for WAV library
- `vitest`: Testing framework (v0.34.0+)
- `typescript`: TypeScript compiler (v5.2.2+)

## System Requirements

- Linux operating system (Ubuntu/Debian tested)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 16+ or later
- System audio libraries: `libasound2-dev`

## Error Handling

The provider includes comprehensive error handling:

```typescript
try {
  const recording = await provider.record(abortSignal);
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    // Handle specific error cases
    if (error.message.includes('Audio device not available')) {
      // Handle audio device issues
    }
  }
}
```

## Performance Considerations

- Higher sample rates improve audio quality but increase file size
- Mono channels reduce file size compared to stereo
- Recording duration is limited by available disk space
- Ensure proper cleanup of audio streams to avoid resource leaks

## License

MIT License - see LICENSE file for details.