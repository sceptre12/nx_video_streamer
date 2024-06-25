import { useRef, useState } from 'react';
import { useConnectToVideo } from './hooks/useConnectToVideo';

export interface MediaObjectType {
  video_id: string;
  start_time: number;
  is_streaming: boolean;
  end_time: number;
}

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mediaObject, setMediaObject] = useState({
    video_id: '',
    start_time: -1,
    is_streaming: false,
    end_time: -1,
  } as MediaObjectType);

  const { setIsVideoOn } = useConnectToVideo({
    videoRef,
    setMediaObject,
  });

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
