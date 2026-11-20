import { test, expect } from '@playwright/test';
import { demoPassword, uiBaseUrl } from './support/env';

test.describe('login through the real form', () => {
  test('a logged-out visit to the library lands on the login page', async ({ page }) => {
    await page.goto(`${uiBaseUrl()}/`);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });

  test('demo1 with the right password reaches the library', async ({ page }) => {
    await page.goto(`${uiBaseUrl()}/login`);
    await page.locator('input[name="username"]').fill('demo1');
    await page.locator('input[name="password"]').fill(demoPassword('demo1'));
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(new RegExp(`^${uiBaseUrl()}/$`));
    await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
    await expect(page.getByText('Signed in as demo1')).toBeVisible();

    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'nvs_session' && c.httpOnly)).toBe(true);
  });

  test('a wrong password is rejected and stays on the login page', async ({ page }) => {
    await page.goto(`${uiBaseUrl()}/login`);
    await page.locator('input[name="username"]').fill('demo1');
    await page.locator('input[name="password"]').fill(`${demoPassword('demo1')}-wrong`);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'nvs_session')).toBe(false);
  });
});
