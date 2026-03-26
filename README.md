# @tokenring-ai/linux-audio

Linux audio integration using naudiodon3 for Token Ring, providing native audio recording and playback capabilities on Linux systems.

## Overview

The `@tokenring-ai/linux-audio` package provides a Linux-specific implementation of the `AudioProvider` interface using the [naudiodon3](https://github.com/antoniomgorczynski/naudiodon3) library for native audio operations. It enables audio recording and playback on Linux systems within the Token Ring AI framework.

This package integrates with the `AudioService` as a plugin that automatically registers the `LinuxAudioProvider` when configured in the app configuration.

### Key Features

- **Recording**: Capture audio from microphone using naudiodon3 with configurable sample rate and channels
- **Playback**: Play WAV audio files through system audio with automatic format conversion via ffmpeg for non-WAV files
- **Format Support**: WAV format for recording; supports playback of multiple audio formats via ffmpeg
- **Plugin Integration**: Automatically registers with Token Ring AI AudioService when configured
- **Configurable Options**: Sample rate, channels, and format customization
- **Abort Signal Support**: Recording can be stopped via AbortSignal
- **Linux-Only**: Designed specifically for Linux systems with ALSA support

## Installation

### Prerequisites

This package requires system-level audio dependencies for Linux:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install libasound2-dev build-essential

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
bun add @tokenring-ai/linux-audio
```

## Core Components

### LinuxAudioProvider

The main class that implements the `AudioProvider` interface for Linux systems using the `naudiodon3` library.

**Implements:** `AudioProvider`

#### Constructor

```typescript
new LinuxAudioProvider(options: z.output<typeof LinuxAudioProviderOptionsSchema>)
```

**Parameters:**
- `options` (`LinuxAudioProviderOptions`): Configuration options validated by `LinuxAudioProviderOptionsSchema`

#### Methods

##### `record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult>`

Records audio from the system microphone to a WAV file using ALSA audio input.

**Parameters:**
- `abortSignal` (`AbortSignal`): Signal to stop recording
- `options` (`RecordingOptions`): Recording options including `sampleRate` and `channels`

**Returns:** `Promise<RecordingResult>` with `filePath` to the recorded audio file

**RecordingOptions Interface:**
```typescript
interface RecordingOptions {
  sampleRate?: number;    // Audio sample rate in Hz (default: 48000)
  channels?: number;      // Number of audio channels (default: 1)
}
```

**RecordingResult Interface:**
```typescript
interface RecordingResult {
  filePath: string;       // Path to the recorded audio file (e.g., `/tmp/recording-2024-01-01T12-00-00-000.wav`)
}
```

**Example:**

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
});

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
- `filename` (`string`): Path to audio file

**Returns:** `Promise<string>` with the filename

**Example:**

```typescript
// Play WAV file
await provider.playback('/path/to/audio.wav');

// Play other formats (requires ffmpeg)
await provider.playback('/path/to/audio.mp3');
```

#### Private Methods

##### `playbackWav(filename: string): Promise<string>`

Internal method for playing WAV files using `naudiodon3`. Reads the WAV file header to determine format, then streams the audio data to the system audio output device.

**Parameters:**
- `filename` (`string`): Path to WAV audio file

**Returns:** `Promise<string>` with the filename

##### `playbackWithFfmpeg(filename: string): Promise<string>`

Internal method for playing non-WAV files using `ffmpeg` for format conversion. Converts the audio to raw PCM format (s16le, 48000Hz, stereo) and streams it to the system audio output device.

**Parameters:**
- `filename` (`string`): Path to audio file (non-WAV format)

**Returns:** `Promise<string>` with the filename

**ffmpeg Command:**
```bash
ffmpeg -i <input> -f s16le -acodec pcm_s16le -ar 48000 -ac 2 pipe:1
```

**Note:** Requires `ffmpeg` to be installed on the system.

## Configuration

### Configuration Schema

The package uses `LinuxAudioProviderOptionsSchema` for configuration validation:

```typescript
import { LinuxAudioProviderOptionsSchema } from '@tokenring-ai/linux-audio';

const config = LinuxAudioProviderOptionsSchema.parse({
  type: 'linux',
  record: {
    sampleRate: 48000,  // Default: 48000
    channels: 1,        // Default: 1
    format: 'wav'       // Default: 'wav'
  },
  playback: {}
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'linux'` | - | Provider type identifier (must be `'linux'`) |
| `record.sampleRate` | `number` | `48000` | Audio sample rate in Hz |
| `record.channels` | `number` | `1` | Number of audio channels (1=mono, 2=stereo) |
| `record.format` | `string` | `'wav'` | Audio file format |
| `playback` | `object` | `{}` | Playback configuration (currently empty) |

## Integration

### Plugin Registration (Automatic)

When used as a Token Ring AI plugin, the `LinuxAudioProvider` is automatically registered with the `AudioService` based on the app configuration:

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

The plugin (`plugin.ts`) automatically registers the provider when the app configuration includes audio providers with `type: "linux"`:

```typescript
// Plugin registration logic (from plugin.ts)
export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.audio) {
      app.waitForService(AudioService, audioService => {
        for (const name in config.audio!.providers) {
          const provider = config.audio!.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
  config: packageConfigSchema
}
```

The plugin implements the `TokenRingPlugin` interface and is automatically loaded when included in the app's plugin list.

### Direct Usage

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

// Create provider with custom options
const provider = new LinuxAudioProvider({
  type: 'linux',
  record: {
    sampleRate: 48000,
    channels: 1,
    format: 'wav'
  },
  playback: {}
});

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

### Integration with AudioService

The package integrates with the `@tokenring-ai/audio` package's `AudioService`:

```typescript
import AudioService from '@tokenring-ai/audio/AudioService';
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

// The plugin automatically registers the provider when configured
// This happens in the plugin's install() method
```

## Usage Examples

### Basic Recording

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { sampleRate: 48000, channels: 1, format: 'wav' },
  playback: {}
});

const abortController = new AbortController();

// Start recording
const recording = await provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});

console.log('Recording saved to:', recording.filePath);

// Stop recording after 5 seconds
setTimeout(() => {
  abortController.abort();
}, 5000);
```

### Basic Playback

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { sampleRate: 48000, channels: 1, format: 'wav' },
  playback: {}
});

// Play WAV file
await provider.playback('/path/to/audio.wav');

// Play MP3 file (requires ffmpeg)
await provider.playback('/path/to/audio.mp3');
```

### Complete Recording and Playback Workflow

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { sampleRate: 48000, channels: 1, format: 'wav' },
  playback: {}
});

try {
  // Record audio
  const abortController = new AbortController();
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
  
  console.log('Recording completed:', recording.filePath);
  
  // Play back the recording
  await provider.playback(recording.filePath);
  console.log('Playback completed');
  
} catch (error) {
  console.error('Audio operation failed:', error);
}
```

### Recording with Custom Settings

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { 
    sampleRate: 16000,  // Lower sample rate for voice
    channels: 1,        // Mono for smaller file size
    format: 'wav' 
  },
  playback: {}
});

const abortController = new AbortController();

// Record with custom settings
const recording = await provider.record(abortController.signal, {
  sampleRate: 16000,
  channels: 1
});

console.log('Voice recording saved to:', recording.filePath);
```

## Error Handling

The provider includes error handling for common failure scenarios:

### Recording Errors

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';

const provider = new LinuxAudioProvider({
  type: 'linux',
  record: { sampleRate: 48000, channels: 1, format: 'wav' },
  playback: {}
});

try {
  const abortController = new AbortController();
  const recording = await provider.record(abortController.signal, {
    sampleRate: 48000,
    channels: 1
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('Recording failed:', error.message);
    
    // Handle specific error cases
    if (error.message.includes('Audio device not available')) {
      console.error('Please check your audio device configuration');
    } else if (error.message.includes('Permission denied')) {
      console.error('Check permissions for /tmp directory');
    }
  }
}
```

### Playback Errors

```typescript
try {
  await provider.playback('/path/to/audio.wav');
} catch (error) {
  if (error instanceof Error) {
    console.error('Playback failed:', error.message);
    
    // Handle file not found
    if (error.message.includes('not found')) {
      console.error('Audio file does not exist');
    }
    
    // Handle audio device errors
    if (error.message.includes('Audio device')) {
      console.error('Check your audio output device');
    }
    
    // Handle ffmpeg errors
    if (error.message.includes('ffmpeg')) {
      console.error('ffmpeg is not installed or failed to convert audio');
    }
  }
}
```

### Cancellation

Recording can be cancelled using an AbortSignal:

```typescript
const abortController = new AbortController();

// Start recording
const recordingPromise = provider.record(abortController.signal, {
  sampleRate: 48000,
  channels: 1
});

// Cancel after 3 seconds
setTimeout(() => {
  abortController.abort();
}, 3000);

try {
  const recording = await recordingPromise;
  console.log('Recording completed');
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Recording was cancelled');
  }
}
```

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| `Audio file not found` | File path is invalid or file doesn't exist | Verify file path before playback |
| `Audio device not available` | ALSA device is not accessible | Check ALSA configuration and permissions |
| `Permission denied` | Cannot write to `/tmp` directory | Check directory permissions |
| `ffmpeg error` | ffmpeg is not installed or failed | Install ffmpeg: `sudo apt-get install ffmpeg` |

## Best Practices

### Recording Best Practices

- **Sample Rate**: Use 48000 Hz for high-quality audio, 16000 Hz for voice-only applications
- **Channels**: Use mono (1 channel) for voice recordings to reduce file size
- **Duration**: Use AbortSignal to control recording duration and prevent infinite recordings
- **File Cleanup**: Recordings are stored in `/tmp/` with timestamp-based filenames; implement cleanup logic for production use
- **Error Handling**: Always wrap audio operations in try/catch blocks
- **File Naming**: Recordings use ISO timestamp format: `recording-YYYY-MM-DDTHH-mm-ss.sss.wav`

### Playback Best Practices

- **Format Support**: Use WAV format for best compatibility; use ffmpeg for other formats
- **File Validation**: Check file existence before playback
- **Resource Management**: Ensure proper cleanup of audio streams
- **Error Handling**: Handle both file not found and audio device errors
- **Device Configuration**: Use default audio device (deviceId: -1) unless specific device is required

### Performance Considerations

- Higher sample rates improve audio quality but increase file size
- Mono channels (1 channel) reduce file size compared to stereo
- Recording duration is limited by available disk space
- Recording files are stored in `/tmp/` with timestamp-based filenames
- Ensure proper cleanup by using AbortSignal to stop recording
- ffmpeg conversion adds overhead for non-WAV files
- Audio streams are automatically cleaned up after playback completes

### Linux-Specific Considerations

- **ALSA Required**: Package requires ALSA (Advanced Linux Sound Architecture) to be installed and configured
- **Permissions**: User must have permissions to access audio devices (typically in `audio` group)
- **/tmp Directory**: Recordings are stored in `/tmp/` which may be cleared on system reboot
- **ffmpeg**: Required for playing non-WAV audio formats
- **Device IDs**: Uses default device (deviceId: -1) for both input and output

## Testing

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Build and type check
bun run build
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/ai-client`: 0.2.0
- `@tokenring-ai/app`: 0.2.0
- `@tokenring-ai/agent`: 0.2.0
- `@tokenring-ai/audio`: 0.2.0
- `@tokenring-ai/chat`: 0.2.0
- `@tokenring-ai/naudiodon3`: 2.5.0
- `wav`: ^1.0.2
- `@types/wav`: ^1.0.4
- `zod`: ^4.3.6

### Development Dependencies

- `vitest`: ^4.1.1
- `typescript`: ^6.0.2

### System Dependencies

- **Operating System**: Linux (Ubuntu/Debian tested)
- **Audio System**: ALSA (Advanced Linux Sound Architecture)
- **Runtime**: Node.js 18+ or later (via Bun)
- **System Libraries**: `libasound2-dev`
- **Optional**: `ffmpeg` for non-WAV audio playback

## Package Structure

```
pkg/linux-audio/
├── LinuxAudioProvider.ts     # Main provider implementation
├── index.ts                  # Package exports
├── plugin.ts                 # Token Ring plugin for auto-registration
├── package.json              # Package metadata and dependencies
├── README.md                 # This documentation
├── LICENSE                   # MIT License
├── vitest.config.ts          # Test configuration
└── __tests__/                # Test files
    └── *.test.ts             # Unit tests
```

## Exports

The package exports the following from `index.ts`:

```typescript
// Main provider class
export { default as LinuxAudioProvider } from './LinuxAudioProvider';

// Configuration schema
export { LinuxAudioProviderOptionsSchema } from './LinuxAudioProvider';
```

**Note:** The `LinuxAudioProvider` class is the default export and can be imported as:

```typescript
import LinuxAudioProvider from '@tokenring-ai/linux-audio';
```

## Related Components

- [`@tokenring-ai/audio`](../audio/README.md): Core audio service and provider interface
- [`@tokenring-ai/naudiodon3`](../naudiodon3/README.md): Native audio I/O library
- [`@tokenring-ai/app`](../app/README.md): Base application framework
- [`@tokenring-ai/agent`](../agent/README.md): Agent orchestration system

## License

MIT License - see [LICENSE](./LICENSE) file for details.
