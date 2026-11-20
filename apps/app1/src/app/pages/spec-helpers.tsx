/// <reference types="jest" />
import './jsdom-polyfill';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../routes';

export const json = (status: number, body?: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response);

export const user = { version: 'v1', user_id: '1', username: 'alice' };
export const videos = [
  { video_id: 'v1', title: 'Demo one', duration_s: 5, thumbnail_url: null, stream_url: '/api/v1/video/v1/stream' },
];

/** Stubs global fetch by "METHOD path" key; unknown calls fail the test. */
export function stubFetch(routes: Record<string, Response>) {
  const mock = jest.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    if (!routes[key]) throw new Error(`unexpected fetch ${key}`);
    return routes[key];
  });
  (global as unknown as { fetch: jest.Mock }).fetch = mock;
  return mock;
}

export const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
