import {type AudioProvider, type RecordingOptions, type RecordingResult,} from '@tokenring-ai/audio/AudioProvider';
import AudioIO, {SampleFormat16Bit} from '@tokenring-ai/naudiodon3';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import wav from 'wav';
import {z} from 'zod';

export const LinuxAudioProviderOptionsSchema = z.object({
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
  playback: z.object({
  }).default({})
});


export default class LinuxAudioProvider implements AudioProvider {
  constructor(readonly options: z.output<typeof LinuxAudioProviderOptionsSchema>) {}

  async record(abortSignal: AbortSignal, options: RecordingOptions): Promise<RecordingResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `/tmp/recording-${timestamp}.${this.options.record.format}`;

    const writer = new wav.FileWriter(filePath, {
      channels: options.channels ?? this.options.record.channels,
      sampleRate: options?.sampleRate ?? this.options.record.sampleRate,
      bitDepth: 16
    });

    const stream = AudioIO({
      inOptions: {
        channelCount: options.channels ?? this.options.record.channels,
        sampleFormat: SampleFormat16Bit,
        sampleRate: options.channels ?? this.options.record.sampleRate,
        deviceId: -1
      }
    });

    stream.pipe(writer);
    stream.start();

    await new Promise((resolve) => abortSignal.addEventListener('abort', resolve, {once: true}));

    await stream.quit();
    writer.end();

    return {filePath};
  }

  async playback(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filename)) {
        reject(new Error(`Audio file not found: ${filename}`));
        return;
      }

      const ext = filename.toLowerCase().split('.').pop();
      
      if (ext === 'wav') {
        this.playbackWav(filename).then(resolve).catch(reject);
      } else {
        this.playbackWithFfmpeg(filename).then(resolve).catch(reject);
      }
    });
  }

  private async playbackWav(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new wav.Reader();
      let stream: any = null;

      reader.on('format', (format) => {
        stream = AudioIO({
          outOptions: {
            channelCount: format.channels,
            sampleFormat: SampleFormat16Bit,
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

      fs.createReadStream(filename).pipe(reader);
    });
  }

  private async playbackWithFfmpeg(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', filename,
        '-f', 's16le',
        '-acodec', 'pcm_s16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
      ]);

      const stream = AudioIO({
        outOptions: {
          channelCount: 2,
          sampleFormat: SampleFormat16Bit,
          sampleRate: 48000,
          deviceId: -1
        }
      });

      ffmpeg.stdout.pipe(stream);
      stream.start();

      ffmpeg.on('close', () => {
        stream.quit();
        resolve(filename);
      });

      ffmpeg.on('error', (err) => {
        stream.quit();
        reject(err);
      });

      ffmpeg.stderr.on('data', () => {});
    });
  }
}