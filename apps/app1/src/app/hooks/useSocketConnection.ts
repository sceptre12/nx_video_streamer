import { useEffect, useState} from "react"
import { io } from 'socket.io-client';
import type {Socket} from 'socket.io-client'
import type { MediaObjectType } from "../app";
import type {RefObject} from "react";

export interface useSocketConnectionParams{
  mediaObject: MediaObjectType;
  videoRef: RefObject<HTMLVideoElement>;
}

interface SocketConnectionState{
  isActive: boolean;
  socketConnection: Socket | null
}

const useSocketConnection = ({mediaObject,videoRef }: useSocketConnectionParams) =>{

  // TODO pull this info from some global config
  // TODO use nx to create a global library thats shared 
  const SERVER_DOMAIN = 'http://localhost:3000'

  const [socktConnectionState, setSocketConnectionState] = useState({
    isActive: false,
    socketConnection: null,
  } as SocketConnectionState)

  const [videoInfo, setVideoInfo] = useState({
    thumbnail_path: '',
    video_path: '',
    video_id: ''
  })

  // Handles the creation and destruction of the socket connection state
  useEffect(()=>{
    // Indicates we're just launching the video
    if(mediaObject.video_id && mediaObject.end_time === -1 && !socktConnectionState.socketConnection){
      /**
       * Before we can create the socket connection we need to kick of some actions in the server.
       * 
       * 1. We need to send a post request to app-server
       * 2. app-server - will respond with:
       * {
       *  thumbnail_path,
       *  video_path,
       *  video_id
       * }
       * 3. We store that info into videoInfo state
       */


      // Create socket conection
      try{
        setSocketConnectionState((prev) => ({
          ...prev,
          socketConnection: io(SERVER_DOMAIN)
        }))
      }catch(e){
        console.error(e);
      }
    }else if (mediaObject.video_id && mediaObject.end_time){
      // Closing the socket connection
      try{
        socktConnectionState.socketConnection?.close()
      }catch (e){
        console.error(e);
      }
    }
  },[mediaObject, socktConnectionState.socketConnection])


  useEffect(()=>{
    if(!socktConnectionState.isActive && socktConnectionState.socketConnection){
      // Kicking off event listeners
      socktConnectionState.socketConnection.on('connect', () =>{
        if(!socktConnectionState.isActive){
          // We know we're active now
          setSocketConnectionState((prev) => ({
            ...prev,
            isActive: true
          }))
          console.log("Socket id", socktConnectionState.socketConnection);
        }
      })
    }else if (socktConnectionState.isActive) {
      // Where we do our streaming
      console.log("Streaming should occur")
    }
  },[socktConnectionState])

}