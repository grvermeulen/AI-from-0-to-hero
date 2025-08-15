import { test, expect } from '@playwright/test';

const base = process.env.PW_BASE_URL || 'http://localhost:3000';

async function ensureLoggedIn(page: any) {
  const resp = await page.request.get(`${base}/api/auth/session`);
  const json = await resp.json();
  if (!json || !json.user) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Email').fill('QA');
    await page.getByLabel('Password').fill('QA');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/profile/);
  }
}

test.describe.configure({ mode: 'serial' });

const uniqueEmail = `user${Date.now()}@example.com`;
const password = 'StrongPass1!';

test('signup creates account and redirects to login', async ({ page }) => {
  await page.goto(`${base}/signup`);
  await page.getByLabel('Email or username').fill(uniqueEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('main')).toContainText('Account created');
});

test('login and view profile', async ({ page }) => {
  await page.goto(`${base}/login`);
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Expect redirect to profile per login page setup
  await page.waitForURL(/\/profile/);
  await expect(page.locator('main')).toContainText('Your Profile');
});

test('start quiz, answer, and see score banner', async ({ page }) => {
  await ensureLoggedIn(page);
  await page.goto(`${base}/quiz/seed-quiz-1`);
  // Select the first option for each question
  const radios = page.locator('input[type="radio"]');
  const count = await radios.count();
  // pick first option per question by clicking the first radio of each group
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    const name = await radios.nth(i).getAttribute('name');
    if (name && !names.has(name)) {
      names.add(name);
      await radios.nth(i).check();
    }
  }
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/\/quiz\/seed-quiz-1\?(.+)/);
  await expect(page.locator('main')).toContainText('Score:');
});

test('submit lab and see submissionId banner', async ({ page }) => {
  await ensureLoggedIn(page);
  await page.goto(`${base}/lab/seed-lab-1`);
  await page.getByRole('textbox', { name: 'Or paste code' }).fill('console.log("hello")');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/\/lab\/seed-lab-1\?(.+)/);
  await expect(page.locator('main')).toContainText('Submission:');
});




