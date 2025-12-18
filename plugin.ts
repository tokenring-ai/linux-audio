import TokenRingApp from "@tokenring-ai/app";
import {AudioConfigSchema} from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import {TokenRingPlugin} from "@tokenring-ai/app";
import LinuxAudioProvider, {LinuxAudioProviderOptionsSchema} from "./LinuxAudioProvider.ts";
import packageJSON from './package.json' with {type: 'json'};


export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const audioConfig = app.getConfigSlice('audio', AudioConfigSchema);
    if (audioConfig) {
      app.waitForService(AudioService, audioService => {
        for (const name in audioConfig.providers) {
          const provider = audioConfig.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  }
} as TokenRingPlugin;
