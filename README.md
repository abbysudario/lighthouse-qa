# 🔦 Lighthouse

Lighthouse is a QA intelligence system that surfaces blindspots and suggests intentional, impactful changes without making decisions for you. Think of it as a northstar for shipping: it doesn't tell you to ship or not to ship, it tells you what your tests are actually saying so you can decide with confidence.

Tests produce truth. Lighthouse produces clarity.

> ✅ Complete: AI-assisted QA intelligence, multi-provider support, full CI pipeline, Allure dashboard with live hosted results, and signal generation for QA Signal Hub.

🔦 **Live Dashboard:** https://abbysudario.github.io/lighthouse-qa/

> 💡 Lighthouse is best used alongside [QA Signal Hub](https://github.com/abbysudario/qa-signal-hub), its companion event-driven signal routing system built with n8n. QA Signal Hub receives the webhook payload from Lighthouse CI, classifies failures using AI, and automatically creates labeled GitHub Issues for actionable follow-up.

---

Lighthouse sits on top of your test suite as a signal layer. It observes, interprets, and warns. It doesn't replace tests. It gives them a voice. Most QA systems answer "did it pass?" Lighthouse asks the harder questions: which tests are unreliable, what's slowing the pipeline down, and is this build actually safe to ship?

Every decision in this project is intentional. The selectors use data-test attributes over CSS classes. Commits represent capabilities, not file noise. Files earn their place. Nothing exists as a placeholder. That ethos runs through every layer of the system.

---

🧰 **Stack**

TypeScript, Playwright, Docker, GitHub Actions, ts-node, dotenv. Targets [SauceDemo](https://www.saucedemo.com), a stable e-commerce demo chosen because the infrastructure tells the story, not the app.

---

🏗️ **System architecture**

The full pipeline from test execution to GitHub Issue creation across both repos:

```
SauceDemo (target application)
        |
        | Playwright tests run
        v
lighthouse-qa (this repo)
        |
        |-- analyze.ts
        |       produces reports/summary.json
        |
        |-- ai-analyze.ts
        |       first AI call:  reports/ai-insights.json  (human-readable analysis)
        |       second AI call: reports/ai-classification.json  (machine-readable, failures only)
        |
        |-- Allure report generated and deployed to GitHub Pages
        |
        | webhook POST (status + branch + commit + run_url + classifications[])
        v
qa-signal-hub (companion repo)
        |
        |-- n8n receives payload
        |
        |-- Has Classifications? (IF node)
        |       empty array -> exit cleanly
        |
        |-- Split Classifications (one item per classification)
        |
        |-- Route By Type (Switch node)
        |       REGRESSION  -> Search Existing Issues -> deduplicate -> create GitHub Issue
        |       ENVIRONMENT -> Search Existing Issues -> deduplicate -> create GitHub Issue
        |       FLAKY       -> Search Existing Issues -> deduplicate -> create GitHub Issue
        |       UNKNOWN     -> Search Existing Issues -> deduplicate -> create GitHub Issue
        |
        v
GitHub Issues created in lighthouse-qa with labels
```

---

🗂️ **Structure**
```
lighthouse-qa/
├─ playwright/
│  ├─ global-setup.ts            # env validation, FLAKE_MODE and SIGNAL_MODE config
│  ├─ pages/                     # page object model
│  │  ├─ LoginPage.ts
│  │  ├─ InventoryPage.ts
│  │  ├─ CartPage.ts
│  │  └─ CheckoutPage.ts
│  ├─ selectors/
│  │  └─ saucedemo.selectors.ts  # centralized data-test selectors
│  └─ tests/
│     ├─ smoke.spec.ts           # is the app alive?
│     ├─ checkout.spec.ts        # does the core flow work?
│     ├─ negative.spec.ts        # does it fail gracefully?
│     ├─ stability.spec.ts       # can we trust it consistently?
│     └─ signal.spec.ts          # deliberate signal fixtures for QA Signal Hub
├─ scripts/
│  ├─ analyze.ts                 # quality signal analyzer
│  └─ ai-analyze.ts              # AI insights and classification engine
├─ reports/                      # generated, gitignored
├─ allure-results/               # generated, gitignored
├─ allure-report/                # generated, gitignored
├─ playwright.config.ts
├─ tsconfig.json
├─ Dockerfile
├─ docker-compose.yml
└─ .github/workflows/
   └─ lighthouse-ci.yml
```

---

▶️ **Running it**

**1. Clone and install**
```bash
git clone https://github.com/abbysudario/lighthouse-qa.git
cd lighthouse-qa
npm install
npx playwright install --with-deps
```

**2. Set up credentials**
```bash
cp .env.example .env
# open .env and fill in:
# SAUCE_USERNAME=standard_user
# SAUCE_PASSWORD=secret_sauce
# these are the public SauceDemo credentials, safe to use directly
```

**3. Verify tests run**
```bash
npx playwright test
```

All 9 core tests should pass before proceeding.

**4. Set up AI insights**

Open `.env` and add your Mistral API key. Get a free key at [console.mistral.ai](https://console.mistral.ai) — no credit card required.
```
MISTRAL_API_KEY=your_key_here
```

**5. Run the full pipeline**
```bash
npm run test:full
```

`test:full` clears `allure-results/` and `allure-report/` before every run to prevent phantom results from accumulating across runs. Playwright appends result files on every run. Without this cleanup, Allure would read stale files alongside fresh ones and produce duplicate or misleading results. Each command in the pipeline runs sequentially using `;` so the full pipeline completes even when tests fail intentionally.

**6. Run with additional modes**
```bash
npm run test:full:signals      # includes deliberate signal fixtures for QA Signal Hub
npm run test:full:flake        # runs stability tests 5x for flake detection
npm run test:full:flake-signal # both signal fixtures and flake detection
```

Or step by step:
```bash
npm test
npm run analyze
npm run ai-analyze
npm run allure:generate
npm run allure:open
```

In Docker:
```bash
docker compose build
docker compose run --rm lighthouse-qa                                    # clean run
SIGNAL_MODE=true docker compose run --rm lighthouse-qa                   # with signal fixtures
FLAKE_MODE=true docker compose run --rm lighthouse-qa                    # with flake detection
FLAKE_MODE=true SIGNAL_MODE=true docker compose run --rm lighthouse-qa   # both
npm run allure:open                                                        # view dashboard on your machine
```

Docker mounts four volumes so generated files come back to your machine after the container exits:
```
./reports           -> signal report and AI insights
./playwright-report -> Playwright HTML report
./allure-results    -> raw Allure result files
./allure-report     -> generated Allure dashboard
```

Without volumes, all generated output would disappear when the container exits.

---

🌊 **FLAKE_MODE**

Stability tests can run up to 5 iterations to surface flakiness before it hits production. The mode flows through the entire system from CI input all the way to test execution:
```
workflow_dispatch input -> github.event.inputs.flake_mode
                       |
        || 'false' fallback for push/PR triggers
                       |
              FLAKE_MODE env variable
                       |
         global-setup.ts reads and validates it
                       |
         stability.spec.ts uses ITERATIONS = 1 or 5
```

Enable locally by setting `FLAKE_MODE=true` in `.env` or using `npm run test:full:flake`. Enable in CI via GitHub Actions -> Lighthouse CI -> Run workflow -> set `flake_mode` to `true`.

FLAKE_MODE runs stability tests 5 times in a loop within a single test. It is not the same as Playwright retries. Retries happen when a test fails and Playwright reruns it automatically. FLAKE_MODE proactively stress-tests stability before failure ever occurs.

---

📡 **SIGNAL_MODE**

Signal mode controls whether deliberate signal fixtures in `signal.spec.ts` are included in the test run. It defaults to `false` so CI stays green on every push. Set it to `true` when you want to generate classifiable failure signals for [QA Signal Hub](https://github.com/abbysudario/qa-signal-hub).

```
workflow_dispatch input -> github.event.inputs.signal_mode
                       |
        || 'false' fallback for push/PR triggers
                       |
              SIGNAL_MODE env variable
                       |
         global-setup.ts reads and validates it
                       |
         playwright.config.ts uses grep to include or exclude Signal Generation tests
```

The filtering happens in `playwright.config.ts` via a `grep` regex, not a CLI flag. This means the same logic applies identically across local, Docker, and CI without any script changes:

```typescript
grep: signalMode ? undefined : /^(?!.*Signal Generation)/,
```

When `SIGNAL_MODE=false`, the negative lookahead regex excludes any test whose title contains "Signal Generation". When `SIGNAL_MODE=true`, grep is undefined and every test runs.

Enable locally by setting `SIGNAL_MODE=true` in `.env` or using `npm run test:full:signals`. Enable in CI via GitHub Actions -> Lighthouse CI -> Run workflow -> set `signal_mode` to `true`. Note: enabling signal mode will cause a failed CI run by design.

---

📊 **Quality signal report**

After every run, Lighthouse parses the raw Playwright output and produces a human-readable signal report plus a structured `reports/summary.json` for downstream AI analysis:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔦 Lighthouse — Quality Signal Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Run Date:        3/11/2026, 11:22:14 AM
  Total Duration:  17.45s
  Total Tests:     12
  Passed:          9
  Failed:          3
  Flaky:           0
  Skipped:         0
  Stability Score: 75%
  Slowest Tests:
  -> signal.spec.ts › wrong product title assertion (6873ms)
  -> signal.spec.ts › inconsistent inventory item rendering (5974ms)
  -> checkout.spec.ts › completes a full purchase as standard_user (1763ms)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

🤖 **AI insights**

After the signal report runs, Lighthouse feeds the results into an AI layer that produces three things: a failure analysis, a release readiness verdict, and specific coverage gap suggestions. The results are written to `reports/ai-insights.json`.

When failures are present, Lighthouse makes a second AI call to classify each failure into a structured format. The classification is written to `reports/ai-classification.json` and included in the CI webhook payload sent to QA Signal Hub.

Each classification contains the test name, file, failure type, confidence level, and a clean one-line error summary. The AI classifies purely from the error message and stack trace evidence, not from the test name. This ensures the classification is honest and based on observable failure patterns rather than labels.

The two output files serve different audiences:
- `ai-insights.json` — human-readable analysis for the terminal and Allure dashboard
- `ai-classification.json` — machine-readable structured data for QA Signal Hub to route and act on

The second AI call only fires when failures are present. Clean runs make exactly one AI call and skip classification entirely.

The AI layer is provider-agnostic. Mistral is the default. It is free, requires no credit card, and works both locally and in CI out of the box. Anyone who forks Lighthouse can run it immediately without any billing setup. Set `AI_PROVIDER` in your `.env` to choose a different provider:

**`AI_PROVIDER=mistral`** ⭐ default. Free tier, no credit card required, just a phone number. Get an API key at [console.mistral.ai](https://console.mistral.ai). Strong reasoning quality and an open-source model lineup backed by a European privacy standard. The right choice for teams who want zero billing friction and immediate access.

**`AI_PROVIDER=anthropic`** Highest quality analysis. Requires an API key from [console.anthropic.com](https://console.anthropic.com). A $5 top-up is enough to get started and goes an extraordinarily long way:

| | Tokens | Cost (Haiku) |
|---|---|---|
| Input (summary + prompt) | ~600 tokens | $1 / million tokens |
| Output (AI analysis) | ~400 tokens | $5 / million tokens |
| Total per run | ~1,000 tokens | fractions of a cent |
| **$5 budget** | | **~800,000+ runs** |

**`AI_PROVIDER=ollama`** Runs entirely on your local machine using [Ollama](https://ollama.com). Nothing leaves your environment. The right choice for teams with strict data privacy or compliance requirements running Lighthouse internally.

Ollama has intentional limitations by design:

- Does not run in Docker containers. Docker's isolated network means `localhost` inside the container refers to the container itself, not your machine. Ollama is not running there.
- Does not run in CI pipelines like GitHub Actions. CI spins up a clean Linux VM with no Ollama installed.
- When either environment is detected, Lighthouse exits cleanly with a helpful message rather than failing. This is intentional. Ollama's value is local privacy, not cloud execution.

For teams that want Ollama in Docker, the proper approach is to run Ollama as its own Docker service alongside Lighthouse. This is a known pattern but out of scope for this project.
```
AI_PROVIDER=mistral      # default, free tier, no credit card, open source
AI_PROVIDER=anthropic    # best quality, requires API key
AI_PROVIDER=ollama       # local only, private, enterprise-friendly
                         # does not run in Docker or CI by design
```

To change the default, set `AI_PROVIDER` in your `.env` for local runs or in your CI environment block for pipeline runs:
```bash
# .env
AI_PROVIDER=mistral     # default
AI_PROVIDER=anthropic   # switch to Anthropic locally
AI_PROVIDER=ollama      # local only, does not run in Docker or CI
```

To change the default for everyone, update the fallback in `scripts/ai-analyze.ts`:
```typescript
const provider = process.env.AI_PROVIDER ?? 'mistral'; // change 'mistral' to your preferred default
```

---

📈 **Allure dashboard**

After every run, Lighthouse generates a visual test dashboard via Allure. It shows pass/fail status, test duration, flaky test detection, and results grouped by spec file.

The dashboard is automatically deployed to GitHub Pages on every CI run:

🔦 **https://abbysudario.github.io/lighthouse-qa/**

Generate and view locally:
```bash
npm run allure:generate
npm run allure:open
```

**How Playwright connects to Allure:**

`allure-playwright` is the bridge. It listens to Playwright's reporter API and translates each test result into Allure's JSON format, writing one file per test into `allure-results/`. The Allure CLI then reads those files and generates the dashboard. This is why Allure works with any test framework. Each framework has its own translator package but they all produce the same Allure JSON format.

**Why the downloaded artifact doesn't open by double-clicking:**

Allure generates a single-page application (SPA). SPAs require a web server to function. The browser blocks JavaScript from loading local resources when opened as a file due to security restrictions. This is why `npm run allure:open` starts a local server rather than just opening the file directly. The GitHub Pages hosted version has no this limitation. It is served over HTTP automatically.

**Retry display behavior:**

Playwright retries are enabled in CI (`retries: 1`) but disabled locally and in Docker (`retries: 0`). Docker sets `DOCKER=true` as an environment variable, which `playwright.config.ts` uses to override the retry behavior:
```typescript
retries: process.env.CI === 'true' && !process.env.DOCKER ? 1 : 0,
```

This prevents Allure from showing a misleading "Retried tests" column when running in Docker, since all tests pass on the first attempt and no actual retries occur.

---

📡 **Signal generation**

`signal.spec.ts` contains three deliberately failing tests that exist to generate classifiable signal for [QA Signal Hub](https://github.com/abbysudario/qa-signal-hub). These are not bugs. They are permanent, intentional fixtures. They are excluded from normal runs and only execute when `SIGNAL_MODE=true`.

Test names are intentionally clean and free of classification labels. The AI classifies each failure purely from the error message and stack trace evidence. This keeps the classification honest and based on observable failure patterns rather than hints embedded in the test name.

Each test represents a distinct failure classification that QA Signal Hub routes differently:

**`wrong product title assertion`** always fails. It asserts an incorrect product name against the live UI. This simulates a real regression where a test expectation no longer matches application behavior. QA Signal Hub classifies this as REGRESSION and creates a GitHub Issue labeled `regression`.

**`inconsistent inventory item rendering`** fails on the first attempt and passes on retry. It uses `testInfo.retry` to make the behavior deterministic. On the first attempt (`testInfo.retry === 0`) it asserts a value that does not exist on the page. On retry (`testInfo.retry === 1`) it asserts the correct value and passes. Playwright detects the fail-then-pass pattern and marks the test `flaky: true` in CI where retries are enabled. Locally retries are disabled so it simply fails. QA Signal Hub classifies this as FLAKY and creates a GitHub Issue labeled `flaky`.

**`unreachable external resource`** always fails. It attempts to navigate to a non-existent host, producing `ERR_NAME_NOT_RESOLVED`. This simulates an infrastructure failure where a dependent service is unreachable. QA Signal Hub classifies this as ENVIRONMENT and creates a GitHub Issue labeled `environment`.

Why `testInfo.retry` instead of `Math.random()` for flakiness: `Math.random()` produces genuinely random behavior that may never trigger the fail-then-pass pattern Playwright needs to classify a test as flaky. `testInfo.retry` is deterministic. It guarantees the pattern on every CI run, which produces accurate `flaky: true` classification in the report every time.

---

⚙️ **CI**

Every push and PR triggers the full pipeline: tests, quality signal report, AI insights, Allure dashboard generation, and deployment to GitHub Pages. Signal fixtures are excluded by default so CI stays green on every push.

Two manual `workflow_dispatch` inputs are available:

**`flake_mode`** — set to `true` to run stability tests 5 times for flake detection. Defaults to `false`.

**`signal_mode`** — set to `true` to include signal fixtures and generate classifiable failures for QA Signal Hub. Defaults to `false`. Will cause a failed CI run by design.

After tests run, the CI webhook payload is sent to QA Signal Hub. The payload includes the job status, branch, commit, run URL, and the full `classifications` array from `ai-classification.json`. If no failures occurred, `classifications` is an empty array. QA Signal Hub reads this payload and routes each classification to the appropriate action.

CI uploads three artifacts on every run:
- `dashboard-allure` — visual Allure test dashboard (also live at the GitHub Pages URL)
- `dashboard-playwright` — Playwright HTML report
- `quality-signals` — signal report, AI insights, AI classification, and raw results JSON

GitHub Pages deployment is handled by `peaceiris/actions-gh-pages@v3`. It pushes the generated `allure-report/` folder to the `gh-pages` branch after every run, which GitHub Pages serves automatically as a static site.

GitHub Actions permissions are scoped at the job level. Only the specific job that deploys to GitHub Pages has write access. The rest of the pipeline runs with read-only permissions. This is more secure than granting broad read/write access at the repository level.

---

🗺️ **Roadmap**

| Milestone | Focus | Status |
|---|---|---|
| 0 | Foundation: Playwright, Docker, CI | ✅ |
| 1 | Test coverage: checkout, negative, stability | ✅ |
| 2 | Signal layer: analyzer, summary, CI integration | ✅ |
| 2.5 | Page Object Model | ✅ |
| 3 | AI analysis: failure explanation, release readiness | ✅ |
| 3.5 | Multi-provider support: Mistral, Ollama, Anthropic | ✅ |
| 4 | Dashboard reporting with Allure | ✅ |
| 5 | GitHub Pages: live hosted Allure dashboard | ✅ |
| 6 | Signal generation: deliberate fixtures for QA Signal Hub | ✅ |