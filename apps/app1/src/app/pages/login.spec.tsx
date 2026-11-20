import { fireEvent, screen } from '@testing-library/react';
import { json, renderAt, stubFetch } from './spec-helpers';

jest.mock('./webcam', () => ({ __esModule: true, default: () => null }));

it('wrong password shows an error and no library', async () => {
  stubFetch({
    'GET /api/v1/auth/me': json(401, { version: 'v1', error: { code: 'unauthorized', message: 'no session' } }),
    'POST /api/v1/auth/login': json(401, { version: 'v1', error: { code: 'invalid_credentials', message: 'Invalid username or password' } }),
  });
  renderAt('/login');
  fireEvent.change(await screen.findByLabelText('Username'), { target: { value: 'alice' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Invalid username or password');
  expect(screen.queryByText('Library')).toBeNull();
});
