import { fireEvent, screen } from '@testing-library/react';
import { json, renderAt, stubFetch, user, videos } from './spec-helpers';

jest.mock('./webcam', () => ({ __esModule: true, default: () => null }));

it('selecting a video plays its relative stream url', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
  });
  renderAt('/');
  fireEvent.click(await screen.findByText('Demo one'));
  const video = (await screen.findByTestId('player')) as HTMLVideoElement;
  expect(video.getAttribute('src')).toBe('/api/v1/video/v1/stream');
});
