import { expect, Page } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export async function login(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.fill(selectors.login.username, username);
  await page.fill(selectors.login.password, password);
  await page.click(selectors.login.loginButton);
  await expect(page.locator(selectors.inventory.title)).toHaveText('Products');
}