import { useEffect, useState } from "react";
import * as dayjs from 'dayjs';
import type {MediaObjectType} from '../app'
import type { RefObject } from "react";



export interface useConnectToVideoProps{
  videoRef: RefObject<HTMLVideoElement>;
  setMediaObject: React.Dispatch<React.SetStateAction<MediaObjectType>>
}

export const useConnectToVideo = ({videoRef, setMediaObject}: useConnectToVideoProps) =>{
  const [isVideoOn, setIsVideoOn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const videoRefCopy = videoRef.current;

    if (videoRefCopy) {
      if (isVideoOn) {
        const mediaDevices = navigator.mediaDevices;

        // videoRefCopy.muted = true;
        
        (async () => {
          const stream = await mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (isMounted) {
            if (stream) {
              videoRefCopy.srcObject = stream;
              videoRefCopy.addEventListener('loadedmetadata', () => {
                if (videoRefCopy && isMounted) {
                  videoRefCopy.play();
                  setMediaObject((prevState )=> ({ 
                    ...prevState,
                    is_streaming: true,
                    video_id: stream.id,
                    start_time: dayjs().unix(),
                  }));
                }
              });
            }
          }
        })();
      }
    }

    return () => {
      isMounted = false;
      if(isVideoOn && videoRefCopy?.srcObject){
        cleanUpVideo(videoRefCopy)
        setMediaObject((prevState )=> ({ 
          ...prevState,
          is_streaming: false,
          end_time: dayjs().unix(),
        }))
      }
    };
  }, [isVideoOn, videoRef, setMediaObject]);


  return {
    setIsVideoOn
  }
}

/**
 * Cuts of the stream for the video and audo track
 * @param videoRef 
 */
function cleanUpVideo(videoRef: HTMLVideoElement ){
  // We're turning off the video
  const stream = videoRef.srcObject as MediaStream;
  if (stream) {
    const tracks = stream.getTracks();

    // Iterate through each track and stop them
    tracks.forEach((track) => {
      track.stop();
    });

    // Set the video element src to null
    videoRef.srcObject = null;
  }
}