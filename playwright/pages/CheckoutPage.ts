import { Page, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export class CheckoutPage {
  constructor(private page: Page) {}

  async fillShippingInfo(firstName: string, lastName: string, postalCode: string) {
    await this.page.fill(selectors.checkout.firstName, firstName);
    await this.page.fill(selectors.checkout.lastName, lastName);
    await this.page.fill(selectors.checkout.postalCode, postalCode);
    await this.page.click(selectors.checkout.continue);
  }

  async finishOrder() {
    await this.page.click(selectors.checkout.finish);
  }

  async expectOrderConfirmation() {
    await expect(this.page.locator(selectors.checkout.completeHeader)).toHaveText('Thank you for your order!');
  }

  async expectOnStepOne() {
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }

  async expectOnStepTwo() {
    await expect(this.page).toHaveURL(/checkout-step-two/);
  }

  async expectOrderComplete() {
    await expect(this.page).toHaveURL(/checkout-complete/);
  }
}