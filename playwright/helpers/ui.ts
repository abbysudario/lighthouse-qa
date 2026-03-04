import { expect, Page } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export async function login(page: Page) {
  const username = process.env.SAUCE_USERNAME;
  const password = process.env.SAUCE_PASSWORD;

  if (!username || !password) {
    throw new Error('SAUCE_USERNAME or SAUCE_PASSWORD environment variables are not set');
  }

  await page.goto('/');
  await page.fill(selectors.login.username, username);
  await page.fill(selectors.login.password, password);
  await page.click(selectors.login.loginButton);
  await expect(page.locator(selectors.inventory.title)).toHaveText('Products');
}