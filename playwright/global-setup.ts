import { config as loadEnv } from 'dotenv';

async function globalSetup() {
  loadEnv({ quiet: true });

  const flakeMode = process.env.FLAKE_MODE ?? 'false';
  if (flakeMode !== 'true' && flakeMode !== 'false') {
    throw new Error(`FLAKE_MODE must be 'true' or 'false', got: '${flakeMode}'`);
  }

  const signalMode = process.env.SIGNAL_MODE ?? 'false';
  if (signalMode !== 'true' && signalMode !== 'false') {
    throw new Error(`SIGNAL_MODE must be 'true' or 'false', got: '${signalMode}'`);
  }

  console.log(`Lighthouse — FLAKE_MODE: ${flakeMode} | SIGNAL_MODE: ${signalMode}`);
}

export default globalSetup;