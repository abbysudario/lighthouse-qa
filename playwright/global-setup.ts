import { config as loadEnv } from 'dotenv';

async function globalSetup() {
  loadEnv({ quiet: true });

  const flakeMode = process.env.FLAKE_MODE ?? 'false';

  if (flakeMode !== 'true' && flakeMode !== 'false') {
    throw new Error(`FLAKE_MODE must be 'true' or 'false', got: '${flakeMode}'`);
  }

  console.log(`Lighthouse — FLAKE_MODE: ${flakeMode}`);
}

export default globalSetup;