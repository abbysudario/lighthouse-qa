import * as dotenv from 'dotenv';
dotenv.config();
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const SUMMARY_PATH = path.resolve(__dirname, '../reports/summary.json');
const OUTPUT_PATH = path.resolve(__dirname, '../reports/ai-insights.json');

function loadSummary(): string {
  if (!fs.existsSync(SUMMARY_PATH)) {
    throw new Error('summary.json not found. Run npm run analyze first.');
  }
  return fs.readFileSync(SUMMARY_PATH, 'utf-8');
}

function buildPrompt(summary: string): string {
  return `You are a senior QA engineer reviewing automated test results for a web application.

Here are the test results in JSON format:

${summary}

Please provide:

1. FAILURE ANALYSIS
If any tests failed or were flaky, explain what likely went wrong in plain English. If all tests passed, confirm the suite is clean.

2. RELEASE READINESS
Based on these results, is this build safe to ship? Give a clear verdict and brief reasoning.

3. COVERAGE GAPS
Based on the test names and files, what important flows or edge cases are not currently being tested? Suggest 2-3 specific, actionable additions.

Be concise, direct, and practical. Write for an engineering team, not a business audience.`;
}

async function runAIAnalysis(): Promise<void> {
  const provider = process.env.AI_PROVIDER ?? 'anthropic';

  if (provider !== 'anthropic') {
    console.log(`AI_PROVIDER is set to '${provider}'. This script currently supports 'anthropic' only.`);
    process.exit(0);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const client = new Anthropic({ apiKey });
  const summary = loadSummary();
  const prompt = buildPrompt(summary);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔦 Lighthouse — AI Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('  Analyzing test results...\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  console.log(responseText);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const insights = {
    generatedAt: new Date().toISOString(),
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    insights: responseText,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(insights, null, 2));
  console.log('  Insights written to reports/ai-insights.json');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runAIAnalysis().catch(err => {
  console.error('AI analysis failed:', err.message);
  process.exit(1);
});