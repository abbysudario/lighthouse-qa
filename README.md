# 🔦 Lighthouse

Lighthouse is a QA intelligence system that surfaces blindspots and suggests intentional, impactful changes without making decisions for you. Think of it as a northstar for shipping: it doesn't tell you to ship or not to ship, it tells you what your tests are actually saying so you can decide with confidence.

Tests produce truth. Lighthouse produces clarity.

> 🔄 In progress — AI analysis layer coming next.

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
│  └─ analyze.ts                 # quality signal analyzer
├─ reports/                      # generated, gitignored
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

Run the tests, analyze the results, view the report:
```bash
npm test
npm run analyze
npm run test:report
```

In Docker:
```bash
docker compose build
docker compose run --rm lighthouse-qa npx playwright test
```

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

⚙️ **CI**

Every push and PR triggers the full pipeline: tests, analysis, artifact upload. A manual `workflow_dispatch` trigger is available with an optional `flake_mode` input for on-demand flake detection runs.

---

🗺️ **Roadmap**

| Milestone | Focus | Status |
|---|---|---|
| 0 | Foundation: Playwright, Docker, CI | ✅ |
| 1 | Test coverage: checkout, negative, stability | ✅ |
| 2 | Signal layer: analyzer, summary, CI integration | ✅ |
| 2.5 | Page Object Model | ✅ |
| 3 | AI analysis: failure explanation, release readiness | ⬜ |