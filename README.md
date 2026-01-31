# @tokenring-ai/linux-audio

Linux audio integration using naudiodon3 for Token Ring AI, providing native audio recording and playback capabilities on Linux systems.

## Overview

The `@tokenring-ai/linux-audio` package provides a Linux-specific implementation of the `AudioProvider` interface using the naudiodon3 library for native audio operations. It enables audio recording and playback on Linux systems within the Token Ring AI framework.

This package is designed to work seamlessly with the Token Ring AI ecosystem, integrating with the AudioService as a plugin that automatically registers the LinuxAudioProvider when configured.

## Features

- **Recording**: Capture audio from microphone using naudiodon3 with configurable sample rate and channels
- **Playback**: Play WAV audio files through system audio with automatic format conversion via ffmpeg for non-WAV files
- **Format Support**: WAV format for recording; supports playback of multiple audio formats via ffmpeg
- **Plugin Integration**: Automatically registers with Token Ring AI AudioService when configured
- **Configurable Options**: Sample rate, channels, and format customization
- **Abort Signal Support**: Recording can be stopped via AbortSignal

## Installation

### Prerequisites

This package requires system-level audio dependencies for Linux:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install libasound2-dev

# Install additional dependencies if needed
sudo apt-get install build-essential

# Optional: for non-WAV audio playback
sudo apt-get install ffmpeg
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

When used as a Token Ring AI plugin, the LinuxAudioProvider is automatically registered with the AudioService based on the app configuration:

```typescript
// The plugin is automatically registered when installed in a Token Ring AI app
// No manual registration required

// Configure in your app config
const config = {
  audio: {
    providers: {
      linux: {
        type: 'linux',
        record: {
          sampleRate: 48000,
          channels: 1,
          format: 'wav'
        },
        playback: {}
      }
    }
  }
};
```

### Direct Usage

```typescript
import LinuxAudioProvider from './LinuxAudioProvider.ts';
import { LinuxAudioProviderOptionsSchema } from './LinuxAudioProvider.ts';

// Create provider with custom options
const provider = new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
}));

// Record audio
const abortController = new AbortController();
const recording = await provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});
console.log('Recording saved to:', recording.filePath);

// Play back audio
await provider.playback(recording.filePath);
```

## Chat Commands

This package does not define chat commands. Chat commands are handled by the `@tokenring-ai/audio` package.

## Plugin Configuration

Configure the provider in your Token Ring AI app configuration:

```typescript
// In your app configuration
const config = {
  audio: {
    providers: {
      linux: {
        type: 'linux',
        record: {
          sampleRate: 48000,
          channels: 1,
          format: 'wav'
        },
        playback: {}
      }
    }
  }
};
```

### LinuxAudioProviderOptionsSchema

```typescript
const LinuxAudioProviderOptionsSchema = z.object({
  type: z.literal("linux"),
  record: z.object({
    sampleRate: z.number().default(48000),
    channels: z.number().default(1),
    format: z.string().default('wav'),
  }).default({
    sampleRate: 48000,
    channels: 1,
    format: 'wav',
  }),
  playback: z.object({}).default({})
});
```

## Tools

This package does not define tools. Tools are handled by the `@tokenring-ai/audio` package.

## Services

### LinuxAudioProvider

The main class that implements the `AudioProvider` interface for Linux systems.

**Implements:** `AudioProvider`

#### Constructor

```typescript
new LinuxAudioProvider(options: LinuxAudioProviderOptions)
```

**Parameters:**
- `options` (LinuxAudioProviderOptions): Configuration options including type, record settings, and playback settings

#### Methods

##### `record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>`

Records audio from the system microphone to a WAV file.

**Parameters:**
- `abortSignal`: AbortSignal to stop recording
- `options`: Recording options including sampleRate, channels, and format

**Returns:** `Promise<RecordingResult>` with filePath to the recorded audio

**Example:**
```typescript
const abortController = new AbortController();
const recording = await provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});
console.log('Recording saved to:', recording.filePath);
```

##### `playback(filename: string): Promise<string>`

Plays an audio file through the system audio. Supports WAV files directly and other formats via ffmpeg.

**Parameters:**
- `filename`: Path to audio file

**Returns:** `Promise<string>` with the filename

**Example:**
```typescript
await provider.playback('/path/to/audio.wav');
// Or for other formats
await provider.playback('/path/to/audio.mp3');
```

## Providers

This package defines the `LinuxAudioProvider` provider that can be registered with the AudioService.

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not implement state management. State is managed by the AudioService.


- Linux operating system (Ubuntu/Debian tested)
- ALSA (Advanced Linux Sound Architecture)
- Node.js 18+ or later
- System audio libraries: `libasound2-dev`
- Optional: `ffmpeg` for non-WAV audio playback

## Error Handling

The provider includes error handling for common failure scenarios:

```typescript
try {
  const recording = await provider.record(abortController.signal, options);
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    // Handle specific error cases
    if (error.message.includes('Audio device not available')) {
      // Handle audio device issues
    }
  }
}

// Playback error handling
try {
  await provider.playback(filename);
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    // Handle file not found or audio device errors
  }
}
```

## Performance Considerations

- Higher sample rates improve audio quality but increase file size
- Mono channels (1 channel) reduce file size compared to stereo
- Recording duration is limited by available disk space
- Recording files are stored in `/tmp/` with timestamp-based filenames
- Ensure proper cleanup by using AbortSignal to stop recording

## License

MIT License - see [LICENSE](./LICENSE) file for details.
