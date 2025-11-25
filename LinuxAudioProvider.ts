import Agent from '@tokenring-ai/agent/Agent';
import {TranscriptionResult} from "@tokenring-ai/ai-client/client/AITranscriptionClient";
import {SpeechModelRegistry, TranscriptionModelRegistry} from "@tokenring-ai/ai-client/ModelRegistry";
import AudioProvider, {
  type AudioResult,
  type PlaybackOptions,
  type RecordingOptions,
  type RecordingResult,
  type TextToSpeechOptions,
  type TranscriptionOptions,
} from '@tokenring-ai/audio/AudioProvider';
import naudiodon from '@tokenring-ai/naudiodon3';
import * as fs from 'node:fs';
import wav from 'wav';
import {z} from 'zod';

export const LinuxAudioProviderOptionsSchema = z.object({
  type: z.literal("linux"),
  sampleRate: z.number().optional(),
  channels: z.number().optional(),
  format: z.string().optional()
});

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

    const stream = naudiodon.AudioIO({
      inOptions: {
        channelCount: channels,
        sampleFormat: naudiodon.SampleFormat16Bit,
        sampleRate,
        deviceId: -1
      }
    });

    stream.pipe(writer);
    stream.start();

    await new Promise((resolve) => abortSignal.addEventListener('abort', resolve, {once: true}));

    stream.quit();
    writer.end();

    return {filePath};
  }

  async transcribe(audioFile: any, options?: TranscriptionOptions, agent?: Agent): Promise<TranscriptionResult> {
    if (!agent) throw new Error('Agent required for transcription');

    const transcriptionModelRegistry = agent.requireServiceByType(TranscriptionModelRegistry);
    const modelName = options?.model || 'whisper-1';
    const client = await transcriptionModelRegistry.getFirstOnlineClient(modelName);

    const audioBuffer = typeof audioFile === 'string'
      ? fs.readFileSync(audioFile)
      : audioFile;

    const [text] = await client.transcribe(
      {
        audio: audioBuffer,
        language: options?.language,
        prompt: options?.prompt,
      },
      agent
    );

    return {text};
  }

  async speak(text: string, options?: TextToSpeechOptions, agent?: Agent): Promise<AudioResult> {
    if (!agent) throw new Error('Agent required for speech generation');

    const speechModelRegistry = agent.requireServiceByType(SpeechModelRegistry);
    const modelName = options?.model || 'tts-1';
    const client = await speechModelRegistry.getFirstOnlineClient(modelName);

    const [audioData] = await client.generateSpeech(
      {
        text,
        voice: options?.voice || 'alloy',
        speed: options?.speed || 1.0,
      },
      agent
    );

    return {data: audioData};
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
        stream = naudiodon.AudioIO({
          outOptions: {
            channelCount: format.channels,
            sampleFormat: naudiodon.SampleFormat16Bit,
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