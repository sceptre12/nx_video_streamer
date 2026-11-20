import { renderHook } from '@testing-library/react';
import { io } from 'socket.io-client';
import { toggleStreamingState } from '../api';
import { useSocketConnection } from './useSocketConnection';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('../api', () => ({ toggleStreamingState: jest.fn(async () => ({ error: null, data: true })) }));

describe('useSocketConnection', () => {
  const handlers: Record<string, () => void> = {};
  const socket = {
    on: jest.fn((event: string, fn: () => void) => {
      handlers[event] = fn;
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  let recorder: { ondataavailable?: (e: { data: { size: number } }) => void; start: jest.Mock; addEventListener: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    (io as unknown as jest.Mock).mockReturnValue(socket);
    recorder = { start: jest.fn(), addEventListener: jest.fn() };
    (global as unknown as { MediaRecorder: unknown }).MediaRecorder = jest.fn(() => recorder);
  });

  const props = () =>
    ({
      mediaObject: { stream: {}, video_id: 'vid', video_path: 'p', is_streaming: false, end_time: -1, start_time: 0 },
      videoRef: { current: null },
      setMediaObject: jest.fn(),
    } as unknown as Parameters<typeof useSocketConnection>[0]);

  it('opens the socket with credentials and emits the capture payloads', () => {
    const { unmount } = renderHook(() => useSocketConnection(props()));
    expect(io).toHaveBeenCalledWith({ path: '/socket.io', withCredentials: true });
    handlers['connect']();
    expect(socket.emit).toHaveBeenCalledWith('initalizeStream', { video_id: 'vid' });
    const chunk = { size: 5 };
    recorder.ondataavailable?.({ data: chunk });
    expect(socket.emit).toHaveBeenCalledWith('webcamVideoChunk', { video_chunk: chunk });
    unmount();
    expect(socket.emit).toHaveBeenCalledWith('endWebcamStream', { video_id: 'vid' }, expect.any(Function));
  });

  it('reports streaming state to the server', () => {
    const p = props();
    p.mediaObject.stream = null;
    p.mediaObject.is_streaming = true;
    renderHook(() => useSocketConnection(p));
    expect(toggleStreamingState).toHaveBeenCalledWith({ video_id: 'vid', has_started: true });
  });
});
