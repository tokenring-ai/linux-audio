import {z} from "zod";

export const LinuxAudioAccountSchema = z.object({
  record: z.object({
    sampleRate: z.number().default(48000),
    channels: z.number().default(1),
    format: z.string().default("wav"),
  }).prefault({}),
  playback: z.object({}).default({}),
});

export const LinuxAudioConfigSchema = z.object({
  accounts: z.record(z.string(), LinuxAudioAccountSchema).default({}),
});

export type LinuxAudioConfig = z.output<typeof LinuxAudioConfigSchema>;
export type LinuxAudioAccount = z.output<typeof LinuxAudioAccountSchema>;
