# 🔦 Lighthouse

Lighthouse is an AI-assisted QA intelligence system designed to help teams ship with confidence.

While traditional test automation focuses on execution, Lighthouse focuses on interpretation: analyzing test results, detecting flaky behavior, and highlighting release risk using deterministic signals combined with AI-generated insights.

> **🔄 Status: In Progress** — Signal layer complete. Page Object Model refactor and AI analysis layer coming next.

---

## What Lighthouse Does

Tests produce signals. Lighthouse observes, interprets, and warns.

- **Does not decide pass/fail** — that's the test's job
- **Does not replace tests** — it gives them a voice
- **Observes, interprets, and warns** — turning raw results into actionable insights

---

## Target Application

[SauceDemo](https://www.saucedemo.com) — a stable, predictable e-commerce demo app used as the test target. Chosen for its known user roles, stable test data, and predictable UI flows.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Primary language |
| Playwright | Test framework |
| Docker | Containerized test execution |
| GitHub Actions | CI pipeline |
| Node.js 20 | Runtime |
| dotenv | Environment variable management |
| ts-node | TypeScript script execution |

---

## Project Structure
```
lighthouse-qa/
├─ playwright/
│  ├─ global-setup.ts            # env validation and FLAKE_MODE config
│  ├─ helpers/
│  │  └─ ui.ts                   # reusable login helper
│  ├─ selectors/
│  │  └─ saucedemo.selectors.ts  # centralized data-test selectors
│  └─ tests/
│     ├─ smoke.spec.ts           # baseline login check
│     ├─ checkout.spec.ts        # full purchase flow
│     ├─ negative.spec.ts        # error handling and edge cases
│     └─ stability.spec.ts       # flake detection with FLAKE_MODE
├─ scripts/
│  └─ analyze.ts                 # quality signal analyzer
├─ reports/                      # generated reports (gitignored)
├─ playwright.config.ts
├─ tsconfig.json
├─ Dockerfile
├─ docker-compose.yml
└─ .github/workflows/
   └─ lighthouse-ci.yml          # CI pipeline
```

---

## Test Coverage

| Spec | Tests | What it covers |
|---|---|---|
| `smoke.spec.ts` | 1 | App is reachable, login works |
| `checkout.spec.ts` | 1 | Full purchase flow completes |
| `negative.spec.ts` | 4 | App fails gracefully on bad input |
| `stability.spec.ts` | 3 | Flows pass consistently |

---

## Running Locally

### Prerequisites
- Node.js 20+
- Docker Desktop (for container runs)

### Setup
```bash
git clone https://github.com/abbysudario/lighthouse-qa.git
cd lighthouse-qa
npm install
npx playwright install --with-deps
cp .env.example .env
# fill in your credentials in .env
```

### Run tests
```bash
npm test
```

### Analyze results
```bash
npm run analyze
```

### View HTML report
```bash
npm run test:report
```

### Run in Docker
```bash
docker compose build
docker compose run --rm lighthouse-qa npx playwright test
```

---

## FLAKE_MODE

Lighthouse includes a built-in flake detection mode that runs stability tests multiple times to surface timing issues and inconsistent behavior.

**How it flows through the system:**
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

**To enable locally:**
```bash
# in .env
FLAKE_MODE=true
npm test
```

**To enable in CI:**
Go to GitHub Actions → Lighthouse CI → Run workflow → set `flake_mode` to `true`

---

## Quality Signal Report

After every test run, Lighthouse generates a structured quality signal report:
```bash
npm run analyze
```

**Terminal output:**
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

**Structured output:** `reports/summary.json` — used as input for Milestone 3 AI analysis.

---

## CI Pipeline

Every push and pull request triggers the full pipeline automatically:

1. Checkout repository
2. Setup Node.js 20
3. Install dependencies
4. Install Playwright browsers
5. Run tests
6. Analyze results
7. Upload Playwright report artifact
8. Upload results and summary artifact

**Manual trigger:** GitHub Actions → Lighthouse CI → Run workflow

---

## Roadmap

| Milestone | Focus | Status |
|---|---|---|
| Milestone 0 | Foundation — Playwright, Docker, CI | ✅ Complete |
| Milestone 1 | Test coverage — checkout, negative, stability | ✅ Complete |
| Milestone 2 | Signal layer — analyzer, summary, CI integration | ✅ Complete |
| Milestone 2.5 | Page Object Model refactor | ⬜ Planned |
| Milestone 3 | AI analysis — failure explanation, release readiness | ⬜ Planned |

---

## Design Principles

- **Commits = capabilities** — every commit represents a working, meaningful state
- **Data-test attributes** — selectors use `data-test` over CSS classes
- **No placeholder files** — every file contains real logic
- **Clarity over cleverness** — readable, defensible, intentional code