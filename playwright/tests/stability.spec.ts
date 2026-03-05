import { test, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';
import { login } from '../helpers/ui';

const FLAKE_MODE = process.env.FLAKE_MODE === 'true';
const ITERATIONS = FLAKE_MODE ? 5 : 1;

test.describe('Stability Checks', () => {
  test('login and inventory load consistently', async ({ page }) => {
    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await login(page);
        await expect(page.locator(selectors.inventory.title)).toHaveText('Products');
        await page.goto('/');
      });
    }
  });

  test('add to cart and remove maintains correct cart state', async ({ page }) => {
    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await login(page);
        await page.click(selectors.inventory.addToCartButtonByName('Sauce Labs Backpack'));
        await expect(page.locator(selectors.inventory.cartBadge)).toHaveText('1');
        await page.click(selectors.cart.removeByName('Sauce Labs Backpack'));
        await expect(page.locator(selectors.inventory.cartBadge)).not.toBeVisible();
        await page.goto('/');
      });
    }
  });

  test('checkout flow completes reliably', async ({ page }) => {
    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await login(page);
        await page.click(selectors.inventory.addToCartButtonByName('Sauce Labs Backpack'));
        await page.click(selectors.inventory.cartLink);
        await page.click(selectors.cart.checkout);
        await page.fill(selectors.checkout.firstName, 'Jane');
        await page.fill(selectors.checkout.lastName, 'Doe');
        await page.fill(selectors.checkout.postalCode, '10001');
        await page.click(selectors.checkout.continue);
        await page.click(selectors.checkout.finish);
        await expect(page.locator(selectors.checkout.completeHeader)).toHaveText('Thank you for your order!');
        await page.goto('/');
      });
    }
  });
});