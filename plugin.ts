import {TokenRingPlugin} from "@tokenring-ai/app";
import {AudioServiceConfigSchema} from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import {z} from "zod";
import LinuxAudioProvider, {LinuxAudioProviderOptionsSchema} from "./LinuxAudioProvider.ts";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({
  audio: AudioServiceConfigSchema,
});


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
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
