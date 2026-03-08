import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import Anthropic from '@anthropic-ai/sdk';
import { Mistral } from '@mistralai/mistralai';
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

async function runWithAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');
}

async function runWithMistral(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set.');
  }

  const client = new Mistral({ apiKey });

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No response received from Mistral.');
  }

  return typeof content === 'string' ? content : JSON.stringify(content);
}

async function runWithOllama(prompt: string): Promise<string> {
  const runningInCI = process.env.CI === 'true';

  if (runningInCI) {
    console.log('  Ollama runs locally and does not support CI environments.');
    console.log('  Set AI_PROVIDER=mistral or AI_PROVIDER=anthropic for CI runs.\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  }

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3:instruct',
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { response: string };

  if (!data.response) {
    throw new Error('No response received from Ollama.');
  }

  return data.response;
}

async function runAIAnalysis(): Promise<void> {
  const provider = process.env.AI_PROVIDER ?? 'mistral';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔦 Lighthouse — AI Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Provider: ${provider}`);
  console.log('  Analyzing test results...\n');

  const summary = loadSummary();
  const prompt = buildPrompt(summary);

  let responseText: string;
  let model: string;

  if (provider === 'anthropic') {
    responseText = await runWithAnthropic(prompt);
    model = 'claude-haiku-4-5-20251001';
  } else if (provider === 'mistral') {
    responseText = await runWithMistral(prompt);
    model = 'mistral-small-latest';
  } else if (provider === 'ollama') {
    responseText = await runWithOllama(prompt);
    model = 'llama3:instruct';
  } else {
    console.log(`\n  AI_PROVIDER '${provider}' is not currently configured in Lighthouse.`);
    console.log('  Built-in providers: anthropic, mistral, ollama');
    console.log('  To add a new provider, update the runAIAnalysis function in scripts/ai-analyze.ts');
    console.log('  and add a new provider function following the pattern of runWithAnthropic or runWithMistral.\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  }

  console.log(responseText);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const insights = {
    generatedAt: new Date().toISOString(),
    provider,
    model,
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