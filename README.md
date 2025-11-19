# Linux Audio Package Documentation

## Overview

The `@tokenring-ai/linux-audio` package provides a Linux-specific implementation of the AudioProvider interface using
the naudiodon2 library for native audio operations. It enables recording, playback, transcription, and text-to-speech
capabilities on Linux systems within the Token Ring AI framework.

## Features

- **Recording**: Capture audio from microphone using naudiodon2
- **Playback**: Play WAV audio files through system audio
- **Transcription**: Convert audio to text using OpenAI Whisper
- **Text-to-Speech**: Generate speech from text using OpenAI TTS
- **Format Support**: WAV format for recording/playback, MP3 for TTS

## Installation

Requires naudiodon2 native dependencies for Linux audio support:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install libasound2-dev

# Package is installed as part of Token Ring monorepo
```

## Usage

```typescript
import { LinuxAudioProvider } from '@tokenring-ai/linux-audio';
import { AudioService } from '@tokenring-ai/audio';

// Create and register provider
const provider = new LinuxAudioProvider({
  sampleRate: 48000,
  channels: 1,
  format: 'wav'
});

const audioService = new AudioService();
audioService.registerProvider('linux', provider);
audioService.setActiveProvider('linux');

// Use audio operations
const recording = await audioService.record(abortSignal);
const transcription = await audioService.transcribe(audioFile);
```

## Configuration

- `sampleRate`: Audio sample rate (default: 48000)
- `channels`: Number of audio channels (default: 1)
- `format`: Audio format (default: 'wav')

## Dependencies

- naudiodon2: Native audio I/O for Node.js
- wav: WAV file format support
- OpenAI SDK: For transcription and TTS services