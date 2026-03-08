import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import * as fs from 'fs';
import * as path from 'path';

// --- Indent levels for terminal output ---
const INDENT = '  ';
const INDENT_NESTED = '    ';

// --- Types ---
interface TestResult {
  name: string;
  file: string;
  status: string;
  duration: number;
  retries: number;
  flaky: boolean;
  errors: string[];  // extracted error messages from all attempts
}

interface Summary {
  runDate: string;
  totalDuration: number;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  stabilityScore: number;
  tests: TestResult[];
  slowestTests: TestResult[];
}

// --- Read raw results ---
const resultsPath = path.resolve('reports/playwright-results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('No playwright-results.json found. Run your tests first.');
  process.exit(1);
}

const rawReport = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// --- Extract tests ---
const tests: TestResult[] = [];

for (const fileSuite of rawReport.suites) {
  for (const describeSuite of fileSuite.suites) {
    for (const spec of describeSuite.specs) {
      for (const test of spec.tests) {

        const attempts = test.results;
        const finalAttempt = attempts[attempts.length - 1];
        const wasRetried = attempts.length > 1;
        const passedAfterRetry = wasRetried && finalAttempt.status === 'passed';

        const errorMessages = attempts
          .flatMap((attempt: any) => attempt.errors)
          .map((error: any) => error?.message ?? '')
          .filter(Boolean);

        tests.push({
          name: spec.title,
          file: fileSuite.file,
          status: finalAttempt.status,
          duration: finalAttempt.duration,
          retries: attempts.length - 1,
          flaky: passedAfterRetry,
          errors: errorMessages
        });
      }
    }
  }
}

// --- Calculate signals ---
const passedTests = tests.filter(test => test.status === 'passed' && !test.flaky);
const failedTests = tests.filter(test => test.status === 'failed');
const flakyTests = tests.filter(test => test.flaky);
const skippedTests = tests.filter(test => test.status === 'skipped');

const totalTests = tests.length;
const stabilityScore = totalTests > 0
  ? Math.round(((passedTests.length + flakyTests.length) / totalTests) * 100)
  : 0;

const slowestTests = [...tests]
  .sort((testA, testB) => testB.duration - testA.duration)
  .slice(0, 3);

// --- Build summary ---
const summary: Summary = {
  runDate: rawReport.stats.startTime,
  totalDuration: Math.round(rawReport.stats.duration),
  total: totalTests,
  passed: passedTests.length,
  failed: failedTests.length,
  flaky: flakyTests.length,
  skipped: skippedTests.length,
  stabilityScore,
  tests,
  slowestTests
};

// --- Write summary.json ---
const summaryPath = path.resolve('reports/summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

// --- Terminal output ---
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`${INDENT}🔦 Lighthouse — Quality Signal Report`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
console.log(`${INDENT}Run Date:        ${new Date(summary.runDate).toLocaleString()}`);
console.log(`${INDENT}Total Duration:  ${(summary.totalDuration / 1000).toFixed(2)}s`);
console.log(`${INDENT}Total Tests:     ${summary.total}`);
console.log(`${INDENT}Passed:          ${summary.passed}`);
console.log(`${INDENT}Failed:          ${summary.failed}`);
console.log(`${INDENT}Flaky:           ${summary.flaky}`);
console.log(`${INDENT}Skipped:         ${summary.skipped}`);
console.log(`${INDENT}Stability Score: ${summary.stabilityScore}%\n`);

console.log(`${INDENT}Slowest Tests:`);
for (const test of slowestTests) {
  console.log(`${INDENT}→ ${test.file} › ${test.name} (${test.duration}ms)`);
}

if (failedTests.length > 0) {
  console.log(`\n${INDENT}Failed Tests:`);
  for (const test of failedTests) {
    console.log(`${INDENT}✗ ${test.file} › ${test.name}`);
    for (const errorMessage of test.errors) {
      console.log(`${INDENT_NESTED}${errorMessage}`);
    }
  }
}

if (flakyTests.length > 0) {
  console.log(`\n${INDENT}Flaky Tests:`);
  for (const test of flakyTests) {
    console.log(`${INDENT}⚠ ${test.file} › ${test.name}`);
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
console.log(`${INDENT}Summary written to reports/summary.json\n`);