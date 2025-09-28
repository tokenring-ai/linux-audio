import naudiodon2 from 'naudiodon2';
import wav from 'wav';
import * as fs from 'node:fs';
import { experimental_transcribe as transcribe } from 'ai';
import { experimental_generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';
import AudioProvider, {
  type RecordingOptions,
  type PlaybackOptions,
  type TranscriptionOptions,
  type TextToSpeechOptions,
  type RecordingResult,
  type TranscriptionResult,
  type AudioResult
} from '@tokenring-ai/audio/AudioProvider';

export interface LinuxAudioProviderOptions {
  sampleRate?: number;
  channels?: number;
  format?: string;
}

export default class LinuxAudioProvider extends AudioProvider {
  private sampleRate: number;
  private channels: number;
  private format: string;

  constructor(options: LinuxAudioProviderOptions = {}) {
    super();
    this.sampleRate = options.sampleRate || 48000;
    this.channels = options.channels || 1;
    this.format = options.format || 'wav';
  }

  async record(abortSignal: AbortSignal, options?: RecordingOptions): Promise<RecordingResult> {
    const sampleRate = options?.sampleRate || this.sampleRate;
    const channels = options?.channels || this.channels;
    const format = options?.format || this.format;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `/tmp/recording-${timestamp}.${format}`;

    const writer = new wav.FileWriter(filePath, {
      channels,
      sampleRate,
      bitDepth: 16
    });

    const stream = naudiodon2.AudioIO({
      inOptions: {
        channelCount: channels,
        sampleFormat: naudiodon2.SampleFormat16Bit,
        sampleRate,
        deviceId: -1
      }
    });

    stream.pipe(writer);
    stream.start();

    await new Promise((resolve) => abortSignal.addEventListener('abort', resolve, { once: true }));

    stream.quit();
    writer.end();

    return { filePath };
  }

  async transcribe(audioFile: any, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    const model = options?.model || 'whisper-1';
    
    const transcribeOptions: any = {
      model: openai.transcription(model),
      audio: audioFile
    };

    if (options?.language) {
      transcribeOptions.language = options.language;
    }

    if (options?.timestampGranularity) {
      transcribeOptions.providerOptions = {
        openai: {
          timestampGranularities: [options.timestampGranularity]
        }
      };
    }

    const result = await transcribe(transcribeOptions);
    return { text: result.text };
  }

  async speak(text: string, options?: TextToSpeechOptions): Promise<AudioResult> {
    const model = options?.model || 'tts-1';
    const voice = options?.voice || 'alloy';
    const speed = options?.speed || 1.0;
    const format = options?.format || 'mp3';

    const speakOptions: any = {
      model: openai.speech(model),
      voice,
      text,
      speed
    };

    if (format) {
      speakOptions.providerOptions = {
        openai: {
          responseFormat: format
        }
      };
    }

    const audioData = await experimental_generateSpeech(speakOptions);
    return { data: audioData };
  }

  async playback(filename: string, options?: PlaybackOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filename)) {
        reject(new Error(`Audio file not found: ${filename}`));
        return;
      }

      const reader = new wav.Reader();
      let stream: any = null;

      reader.on('format', (format) => {
        stream = naudiodon2.AudioIO({
          outOptions: {
            channelCount: format.channels,
            sampleFormat: naudiodon2.SampleFormat16Bit,
            sampleRate: format.sampleRate,
            deviceId: -1
          }
        });

        reader.pipe(stream);
        stream.start();
      });

      reader.on('end', () => {
        if (stream) stream.quit();
        resolve(filename);
      });

      reader.on('error', (err) => {
        if (stream) stream.quit();
        reject(err);
      });

      const fileStream = fs.createReadStream(filename);
      fileStream.pipe(reader);
    });
  }
}