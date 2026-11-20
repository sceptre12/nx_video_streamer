import './pages/jsdom-polyfill';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from './routes';
import { json, renderAt, stubFetch, user, videos } from './pages/spec-helpers';

jest.mock('./pages/webcam', () => ({ __esModule: true, default: () => <p>webcam page</p> }));

const me401 = json(401, { version: 'v1', error: { code: 'unauthenticated', message: 'no session' } });

it('a logged-out visit to the webcam page redirects to login', async () => {
  stubFetch({ 'GET /api/v1/auth/me': me401 });
  renderAt('/webcam');
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
  expect(screen.queryByText('webcam page')).toBeNull();
});

it('a logged-out visit to the library redirects to login', async () => {
  stubFetch({ 'GET /api/v1/auth/me': me401 });
  renderAt('/');
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
  expect(screen.queryByText('Library')).toBeNull();
});

it('shows a loading state until the session check returns', async () => {
  let release: (r: Response) => void = () => undefined;
  const pending = new Promise<Response>((resolve) => (release = resolve));
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(() => pending);
  renderAt('/');
  expect(screen.getByText('Loading...')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull();
  await act(async () => release(me401));
  expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
});

it('an unknown path redirects to the library', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(200, user),
    'GET /api/v1/library': json(200, { version: 'v1', videos }),
  });
  renderAt('/no/such/page');
  expect(await screen.findByText('Library')).toBeTruthy();
});

it('the login redirect replaces the history entry', async () => {
  stubFetch({ 'GET /api/v1/auth/me': me401 });
  const visited: string[] = [];
  const Probe = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    visited.push(pathname);
    return <button onClick={() => navigate(-1)}>back</button>;
  };
  render(
    <MemoryRouter initialEntries={['/', '/webcam']} initialIndex={1}>
      <Probe />
      <AppRoutes />
    </MemoryRouter>
  );
  await screen.findByRole('button', { name: 'Log in' });
  fireEvent.click(screen.getByRole('button', { name: 'back' }));
  // replaced: back from /login lands on '/', not on the redirected /webcam
  expect(visited).toContain('/');
  expect(visited.filter((p) => p === '/webcam')).toHaveLength(1);
});
