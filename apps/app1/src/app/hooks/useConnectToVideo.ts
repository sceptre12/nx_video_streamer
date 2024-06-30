import { useEffect, useState } from "react";
import * as dayjs from 'dayjs';
import type {MediaObjectType} from '../app'
import type { RefObject } from "react";
import {createVideo} from '../api'



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

        videoRefCopy.muted = true;
        
        (async () => {
          const stream = await mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (isMounted) {
            if (stream) {
              videoRefCopy.srcObject = stream;
              videoRefCopy.addEventListener('loadedmetadata', async () => {
                if (videoRefCopy && isMounted) {
                  /**
                   * Store video info in db and prep everything for streaming
                   */
                  const {data, error} = await createVideo({video_id: stream.id ,start_time: dayjs().unix()});
                  if(error){
                    console.error(error);
                  }else if (data){
                    console.log("data",data);
                    // Update the media object with the info from the server
                    // Triggers the streaming event
                    setMediaObject((prevState )=> ({ 
                      ...prevState,
                      stream,
                      is_streaming: data.is_streaming,
                      video_id: data.video_id,
                      start_time: data.start_time,
                      video_path: data.video_path
                  }));
                  }
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
    console.log("HEREEEEE")
    const tracks = stream.getTracks();

    // Iterate through each track and stop them
    tracks.forEach((track) => {
      console.log("Track",track);
      track.stop();
    });

    // Set the video element src to null
    videoRef.srcObject = null;
  }
}