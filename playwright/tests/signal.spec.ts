import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Milestone 6: Signal Generation
 *
 * These tests are intentionally designed to generate classifiable signal
 * for QA Signal Hub. They are not bugs — they are deliberate fixtures.
 *
 * Each test represents a distinct failure classification:
 *   - REGRESSION: a real assertion failure (wrong expected value)
 *   - FLAKY: deterministic flakiness using testInfo.retry — fails on attempt 1, passes on retry
 *   - ENVIRONMENT: attempts to reach an unavailable external resource
 */

test.describe('Signal Generation', () => {
  test('REGRESSION: wrong product title assertion', async ({ page }) => {
    // Intentional failure: asserts an incorrect product name
    // Expected to always fail — simulates a regression signal
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.loginAsStandardUser();
    await inventoryPage.expectPageLoaded();

    await expect(page.locator('[data-test="inventory-item-name"]').first()).toHaveText(
      'This Product Does Not Exist'
    );
  });

  test('FLAKY: deterministic retry-based flakiness', async ({ page }, testInfo) => {
    // Intentional flaky behavior: fails on first attempt, passes on retry
    // Uses testInfo.retry to guarantee Playwright marks this as "flaky: true"
    // Requires retries to be enabled — active in CI via playwright.config.ts
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.loginAsStandardUser();
    await inventoryPage.expectPageLoaded();

    const expectedText = testInfo.retry === 0 ? 'This Will Fail On First Attempt' : 'Sauce Labs Backpack';

    await expect(page.locator('[data-test="inventory-item-name"]').first()).toHaveText(
      expectedText
    );
  });

  test('ENVIRONMENT: unreachable external resource', async ({ page }) => {
    // Intentional environment failure: navigates to a non-existent host
    // Expected to always fail — simulates an infrastructure/environment signal
    await page.goto('https://this-environment-does-not-exist.internal', {
      waitUntil: 'commit',
      timeout: 10000,
    });
  });
});