import { test, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';
import { login } from '../helpers/ui';

test.describe('Negative Scenarios', () => {
  test('locked_out_user sees error message on login', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await expect(page.locator(selectors.login.error)).toBeVisible();
    await expect(page.locator(selectors.login.error)).toContainText('Sorry, this user has been locked out');
  });

  test('standard_user cannot login with wrong password', async ({ page }) => {
    await login(page, 'standard_user', 'wrong_password');
    await expect(page.locator(selectors.login.error)).toBeVisible();
    await expect(page.locator(selectors.login.error)).toContainText('Username and password do not match');
  });

  test('login fails with empty credentials', async ({ page }) => {
    await page.goto('/');
    await page.click(selectors.login.loginButton);
    await expect(page.locator(selectors.login.error)).toBeVisible();
    await expect(page.locator(selectors.login.error)).toContainText('Username is required');
  });

  test('locked_out_user cannot access inventory directly via URL', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/\/$/);
  });
});