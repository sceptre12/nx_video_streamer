import { fireEvent, screen } from '@testing-library/react';
import { json, renderAt, stubFetch, user, videos } from './spec-helpers';

jest.mock('./webcam', () => ({ __esModule: true, default: () => null }));

it('login with correct credentials shows the library and logs no password', async () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  stubFetch({
    'GET /api/v1/auth/me': json(401, { version: 'v1', error: { code: 'unauthenticated', message: 'no session' } }),
    'POST /api/v1/auth/login': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
  });
  renderAt('/login');
  fireEvent.change(await screen.findByLabelText('Username'), { target: { value: 'alice' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-pw-123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(await screen.findByText('Demo one')).toBeTruthy();
  expect(screen.getByText('Library')).toBeTruthy();
  const logged = JSON.stringify(log.mock.calls);
  expect(logged).toContain('login outcome');
  expect(logged).not.toContain('secret-pw-123');
  log.mockRestore();
});

const me401 = json(401, { version: 'v1', error: { code: 'unauthenticated', message: 'no session' } });

it('a library 401 sends the user to login', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': me401,
  });
  renderAt('/');
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
});

it('an empty library says so', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos: [] }),
  });
  renderAt('/');
  expect(await screen.findByText('No videos yet.')).toBeTruthy();
});

it('a library failure other than 401 shows its message', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(500, { version: 'v1', error: { code: 'internal_error', message: 'library broke' } }),
  });
  renderAt('/');
  expect((await screen.findByRole('alert')).textContent).toBe('library broke');
});

it('the webcam button opens the webcam page', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
  });
  renderAt('/');
  fireEvent.click(await screen.findByRole('button', { name: 'Webcam' }));
  expect(screen.queryByText('Library')).toBeNull();
});

it('log out posts and returns to login', async () => {
  const mock = stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
    'POST /api/v1/auth/logout': json(204),
  });
  renderAt('/');
  fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
  expect(mock).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({ method: 'POST' }));
});

it('log out of an already expired session still returns to login', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
    'POST /api/v1/auth/logout': me401,
  });
  renderAt('/');
  fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
});

it('a failed log out keeps the user signed in and shows the failure', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
    'POST /api/v1/auth/logout': json(500, { version: 'v1', error: { code: 'internal_error', message: 'logout failed' } }),
  });
  renderAt('/');
  fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
  expect((await screen.findByRole('alert')).textContent).toBe('logout failed');
  expect(screen.getByText('Library')).toBeTruthy();
  expect(screen.getByText('Signed in as alice')).toBeTruthy();
});
