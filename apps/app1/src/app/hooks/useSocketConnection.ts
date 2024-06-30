import { useEffect, useState} from "react"
import { io } from 'socket.io-client';
import type {Socket} from 'socket.io-client'
import type { MediaObjectType } from "../app";
import type {RefObject} from "react";
import { DB_SERVER_PORT } from "@globals/constants";
import * as dayjs from 'dayjs';
import { setStreamingHasStarted } from "../api";
import type { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface useSocketConnectionParams{
  mediaObject: MediaObjectType;
  videoRef: RefObject<HTMLVideoElement>;
  setMediaObject: React.Dispatch<React.SetStateAction<MediaObjectType>>
}

const SERVER_DOMAIN = `http://localhost:${DB_SERVER_PORT}`

export const useSocketConnection = ({mediaObject,videoRef, setMediaObject }: useSocketConnectionParams) =>{

  console.log("Rerenders");

  const [socketConnection, setSocketConnect] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);

  /**
   * Handles opening up a socket connect
   */
  useEffect(()=>{
    console.log("Socket connection useEffect")
    if(!socketConnection && mediaObject.stream){
      try{
        setSocketConnect(io(SERVER_DOMAIN));
      }catch(e){
        console.error(e);
      }
    }

    // Close out stream connection
    return () =>{
      console.log("OKAY WHEN ", mediaObject.stream);
      if(socketConnection && mediaObject.stream){
        console.log("Closing socket connection");
        // End the current stream going on

        socketConnection.emit('endWebcamStream', {
          video_id: mediaObject.video_id,
          video_path: mediaObject.video_path
        }, (canClose: boolean)=>{
          // Waiting on the servers acknowledgment to close this useSocketConnection
          if(canClose){
            socketConnection.disconnect();
            setSocketConnect(null);
            console.log("Ending closing socket connection");
          }else{
            throw new Error("Unable to close write stream");
          }
        });
        
      }
      
    }
  },[mediaObject.stream,mediaObject.video_id,mediaObject.video_path, socketConnection, setSocketConnect])


  /**
   * Handles notify the app server that the streaming process has started
   */
  useEffect(()=>{
    if(mediaObject.is_streaming){
      // send fetch request with video id indicating streaming has started
      console.log("Sending isStreaming to db");
      (async ()=>{
        await setStreamingHasStarted({video_id: mediaObject.video_id, has_started: true});
      })()
    }else if (mediaObject.end_time !== -1 && !mediaObject.is_streaming) {
      // send fetch request with video id indicating streaming has stopped
      console.log("Indicating to the db the streaming has ended");
      (async ()=>{
        await setStreamingHasStarted({video_id: mediaObject.video_id, has_started: false});
      })()
    }
  }, [mediaObject.is_streaming,mediaObject.end_time, mediaObject.video_id])


  // Handles streaming video to server
  useEffect(()=>{
    let isMounted = true;
    
    let mediaRecorder: MediaRecorder | null = null; 
    

    if(mediaObject.stream && socketConnection){
      // Create socket conection
      try{
        console.log("Setting up socket connection")
        // Setting up streaming connection to server
        socketConnection.on('connect', () =>{
          if(isMounted && mediaObject.stream && socketConnection){

            console.log("Connected to socket");

            // Start prepping server for the stream
            socketConnection.emit('initalizeStream', {
                video_id: mediaObject.video_id,
                video_path: mediaObject.video_path
            });
            
            // Indicate to the apps server that the stream has started
            setMediaObject((previousState)=>({
              ...previousState,
              is_streaming: true
            }));
            
            
            // Lets get the video chunks and send them through socket Io 
            // Use a MediaRecorder to capture video chunks
            mediaRecorder = new MediaRecorder(mediaObject.stream);

            mediaRecorder.ondataavailable = event => {
              // Event.data contains the Blob of recorded video data
              if (socketConnection && event.data.size > 0) {
                // Send the Blob data via Socket.IO
                console.log("emmitting event")
                socketConnection.emit('webcamVideoChunk', {
                  video_chunk: event.data,
                  video_id: mediaObject.video_id,
                  video_path: mediaObject.video_path
                });
              }
            };

            // I need to check to see if videoRef is needed
            if(videoRef.current){
              videoRef.current.play();
            }
            /**
             * Sets the chunk size that will be sent to the server
             */
            mediaRecorder.start(1000);


            mediaRecorder.addEventListener('stop',() =>{
              console.log("Detected video stopped");
              setMediaObject((prevState )=> ({ 
                ...prevState,
                is_streaming: false,
                stream: null,
                end_time: dayjs().unix(),
              }))
            });
          }
        })
      }catch(e){
        console.error(e);
      }
    }

    return () =>{
      isMounted = false;
      console.log("Unmounting component")
    }
  },[mediaObject.stream, mediaObject.video_id, mediaObject.video_path, videoRef, setMediaObject, socketConnection])


}