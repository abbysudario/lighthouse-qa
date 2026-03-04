import { test, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';
import { login } from '../helpers/ui';

test.describe('Checkout Flow', () => {
  test('completes a full purchase as standard_user', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.click(selectors.inventory.addToCartButtonByName('Sauce Labs Backpack'));
    await expect(page.locator(selectors.inventory.cartBadge)).toHaveText('1');

    // Go to cart
    await page.click(selectors.inventory.cartLink);
    await expect(page).toHaveURL(/cart/);

    // Proceed to checkout
    await page.click(selectors.cart.checkout);
    await expect(page).toHaveURL(/checkout-step-one/);

    // Fill in shipping info
    await page.fill(selectors.checkout.firstName, 'Jane');
    await page.fill(selectors.checkout.lastName, 'Doe');
    await page.fill(selectors.checkout.postalCode, '10001');
    await page.click(selectors.checkout.continue);
    await expect(page).toHaveURL(/checkout-step-two/);

    // Finish order
    await page.click(selectors.checkout.finish);
    await expect(page).toHaveURL(/checkout-complete/);

    // Confirm order completion
    await expect(page.locator(selectors.checkout.completeHeader)).toHaveText('Thank you for your order!');
  });
});