import { updateVideoStreamingState } from '../../db/video/update/updateVideoStreamingState'
import type { DbComServiceHandlers } from "protos/libs/gen/protobuf-types/src/video/v1/DbComService"


export const handleUpdatingStreamingState:DbComServiceHandlers['UpdateVideoStreamingState'] = async (call, callBack ) =>{
  // The typings have the wrong format
  // @ts-ignore
  const {video_id, has_streaming_started} = call.request
  console.log("handleUpdatingStreamingState MSG", call.request);
  if(video_id){
    
    /**
     * Update the video table to indicate if streaming has started or stopped
     */
    await updateVideoStreamingState({
      video_id,
      has_streaming_started
    });

    try{
      /**
       * Respond back to the client indicating the table was updated successfully
       */
      
      callBack(null, {
        // @ts-ignore
        update_complete: true
      });
    }catch(e){
      console.error(e);
    }
  }else{
    // Throw error invalid message or something
    console.error("Invalid message sent through handleUpdatingStreamingState")
  }
}