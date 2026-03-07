import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Smoke', () => {
  test('standard_user can login and land on Products', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsStandardUser();
    await loginPage.expectLoginSuccess();
  });
});