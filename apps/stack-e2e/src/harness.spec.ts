import { test, expect } from '@playwright/test';

test('stack serves the ui', async ({ request }) => {
  const res = await request.get('/');
  expect(res.ok()).toBeTruthy();
});
