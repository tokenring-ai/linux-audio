import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {AudioConfigSchema} from "@tokenring-ai/audio";
import AudioService from "@tokenring-ai/audio/AudioService";
import LinuxAudioProvider, {LinuxAudioProviderOptionsSchema} from "./LinuxAudioProvider.ts";
import packageJSON from './package.json' with {type: 'json'};

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const audioConfig = agentTeam.getConfigSlice('audio', AudioConfigSchema);
    if (audioConfig) {
      agentTeam.services.waitForItemByType(AudioService).then(audioService => {
        for (const name in audioConfig.providers) {
          const provider = audioConfig.providers[name];
          if (provider.type === "linux") {
            audioService.registerProvider(name, new LinuxAudioProvider(LinuxAudioProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  }
} as TokenRingPackage;

export {default as LinuxAudioProvider} from "./LinuxAudioProvider.ts";