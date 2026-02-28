import { test } from '@playwright/test';
import { login } from '../helpers/ui';

test('SMK-001: standard_user can login and land on Products', async ({ page }) => {
  await login(page, process.env.SAUCE_USERNAME!, process.env.SAUCE_PASSWORD!);
});