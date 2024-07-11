import videoGrpcClient from '../index'
import { ErrorResponseParam } from '../../routes/utils/errorHandler';
import { UpdateVideoStreamingStateResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/UpdateVideoStreamingStateResponse';



interface UpdateVideoStreamingStateParams {
  requestObject: {
    video_id: string;
    has_streaming_started: boolean;
  },
  callBack: (arg: UpdateVideoStreamingStateResponse) => void,
  errorHandler: (arg: ErrorResponseParam) => void
}

/**
 * Sends a message through the grpc service to the db server to create a new video record.
 * The response will contain more information for where the db server is going to store the video 
 * and store the video thumbnail
 * @param param0 
 */
export const updateVideoStreamingState = async ({requestObject: {video_id, has_streaming_started},callBack, errorHandler}: UpdateVideoStreamingStateParams) =>{
  return new Promise((resolve,reject) =>{
    try{
      videoGrpcClient.UpdateVideoStreamingState({
        /**
         * The reason there's a differnece in keys for the message is due to how the protobufs are
         * being generated. I need to make sure the generated output keeps the snake_case
         * The typings for the protobufs have the wrong format
         */
        // @ts-ignore
        video_id, has_streaming_started
      }, (err, response) =>{
        if(err){
          console.log("updateVideoStreamingState e1",err);
          errorHandler({error: err});
          return;
        }
        // @ts-ignore
        const {update_complete} = response
        try{
          callBack({
            // @ts-ignore
            update_complete
          });
          resolve(null);
        }catch(error){
          console.log("updateVideoStreamingState e2",error)
          errorHandler({error});
        } 
      });
    }catch (error){
      console.log("updateVideoStreamingState e3",error);
      errorHandler({error})
      reject(error);
    }
  })  
}