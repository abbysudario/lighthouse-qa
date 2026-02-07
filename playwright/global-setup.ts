import { config as loadEnv } from 'dotenv';

async function globalSetup() {
  loadEnv();
}
export default globalSetup;
