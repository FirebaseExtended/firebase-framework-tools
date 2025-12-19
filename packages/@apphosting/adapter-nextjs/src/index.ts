import type { NextAdapter } from "next";
import fs from 'fs-extra';
import path from 'path';

const adapter: NextAdapter = {
  name: 'firebase-apphosting-adapter',

  async modifyConfig(config, context) {
    console.log(`🔌 [Adapter] Modifying config for phase: ${context.phase}`);
    // You can force settings here, e.g., enforcing standalone output
    return {
      ...config,
      output: 'standalone', 
      experimental: {
        ...config.experimental,
        isrMemoryCacheSize: 0, 
      }
    };
  },

async onBuildComplete(data) {
    console.log('🔌 [Adapter] Build Complete. Serializing config...');


    // 2. Write to a file in the .next directory
    // We call it 'firebase-next-config.json'
    const configPath = path.join(data.distDir, 'firebase-next-config.json');
    await fs.writeJson(configPath, data, { spaces: 2 });
    console.log(`✅ [Adapter] Wrote config to ${configPath}`);
  }
};

export default adapter;