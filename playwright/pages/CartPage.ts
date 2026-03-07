import { Page, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export class CartPage {
  constructor(private page: Page) {}

  async removeFromCart(itemName: string) {
    await this.page.click(selectors.cart.removeByName(itemName));
  }

  async proceedToCheckout() {
    await this.page.click(selectors.cart.checkout);
  }

  async expectPageLoaded() {
    await expect(this.page.locator(selectors.cart.title)).toHaveText('Your Cart');
  }

  async expectCartBadgeNotVisible() {
    await expect(this.page.locator(selectors.inventory.cartBadge)).not.toBeVisible();
  }
}