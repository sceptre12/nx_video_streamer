import { login, logout, getMe, getLibrary, createVideo, toggleStreamingState } from './index';

const jsonResponse = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response);

describe('app1 api client', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it('login posts relative url with credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { version: 'v1', user_id: '1', username: 'a' }));
    const res = await login({ username: 'a', password: 'password1' });
    expect(res.data?.username).toBe('a');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/auth/login');
    expect(init.credentials).toBe('include');
    expect(init.method).toBe('POST');
  });

  it('logout sends no content-type and handles 204', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));
    const res = await logout();
    expect(res.error).toBeNull();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/auth/logout');
    expect(init.credentials).toBe('include');
    expect(init.headers).toBeUndefined();
  });

  it('me and library use relative urls with credentials', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { version: 'v1', user_id: '1', username: 'a' }));
    await getMe();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { version: 'v1', videos: [{ video_id: 'v' }] }));
    const lib = await getLibrary();
    expect(lib.data).toHaveLength(1);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/v1/auth/me', '/api/v1/library']);
    fetchMock.mock.calls.forEach((c) => expect(c[1].credentials).toBe('include'));
  });

  it('surfaces the contract error code', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { version: 'v1', error: { code: 'invalid_credentials', message: 'bad' } })
    );
    const res = await login({ username: 'a', password: 'x' });
    expect((res.error as unknown as { code: string }).code).toBe('invalid_credentials');
    expect(res.data).toBeUndefined();
  });

  it('webcam calls use relative urls with credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));
    await createVideo({ video_id: 'v', start_time: 1 });
    await toggleStreamingState({ video_id: 'v', has_started: true });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/v1/video/create', '/api/v1/video/v']);
    fetchMock.mock.calls.forEach((c) => expect(c[1].credentials).toBe('include'));
  });
});
