import type { CreateVideoResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/CreateVideoResponse';
import videoGrpcClient from '../index'
import { ErrorResponseParam } from '../../routes/utils/errorHandler';



interface CreateVideoParams {
  requestObject: {
    video_id: string;
    start_time: number;
  },
  callBack: (arg: CreateVideoResponse) => void,
  errorHandler: (arg: ErrorResponseParam) => void
}

/**
 * Sends a message through the grpc service to the db server to create a new video record.
 * The response will contain more information for where the db server is going to store the video 
 * and store the video thumbnail
 * @param param0 
 */
export const createVideo = async ({requestObject: {video_id, start_time},callBack, errorHandler}: CreateVideoParams) =>{
  return new Promise((resolve,reject) =>{
    try{
      videoGrpcClient.CreateVideo({
        /**
         * The reason there's a differnece in keys for the message is due to how the protobufs are
         * being generated. I need to make sure the generated output keeps the snake_case
         * The typings for the protobufs have the wrong format
         */
        // @ts-ignore
        video_id: video_id, start_time: start_time
      }, (err, response) =>{
        if(err){
          errorHandler({error: err});
          return;
        }
        // @ts-ignore
        const {is_streaming, video_path, thumbnail_path } = response.results
        try{
          console.log("REsponse",response);
          callBack({
            results: {
              // @ts-ignore
              video_id, start_time,
              is_streaming, video_path, thumbnail_path
            }
          });
          resolve(null);
        }catch(error){
          errorHandler({error});
        } 
      });
    }catch (error){
      errorHandler({error})
      reject(error);
    }
  })  
}