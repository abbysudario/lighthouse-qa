import { test, expect } from '@playwright/test';
import { selectors } from '../selectors/saucedemo.selectors';
import { login } from '../helpers/ui';

test.describe('Smoke', () => {
  test('standard_user can login and land on Products', async ({ page }) => {
    await login(page);
    await expect(page.locator(selectors.inventory.title)).toHaveText('Products');
  });
});