import { screen } from '@testing-library/react';
import { json, renderAt, stubFetch } from './pages/spec-helpers';

jest.mock('./pages/webcam', () => ({ __esModule: true, default: () => <p>webcam page</p> }));

it('a logged-out visit redirects to login (library and webcam)', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(401, { version: 'v1', error: { code: 'unauthorized', message: 'no session' } }),
  });
  renderAt('/webcam');
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
  expect(screen.queryByText('webcam page')).toBeNull();
});
