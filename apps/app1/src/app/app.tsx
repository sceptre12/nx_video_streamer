import { useRef, useState } from 'react';
import { useConnectToVideo } from './hooks/useConnectToVideo';
import { useSocketConnection } from './hooks/useSocketConnection';

export interface MediaObjectType {
  video_id: string;
  start_time: number;
  is_streaming: boolean;
  stream: null | MediaStream;
  end_time: number;
  video_path: string;
}

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mediaObject, setMediaObject] = useState({
    video_id: '',
    start_time: -1,
    is_streaming: false,
    stream: null,
    end_time: -1,
    video_path: '',
  } as MediaObjectType);

  const { setIsVideoOn } = useConnectToVideo({
    videoRef,
    setMediaObject,
  });

  /**
   * Handles interacting with the socket channel
   */
  useSocketConnection({ mediaObject, videoRef, setMediaObject });

  console.log('mediaObject in app', mediaObject.is_streaming);

  return (
    <div className="container mx-auto">
      <div>
        <h1>Launch Webcam</h1>
        <p>
          This module will launch the webcam and start sending the webcam data
          to the server
        </p>
      </div>
      <div>
        <video id="webcam" ref={videoRef}></video>
      </div>
      <div>
        <button
          className="rounded-full px-2 shadow-md bg-lime-300"
          onClick={() => setIsVideoOn(true)}
        >
          Launch Stream
        </button>
        <button
          className="rounded-full px-2 shadow-md bg-red-500"
          onClick={() => setIsVideoOn(false)}
        >
          End Stream
        </button>
      </div>
    </div>
  );
}

export default App;
