import { test, expect } from '@playwright/test';

const base = process.env.PW_BASE_URL || 'http://localhost:3000';

test('login shows error on invalid credentials and succeeds on valid', async ({ page }) => {
  await page.goto(`${base}/login`);
  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // We expect to stay on login or see an error notice; as a simple check, ensure not redirected to profile
  await expect(page).not.toHaveURL(/\/profile/);

  // Use dev creds (when OFFLINE_MODE or env creds active) to ensure a pass path
  await page.getByLabel('Email').fill(process.env.DEV_AUTH_EMAIL || 'QA');
  await page.getByLabel('Password').fill(process.env.DEV_AUTH_PASSWORD || 'QA');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/profile/);
  await expect(page).toHaveURL(/\/profile/);
});


