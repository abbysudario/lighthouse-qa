import { Page, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export class InventoryPage {
  constructor(private page: Page) {}

  async addToCart(itemName: string) {
    await this.page.click(selectors.inventory.addToCartButtonByName(itemName));
  }

  async goToCart() {
    await this.page.click(selectors.inventory.cartLink);
  }

  async expectCartBadgeCount(count: number) {
    await expect(this.page.locator(selectors.inventory.cartBadge)).toHaveText(String(count));
  }

  async expectPageLoaded() {
    await expect(this.page.locator(selectors.inventory.title)).toHaveText('Products');
  }
}