import { ApiError, login, logout, getMe, getLibrary, createVideo, toggleStreamingState } from './index';

const jsonResponse = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response);

const TEST_PW = 'password1';

describe('app1 api client', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it('login posts relative url with credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { version: 'v1', user_id: '1', username: 'a' }));
    const res = await login({ username: 'a', password: TEST_PW });
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

  it('logout posts and reports success', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));
    const res = await logout();
    expect(res.data).toBe(true);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('logout surfaces a server failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { version: 'v1', error: { code: 'internal_error', message: 'boom' } }));
    const res = await logout();
    expect(res.data).toBeUndefined();
    expect((res.error as ApiError).status).toBe(500);
  });

  it('204 on a data call yields no data and no error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));
    const res = await getMe();
    expect(res.error).toBeNull();
    expect(res.data).toBeUndefined();
  });

  it('ApiError carries status and the default code for a non-JSON error body', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('not json');
      },
    } as unknown as Response);
    const res = await getMe();
    const err = res.error as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.code).toBe('unknown_error');
    expect(err.message).toContain('502');
  });

  it.each([400, 401, 404, 409])('createVideo and toggleStreamingState throw ApiError on %i', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { version: 'v1', error: { code: 'x_code', message: 'm' } }));
    const created = await createVideo({ video_id: 'v', start_time: 1 });
    const toggled = await toggleStreamingState({ video_id: 'v', has_started: true });
    for (const res of [created, toggled]) {
      expect(res.data).toBeUndefined();
      expect((res.error as ApiError).status).toBe(status);
      expect((res.error as ApiError).code).toBe('x_code');
    }
  });

  it('createVideo and toggleStreamingState keep their success shapes and bodies', async () => {
    const record = { video_id: 'v', start_time: 1, is_streaming: false, thumbnail_path: '', video_path: 'p' };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { version: 'v1', ...record }));
    const created = await createVideo({ video_id: 'v', start_time: 1 });
    expect(created.data?.video_path).toBe('p');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ video_id: 'v', start_time: 1 });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true }));
    const toggled = await toggleStreamingState({ video_id: 'v', has_started: true });
    expect(toggled.data).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ has_streaming_started: true });
  });
});
