import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Negative Scenarios', () => {
  test('locked_out_user sees error message on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('locked_out_user', 'secret_sauce');
    await loginPage.expectErrorMessage('Sorry, this user has been locked out');
  });

  test('standard_user cannot login with wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', 'wrong_password');
    await loginPage.expectErrorMessage('Username and password do not match');
  });

  test('login fails with empty credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', '');
    await loginPage.expectErrorMessage('Username is required');
  });

  test('locked_out_user cannot access inventory directly via URL', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('locked_out_user', 'secret_sauce');
    await page.goto('/inventory.html');
    await loginPage.expectRedirectedToLogin();
  });
});