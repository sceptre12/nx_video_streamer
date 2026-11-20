import { test, expect, Page } from '@playwright/test';
import { demoPassword, uiBaseUrl } from './support/env';

async function loginAsDemo1(page: Page): Promise<void> {
  await page.goto(`${uiBaseUrl()}/login`);
  await page.locator('input[name="username"]').fill('demo1');
  await page.locator('input[name="password"]').fill(demoPassword('demo1'));
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
}

test.describe('library and playback through the ui proxy', () => {
  test('demo1 selects a video and it plays', async ({ page }) => {
    await loginAsDemo1(page);

    const items = page.locator('ul li button');
    await expect(items.first()).toBeVisible();
    await items.first().click();

    const video = page.getByTestId('player');
    await expect(video).toBeVisible();
    // Playback: readyState 4 (HAVE_ENOUGH_DATA) or currentTime advancing.
    await expect
      .poll(
        async () =>
          video.evaluate((el: HTMLVideoElement) => el.readyState >= 4 || el.currentTime > 0),
        { timeout: 30_000 }
      )
      .toBe(true);
  });

  test('a Range stream request through the ui proxy answers 206 with Content-Range', async ({
    page,
  }) => {
    await loginAsDemo1(page);

    // page.request shares the browser context cookies (nvs_session).
    const libraryRes = await page.request.get(`${uiBaseUrl()}/api/v1/library`);
    expect(libraryRes.status()).toBe(200);
    const library = (await libraryRes.json()) as {
      videos: { video_id: string; stream_url: string }[];
    };
    expect(library.videos.length).toBeGreaterThan(0);

    const streamRes = await page.request.get(`${uiBaseUrl()}${library.videos[0].stream_url}`, {
      headers: { Range: 'bytes=0-99' },
    });
    expect(streamRes.status()).toBe(206);
    expect(streamRes.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/);
    expect(streamRes.headers()['accept-ranges']).toBe('bytes');
    expect((await streamRes.body()).length).toBe(100);
  });
});
