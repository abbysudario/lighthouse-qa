import { Page, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.page.fill(selectors.login.username, username);
    await this.page.fill(selectors.login.password, password);
    await this.page.click(selectors.login.loginButton);
  }

  async loginAsStandardUser() {
    const username = process.env.SAUCE_USERNAME;
    const password = process.env.SAUCE_PASSWORD;

    if (!username || !password) {
      throw new Error('SAUCE_USERNAME or SAUCE_PASSWORD environment variables are not set');
    }

    await this.goto();
    await this.login(username, password);
  }

  async expectErrorMessage(expectedMessage: string) {
    await expect(this.page.locator(selectors.login.error)).toBeVisible();
    await expect(this.page.locator(selectors.login.error)).toContainText(expectedMessage);
  }

  async expectLoginSuccess() {
    await expect(this.page.locator(selectors.inventory.title)).toHaveText('Products');
  }
  async expectRedirectedToLogin() {
  await expect(this.page).toHaveURL('https://www.saucedemo.com/');
}
}