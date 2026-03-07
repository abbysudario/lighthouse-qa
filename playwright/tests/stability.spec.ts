import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

const FLAKE_MODE = process.env.FLAKE_MODE === 'true';
const ITERATIONS = FLAKE_MODE ? 5 : 1;

test.describe('Stability Checks', () => {
  test('login and inventory load consistently', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await loginPage.loginAsStandardUser();
        await inventoryPage.expectPageLoaded();
        await loginPage.goto();
      });
    }
  });

  test('add to cart and remove maintains correct cart state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);

    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await loginPage.loginAsStandardUser();
        await inventoryPage.addToCart('Sauce Labs Backpack');
        await inventoryPage.expectCartBadgeCount(1);
        await cartPage.removeFromCart('Sauce Labs Backpack');
        await cartPage.expectCartBadgeNotVisible();
        await loginPage.goto();
      });
    }
  });

  test('checkout flow completes reliably', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    for (let i = 0; i < ITERATIONS; i++) {
      await test.step(`iteration ${i + 1} of ${ITERATIONS}`, async () => {
        await loginPage.loginAsStandardUser();
        await inventoryPage.addToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();
        await cartPage.proceedToCheckout();
        await checkoutPage.fillShippingInfo('Jane', 'Doe', '10001');
        await checkoutPage.finishOrder();
        await checkoutPage.expectOrderConfirmation();
        await loginPage.goto();
      });
    }
  });
});