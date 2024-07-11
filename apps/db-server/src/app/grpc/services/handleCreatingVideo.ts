/**
 * This file handles responding to the request to create a new video
 * 1. A request is received with a video id and the start time
 * 2. Since its just one person using it.. We won't focus on optimizing the folder structure atm 
 * 3. In the storage folder we will create a folder based on the video id. This folder will contain
 *  the video file and an imageThumbnail.
 * 4 After the location is created, file paths and the info from the initial request will be stored in the db.
 * 5. We will then send a response through the service with the updated info.
 * 6. That hand handles the communication portion of things.
 * 7. In the background a process will be kicked off that can capture a thumbnail and store that in the thumbnail location
 **/
import {access, constants, mkdir} from 'node:fs/promises'
import path from 'path'
import { createVideo } from '../../db/video/create/createVideo'
import { STORAGE_PATH } from '../../utils/constants'
import type { DbComServiceHandlers } from "protos/libs/gen/protobuf-types/src/video/v1/DbComService"


export const handleCreatingVideoService:DbComServiceHandlers['CreateVideo'] = async (call, callBack ) =>{
  // The typings have the wrong format
  // @ts-ignore
  const {video_id, start_time} = call.request
  console.log("handleCreatingVideoService MSG", call.request);
  if(video_id && start_time){
    // Check if the folder exists already
    const videoFolderPath = path.join(STORAGE_PATH, video_id);
    let clashOccurred = false;
    try{
      await access(videoFolderPath, constants.R_OK | constants.W_OK)
      /**
       * Ideally clashes shouldn't be happening for videos
       * if a class occurs I'll make a change but this is all for learning 
       */
      clashOccurred = true;
    }catch(_){
      // The folder doesn't exist lets create it
      console.log("Making folder", videoFolderPath);
      await mkdir(videoFolderPath);
    }
    // Check if folder clash occurred 
    if(clashOccurred){
      throw new Error("CLASSH OCCURRED");
    }

    // The video file name will be the name of the id.
    // the thumbnail file will have the name thumbnail_video_id

    const fullVideoPath = path.join(videoFolderPath, video_id + '.mp4');
    const fullThumbnailpath = path.join(videoFolderPath, `thumbnail_${video_id}.webp`);

    console.log("We creating video", {
      video_id,
      start_time,
      videoPath: fullVideoPath,
      thumbnailPath: fullThumbnailpath,
    });
    /**
     * Store request and paths inside of the db
     */
    await createVideo({
      video_id: video_id,
      start_time: start_time,
      video_path: fullVideoPath,
      thumbnail_path: fullThumbnailpath,
      is_streaming: false
    });

    try{
      /**
       * Respond back to the client with the full paths
       */
      
      callBack(null, {results: {
        // @ts-ignore
        video_id,
        start_time,
        is_streaming: false,// False until the socket connection has been establised
        video_path: fullVideoPath,
        thumbnail_path: fullThumbnailpath,
      }});
    }catch(e){
      console.error(e);
    }

    // TODO handle creating thumbnail


  }else{
    // Throw error invalid message or soemthing
    console.error("Invalid message sent through CreateVideoService")
  }
}