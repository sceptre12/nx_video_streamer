import { test, expect, Page } from '@playwright/test';
import { demoPassword, uiBaseUrl } from './support/env';

async function login(page: Page, user: 'demo1' | 'demo2'): Promise<void> {
  await page.goto(`${uiBaseUrl()}/login`);
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(demoPassword(user));
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
}

test.describe('stream isolation between accounts', () => {
  test('the owner streams a video; another account gets 404 for the same URL', async ({
    browser,
    page,
  }) => {
    // Owner first: demo1 reads its own library and streams the first video.
    await login(page, 'demo1');
    const libraryRes = await page.request.get(`${uiBaseUrl()}/api/v1/library`);
    expect(libraryRes.status()).toBe(200);
    const library = (await libraryRes.json()) as {
      videos: { video_id: string; stream_url: string }[];
    };
    expect(library.videos.length).toBeGreaterThan(0);
    const { video_id, stream_url } = library.videos[0];
    const streamUrl = `${uiBaseUrl()}${stream_url}`;

    const ownerRes = await page.request.get(streamUrl, { headers: { Range: 'bytes=0-99' } });
    expect([200, 206]).toContain(ownerRes.status());
    expect(ownerRes.headers()['content-type']).toContain('video/mp4');
    const ownerBody = await ownerRes.body();
    expect(ownerBody.length).toBeGreaterThan(0);

    // Then the other account requests that exact URL.
    const context2 = await browser.newContext();
    try {
      const page2 = await context2.newPage();
      await login(page2, 'demo2');

      const otherLibrary = (await (
        await page2.request.get(`${uiBaseUrl()}/api/v1/library`)
      ).json()) as { videos: { video_id: string }[] };
      expect(otherLibrary.videos.map((v) => v.video_id)).not.toContain(video_id);

      const otherRes = await page2.request.get(streamUrl);
      expect(otherRes.status()).toBe(404);
      expect(otherRes.headers()['content-type'] ?? '').not.toContain('video/mp4');
      const otherBody = await otherRes.body();
      const json = JSON.parse(otherBody.toString('utf8')) as { error: { code: string } };
      expect(json.error.code).toBe('not_found');
      expect(otherRes.headers()['content-range']).toBeUndefined();
    } finally {
      await context2.close();
    }
  });
});
