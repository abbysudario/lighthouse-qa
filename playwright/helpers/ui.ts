import { Page } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';

export async function login(page: Page, username?: string, password?: string) {
  const user = username ?? process.env.SAUCE_USERNAME;
  const pass = password ?? process.env.SAUCE_PASSWORD;

  if (!user || !pass) {
    throw new Error('SAUCE_USERNAME or SAUCE_PASSWORD environment variables are not set');
  }

  await page.goto('/');
  await page.fill(selectors.login.username, user);
  await page.fill(selectors.login.password, pass);
  await page.click(selectors.login.loginButton);
}