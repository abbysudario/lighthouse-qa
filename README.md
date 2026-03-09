# 🔦 Lighthouse

Lighthouse is a QA intelligence system that surfaces blindspots and suggests intentional, impactful changes without making decisions for you. Think of it as a northstar for shipping: it doesn't tell you to ship or not to ship, it tells you what your tests are actually saying so you can decide with confidence.

Tests produce truth. Lighthouse produces clarity.

> ✅ Complete — AI-assisted QA intelligence, multi-provider support, full CI pipeline, Allure dashboard with live hosted results.

🔦 **Live Dashboard:** https://abbysudario.github.io/lighthouse-qa/

---

Lighthouse sits on top of your test suite as a signal layer. It observes, interprets, and warns. It doesn't replace tests. It gives them a voice. Most QA systems answer "did it pass?" Lighthouse asks the harder questions: which tests are unreliable, what's slowing the pipeline down, and is this build actually safe to ship?

Every decision in this project is intentional. The selectors use data-test attributes over CSS classes. Commits represent capabilities, not file noise. Files earn their place. Nothing exists as a placeholder. That ethos runs through every layer of the system.

---

🧰 **Stack**

TypeScript, Playwright, Docker, GitHub Actions, ts-node, dotenv. Targets [SauceDemo](https://www.saucedemo.com), a stable e-commerce demo chosen because the infrastructure tells the story, not the app.

---

🗂️ **Structure**
```
lighthouse-qa/
├─ playwright/
│  ├─ global-setup.ts            # env validation, FLAKE_MODE config
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
│     └─ stability.spec.ts       # can we trust it consistently?
├─ scripts/
│  ├─ analyze.ts                 # quality signal analyzer
│  └─ ai-analyze.ts              # AI insights engine
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
```bash
git clone https://github.com/abbysudario/lighthouse-qa.git
cd lighthouse-qa
npm install
npx playwright install --with-deps
cp .env.example .env
# add your credentials to .env
```

Run the full pipeline in one command:
```bash
npm run test:full
```

`test:full` clears `allure-results/` and `allure-report/` before every run to prevent phantom results from accumulating across runs. Playwright appends result files on every run — without this cleanup, Allure would read stale files alongside fresh ones and produce duplicate or misleading results.

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
docker compose run --rm lighthouse-qa   # runs full pipeline inside container
npm run allure:open                      # view dashboard on your machine
```

Docker mounts four volumes so generated files come back to your machine after the container exits:
```
./reports           → signal report and AI insights
./playwright-report → Playwright HTML report
./allure-results    → raw Allure result files
./allure-report     → generated Allure dashboard
```

Without volumes, all generated output would disappear when the container exits.

---

🌊 **FLAKE_MODE**

Stability tests can run up to 5 iterations to surface flakiness before it hits production. The mode flows through the entire system from CI input all the way to test execution:
```
workflow_dispatch input → github.event.inputs.flake_mode
                       ↓
        || 'false' fallback for push/PR triggers
                       ↓
              FLAKE_MODE env variable
                       ↓
         global-setup.ts reads and validates it
                       ↓
         stability.spec.ts uses ITERATIONS = 1 or 5
```

Enable locally by setting `FLAKE_MODE=true` in `.env`. Enable in CI via GitHub Actions → Lighthouse CI → Run workflow → set `flake_mode` to `true`.

FLAKE_MODE runs stability tests 5 times in a loop within a single test — it is not the same as Playwright retries. Retries happen when a test fails and Playwright reruns it automatically. FLAKE_MODE proactively stress-tests stability before failure ever occurs.

---

📊 **Quality signal report**

After every run, Lighthouse parses the raw Playwright output and produces a human-readable signal report plus a structured `reports/summary.json` for downstream AI analysis:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔦 Lighthouse — Quality Signal Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Run Date:        3/6/2026, 3:27:06 PM
  Total Duration:  5.62s
  Total Tests:     9
  Passed:          9
  Failed:          0
  Flaky:           0
  Skipped:         0
  Stability Score: 100%

  Slowest Tests:
  → checkout.spec.ts › completes a full purchase as standard_user (1847ms)
  → smoke.spec.ts › standard_user can login and land on Products (1718ms)
  → stability.spec.ts › login and inventory load consistently (1717ms)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

🤖 **AI insights**

After the signal report runs, Lighthouse feeds the results into an AI layer that produces three things: a failure analysis, a release readiness verdict, and specific coverage gap suggestions.

The AI layer is provider-agnostic. Mistral is the default — free, no credit card required, and works both locally and in CI out of the box. Anyone who forks Lighthouse can run it immediately without any billing setup. Set `AI_PROVIDER` in your `.env` to choose a different provider:

**`AI_PROVIDER=mistral`** ⭐ default — free tier, no credit card required, just a phone number. Get an API key at [console.mistral.ai](https://console.mistral.ai). Strong reasoning quality and an open-source model lineup backed by a European privacy standard. The right choice for teams who want zero billing friction and immediate access.

**`AI_PROVIDER=anthropic`** — highest quality analysis. Requires an API key from [console.anthropic.com](https://console.anthropic.com). A $5 top-up is enough to get started and goes an extraordinarily long way:

| | Tokens | Cost (Haiku) |
|---|---|---|
| Input (summary + prompt) | ~600 tokens | $1 / million tokens |
| Output (AI analysis) | ~400 tokens | $5 / million tokens |
| Total per run | ~1,000 tokens | fractions of a cent |
| **$5 budget** | | **~800,000+ runs** |

**`AI_PROVIDER=ollama`** — runs entirely on your local machine using [Ollama](https://ollama.com). Nothing leaves your environment. The right choice for teams with strict data privacy or compliance requirements running Lighthouse internally.

Ollama has intentional limitations by design:

- Does not run in Docker containers. Docker's isolated network means `localhost` inside the container refers to the container itself, not your machine. Ollama is not running there.
- Does not run in CI pipelines like GitHub Actions. CI spins up a clean Linux VM with no Ollama installed.
- When either environment is detected, Lighthouse exits cleanly with a helpful message rather than failing. This is intentional — Ollama's value is local privacy, not cloud execution.

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

`allure-playwright` is the bridge. It listens to Playwright's reporter API and translates each test result into Allure's JSON format, writing one file per test into `allure-results/`. The Allure CLI then reads those files and generates the dashboard. This is why Allure works with any test framework — each has its own translator package but they all produce the same Allure JSON format.

**Why the downloaded artifact doesn't open by double-clicking:**

Allure generates a single-page application (SPA). SPAs require a web server to function — the browser blocks JavaScript from loading local resources when opened as a file due to security restrictions. This is why `npm run allure:open` starts a local server rather than just opening the file directly. The GitHub Pages hosted version has no this limitation — it's served over HTTP automatically.

**Retry display behavior:**

Playwright retries are enabled in CI (`retries: 1`) but disabled locally and in Docker (`retries: 0`). Docker sets `DOCKER=true` as an environment variable, which `playwright.config.ts` uses to override the retry behavior:
```typescript
retries: process.env.CI === 'true' && !process.env.DOCKER ? 1 : 0,
```

This prevents Allure from showing a misleading "Retried tests" column when running in Docker, since all tests pass on the first attempt and no actual retries occur.

---

⚙️ **CI**

Every push and PR triggers the full pipeline: tests, quality signal report, AI insights, Allure dashboard generation, and deployment to GitHub Pages. A manual `workflow_dispatch` trigger is available with an optional `flake_mode` input for on-demand flake detection runs.

CI uploads three artifacts on every run:
- `dashboard-allure` — visual Allure test dashboard (also live at the GitHub Pages URL)
- `dashboard-playwright` — Playwright HTML report
- `quality-signals` — signal report, AI insights, raw results JSON

GitHub Pages deployment is handled by `peaceiris/actions-gh-pages@v3` — it pushes the generated `allure-report/` folder to the `gh-pages` branch after every run, which GitHub Pages serves automatically as a static site.

GitHub Actions permissions are scoped at the job level — only the specific job that deploys to GitHub Pages has write access. The rest of the pipeline runs with read-only permissions. This is more secure than granting broad read/write access at the repository level.

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
| 5 | GitHub Pages — live hosted Allure dashboard | ✅ |