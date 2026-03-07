import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Checkout Flow', () => {
  test('completes a full purchase as standard_user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Login
    await loginPage.loginAsStandardUser();
    await loginPage.expectLoginSuccess();

    // Add item to cart
    await inventoryPage.addToCart('Sauce Labs Backpack');
    await inventoryPage.expectCartBadgeCount(1);

    // Go to cart
    await inventoryPage.goToCart();
    await cartPage.expectPageLoaded();

    // Proceed to checkout
    await cartPage.proceedToCheckout();
    await checkoutPage.expectOnStepOne();

    // Fill shipping info
    await checkoutPage.fillShippingInfo('Jane', 'Doe', '10001');
    await checkoutPage.expectOnStepTwo();

    // Finish order
    await checkoutPage.finishOrder();
    await checkoutPage.expectOrderComplete();
    await checkoutPage.expectOrderConfirmation();
  });
});