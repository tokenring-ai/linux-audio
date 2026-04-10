import type {TokenRingPlugin} from "@tokenring-ai/app";
import AudioService from "@tokenring-ai/audio/AudioService";
import {z} from "zod";
import LinuxAudioProvider from "./LinuxAudioProvider.ts";
import packageJSON from "./package.json" with {type: "json"};
import {type LinuxAudioAccount, LinuxAudioAccountSchema, LinuxAudioConfigSchema,} from "./schema.ts";

const packageConfigSchema = z.object({
  linuxAudio: LinuxAudioConfigSchema.prefault({accounts: {}}),
});

function addAccountsFromEnv(
  accounts: Record<string, Partial<LinuxAudioAccount>>,
) {
  if (process.env.LINUX_AUDIO) {
    const name = process.env.LINUX_AUDIO_NAME ?? "linux";
    accounts[name] ??= {};
  }
  for (const [key] of Object.entries(process.env)) {
    const match = key.match(/^LINUX_AUDIO_NAME(\d+)$/);
    if (!match) continue;
    const n = match[1];
    const name = process.env[`LINUX_AUDIO_NAME${n}`] ?? `linux${n}`;
    accounts[name] ??= {};
  }
}

export default {
  name: packageJSON.name,
  displayName: "Linux Audio Implementation",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    addAccountsFromEnv(config.linuxAudio.accounts);
    if (Object.keys(config.linuxAudio.accounts).length === 0) return;

    app.waitForService(AudioService, (audioService) => {
      for (const [name, account] of Object.entries(
        config.linuxAudio.accounts,
      )) {
        audioService.registerProvider(
          name,
          new LinuxAudioProvider({
            type: "linux",
            ...LinuxAudioAccountSchema.parse(account),
          }),
        );
      }
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
