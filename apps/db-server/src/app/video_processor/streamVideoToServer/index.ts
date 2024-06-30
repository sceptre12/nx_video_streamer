import { STORAGE_PATH } from "../../utils/constants";
import { WriteStream, createWriteStream } from "fs";

interface StreamVideoToStorageParams {
  video_id?: string;
  video_path?: string;
  video_chunk: Blob;
}

interface StreamStateManagerType {
  is_stream_active: boolean;
  current_stream: null | WriteStream
}

/**
 * I will be storing the state of whether the steam is open or not here.
 * Normally I would have the client initate the creation of a room where the 
 * state would be defined and then the streaming can start but diving into that now
 * would take too much time. 
 * 
 * TODO create rooms where the setup process for a room would init the writeStream
 * this process would also be more scalable
 */
export const STREAM_STATE_MANAGER: StreamStateManagerType = {
  is_stream_active: false,
  current_stream: null
}


export const createWriteSteamInstance = (path: string) =>{
  if(!STREAM_STATE_MANAGER.is_stream_active){
    if(path.includes(STORAGE_PATH)){
      STREAM_STATE_MANAGER.current_stream = createWriteStream(path)
    }else{
      throw new Error("Invalid Path");
    }
  }
} 

export const closeWriteStreamInstance = () =>{
  if(STREAM_STATE_MANAGER.is_stream_active){
    STREAM_STATE_MANAGER.current_stream.end();
  }
}

/**
 * 
 * @param param0 
 */
export const streamVideoToStorage = ({video_id, video_path, video_chunk}:StreamVideoToStorageParams) => {
  if(STREAM_STATE_MANAGER.current_stream){
    console.log("WRITTING");
    STREAM_STATE_MANAGER.current_stream.write(video_chunk);
  }
}

