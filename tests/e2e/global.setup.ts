import { chromium, FullConfig, expect } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PW_BASE_URL || 'http://localhost:3000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try to sign up a unique user, then login and save storage state
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'StrongPass1!';
  try {
    await page.goto(`${baseURL}/signup`);
    if (page.url().includes('/signup')) {
      await page.getByLabel('Email or username').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Sign up' }).click();
    }
  } catch {}

  // Login (fall back to dev credentials if signup flow changed)
  try {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/profile/);
  } catch {
    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email').fill('QA');
    await page.getByLabel('Password').fill('QA');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/profile/);
  }

  // Persist authenticated state
  await context.storageState({ path: 'tests/e2e/.auth/state.json' });
  await browser.close();
}


