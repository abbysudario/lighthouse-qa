import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import Anthropic from '@anthropic-ai/sdk';
import { Mistral } from '@mistralai/mistralai';
import * as fs from 'fs';
import * as path from 'path';

const SUMMARY_PATH = path.resolve(__dirname, '../reports/summary.json');
const OUTPUT_PATH = path.resolve(__dirname, '../reports/ai-insights.json');
const CLASSIFICATION_PATH = path.resolve(__dirname, '../reports/ai-classification.json');

interface TestResult {
  name: string;
  file: string;
  status: string;
  duration: number;
  retries: number;
  flaky: boolean;
  errors: string[];
}

interface Summary {
  tests: TestResult[];
  [key: string]: unknown;
}

interface Classification {
  test: string;
  file: string;
  type: 'REGRESSION' | 'ENVIRONMENT' | 'FLAKY' | 'UNKNOWN';
  confidence: 'high' | 'medium' | 'low';
  error: string;
}

function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

function loadSummary(): string {
  if (!fs.existsSync(SUMMARY_PATH)) {
    throw new Error('summary.json not found. Run npm run analyze first.');
  }
  return fs.readFileSync(SUMMARY_PATH, 'utf-8');
}

function buildInsightsPrompt(summary: string): string {
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

function buildClassificationPrompt(failures: TestResult[]): string {
  const failureData = failures.map(t => ({
    test: t.name,
    file: t.file,
    flaky: t.flaky,
    retries: t.retries,
    errors: t.errors.map(stripAnsi),
  }));

  return `You are a QA classification engine. Classify each test failure based on the error message and failure pattern.

Here are the failed tests:

${JSON.stringify(failureData, null, 2)}

Classification rules:
- REGRESSION: assertion failure where expected value does not match received value — indicates the app behavior changed or the test expectation is wrong
- ENVIRONMENT: network error, DNS resolution failure, connection refused, or unreachable host — indicates infrastructure or dependency issue
- FLAKY: test has retries > 0 and flaky: true, or the error pattern suggests intermittent behavior
- UNKNOWN: cannot determine from the available evidence

Respond ONLY with a valid JSON array. No markdown, no explanation, no code fences. Each item must have:
- test: string (test name)
- file: string (spec file)
- type: one of REGRESSION, ENVIRONMENT, FLAKY, UNKNOWN
- confidence: one of high, medium, low
- error: string (clean one-line summary of the error)

Example:
[{"test":"example test","file":"example.spec.ts","type":"REGRESSION","confidence":"high","error":"Expected 'X' but received 'Y'"}]`;
}

function parseClassifications(raw: string): Classification[] {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('Classification response is not an array');
  }
  return parsed as Classification[];
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

async function runAI(prompt: string, provider: string): Promise<string> {
  if (provider === 'anthropic') return runWithAnthropic(prompt);
  if (provider === 'mistral') return runWithMistral(prompt);
  if (provider === 'ollama') return runWithOllama(prompt);
  throw new Error(`Unknown provider: ${provider}`);
}

async function runAIAnalysis(): Promise<void> {
  const provider = process.env.AI_PROVIDER ?? 'mistral';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔦 Lighthouse — AI Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  Provider: ${provider}`);
  console.log('  Analyzing test results...\n');

  const summaryRaw = loadSummary();
  const summary: Summary = JSON.parse(summaryRaw);

  const insightsPrompt = buildInsightsPrompt(summaryRaw);

  let responseText: string;
  let model: string;

  if (provider === 'anthropic') {
    responseText = await runWithAnthropic(insightsPrompt);
    model = 'claude-haiku-4-5-20251001';
  } else if (provider === 'mistral') {
    responseText = await runWithMistral(insightsPrompt);
    model = 'mistral-small-latest';
  } else if (provider === 'ollama') {
    responseText = await runWithOllama(insightsPrompt);
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

  // Classification pass — only runs when there are failures
  const failures = summary.tests.filter(t => t.status === 'failed' || t.flaky);

  if (failures.length === 0) {
    console.log('  No failures to classify.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  console.log(`\n  Classifying ${failures.length} failure(s)...\n`);

  const classificationPrompt = buildClassificationPrompt(failures);
  const classificationRaw = await runAI(classificationPrompt, provider);

  let classifications: Classification[] = [];
  try {
    classifications = parseClassifications(classificationRaw);
  } catch (err) {
    console.error('  Classification parsing failed:', (err as Error).message);
    console.error('  Raw response:', classificationRaw);
  }

  const classificationOutput = {
    generatedAt: new Date().toISOString(),
    provider,
    model,
    classifications,
  };

  fs.writeFileSync(CLASSIFICATION_PATH, JSON.stringify(classificationOutput, null, 2));
  console.log('  Classification written to reports/ai-classification.json');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runAIAnalysis().catch(err => {
  console.error('AI analysis failed:', err.message);
  process.exit(1);
});