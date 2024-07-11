/**
 * This file handles CRUD request to
 * /api/v1/video
 */
import {createVideoOpts, updateVideoStreamingStateOpts} from './video_schema'
import { FastifyInstance } from 'fastify';
import type {ICreateVideoBody, IUpdateVideoStreamingStateBody, IUpdateVideoStreamingStateParams} from './video_schema'
import { createVideo, updateVideoStreamingState } from './../../../../grpc/services';
import { errorHandler } from '../../../utils/errorHandler';
import type { CreateVideoResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/CreateVideoResponse';
import type { UpdateVideoStreamingStateResponse } from 'protos/libs/gen/protobuf-types/src/video/v1/UpdateVideoStreamingStateResponse';


export default async function(fastify: FastifyInstance) {

  fastify.post<{Body: ICreateVideoBody}>('/create',createVideoOpts, async (request, reply) =>{
    const {video_id, start_time } = request.body

    console.log("CREATE SOMETHING")
    
    const createVideoErrorHandler = errorHandler({reply});

    const sendSuccessMessageToClient = (response : CreateVideoResponse) => {
      try{
        reply.send({
          version: 'v1',
          ...response.results
        })
      }catch(error) {
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



  fastify.post<{Body: IUpdateVideoStreamingStateBody, Params: IUpdateVideoStreamingStateParams }>('/:video_id',updateVideoStreamingStateOpts, async (request,reply) =>{
    const {video_id} = request.params;
    // This can be expaneded over time
    const {has_streaming_started} = request.body

    console.log("UPDATED SOMETHING")

    const updateVideoStreamHandler = errorHandler({reply});


    const sendSuccessMessageToClient = (response : UpdateVideoStreamingStateResponse) => {
      try{
        reply.send({
          version: 'v1',
          ...response
        })
      }catch(error) {
        updateVideoStreamHandler({error, handleByParent: true});
      }
    }

    await updateVideoStreamingState({
      requestObject: {
        video_id,
        has_streaming_started
      },
      callBack: sendSuccessMessageToClient,
      errorHandler: updateVideoStreamHandler
    })
  })
}