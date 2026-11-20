import { test, expect, Page, Response } from '@playwright/test';
import { demoPassword, uiBaseUrl } from './support/env';

interface Library {
  videos: { video_id: string; stream_url: string }[];
}

const isLibrary = (r: Response) =>
  new URL(r.url()).pathname === '/api/v1/library' && r.request().method() === 'GET';

/**
 * Logs in through the real form. The library page issues its own GET /api/v1/library right after
 * login, which is the first library request of that user; it is captured here, not repeated.
 */
async function loginAndCaptureFirstLibrary(
  page: Page,
  user: 'demo1' | 'demo2'
): Promise<Response> {
  await page.goto(`${uiBaseUrl()}/login`);
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(demoPassword(user));
  const firstLibrary = page.waitForResponse(isLibrary);
  await page.getByRole('button', { name: 'Log in' }).click();
  const res = await firstLibrary;
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  return res;
}

test.describe('library cache through the ui proxy', () => {
  // lib:v1:{user_id} lives 60 s; the HIT is asserted inside that window, never after a sleep.
  test('demo1: first library request is a MISS, the second is a HIT', async ({ page }) => {
    const first = await loginAndCaptureFirstLibrary(page, 'demo1');
    expect(first.status()).toBe(200);
    expect(first.headers()['x-cache']).toBe('MISS');

    const second = await page.request.get(`${uiBaseUrl()}/api/v1/library`);
    expect(second.status()).toBe(200);
    expect(second.headers()['x-cache']).toBe('HIT');
    expect(second.headers()['cache-control']).toContain('no-store');
  });

  test('demo2 after demo1 warmed its library: first request is a MISS with only demo2 rows', async ({
    browser,
    page,
  }) => {
    // Warm demo1's entry (a HIT or MISS here is irrelevant; it only has to be cached).
    await loginAndCaptureFirstLibrary(page, 'demo1');
    const warm = await page.request.get(`${uiBaseUrl()}/api/v1/library`);
    expect(warm.status()).toBe(200);
    expect(warm.headers()['x-cache']).toBe('HIT');
    const demo1Ids = ((await warm.json()) as Library).videos.map((v) => v.video_id);
    expect(demo1Ids.length).toBeGreaterThan(0);

    // demo2 uses its own browser context, so no demo1 cookie is shared.
    const context2 = await browser.newContext();
    try {
      const page2 = await context2.newPage();
      const first = await loginAndCaptureFirstLibrary(page2, 'demo2');
      expect(first.status()).toBe(200);
      expect(first.headers()['x-cache']).toBe('MISS');
      const demo2Ids = ((await first.json()) as Library).videos.map((v) => v.video_id);
      for (const id of demo1Ids) {
        expect(demo2Ids).not.toContain(id);
      }

      // demo2's follow-up request is demo2's own entry, still free of demo1's rows.
      const again = await page2.request.get(`${uiBaseUrl()}/api/v1/library`);
      expect(again.status()).toBe(200);
      expect(again.headers()['x-cache']).toBe('HIT');
      const againIds = ((await again.json()) as Library).videos.map((v) => v.video_id);
      expect(againIds).toEqual(demo2Ids);
    } finally {
      await context2.close();
    }
  });
});
