import { fireEvent, screen } from '@testing-library/react';
import { json, renderAt, stubFetch, user, videos } from './spec-helpers';

jest.mock('./webcam', () => ({ __esModule: true, default: () => null }));

it('login with correct credentials shows the library and logs no password', async () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  stubFetch({
    'GET /api/v1/auth/me': json(401, { version: 'v1', error: { code: 'unauthorized', message: 'no session' } }),
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
