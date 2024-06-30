/**
 * This file handles CRUD request to
 * /api/v1/video
 */
import {createVideoOpts} from './video_schema'
import { FastifyInstance } from 'fastify';
import type {ICreateVideoBody} from './video_schema'
import { createVideo } from './../../../../grpc/services/createVideo';
import { errorHandler } from '../../../utils/errorHandler';
import type { CreateVideoResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/CreateVideoResponse';


export default async function(fastify: FastifyInstance) {
  

  fastify.post<{Body: ICreateVideoBody}>('/create',createVideoOpts, async (request, reply) =>{
    const {video_id, start_time } = request.body

    console.log("MEssage", request.body)
    
    const createVideoErrorHandler = errorHandler({reply});

    const sendSuccessMessageToClient = (response : CreateVideoResponse) => {
      console.log("How many timesss");
      try{
        reply.send({
          version: 'v1',
          ...response.results
        })
        console.log("ANY ISSUESSS")
      }catch(error) {
        console.log("WE SENDING ERRORRR");
        createVideoErrorHandler({error, handleByParent: true});
      }
    }

    // Create the video in the db server and respond to the client with the results
    await createVideo({
      requestObject: {
        video_id, start_time
      },
      callBack: sendSuccessMessageToClient,
      errorHandler: createVideoErrorHandler
    });
    
  })



  fastify.post('/:video_id', async (request,reply) =>{
    const {video_id} = request.params;
    // This can be expaneded over time
    const {has_streaming_started} = request.body

    
  })
}