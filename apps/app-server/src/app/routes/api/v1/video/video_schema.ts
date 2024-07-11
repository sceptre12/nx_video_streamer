import type { RouteShorthandOptions } from 'fastify';

/**
 * There are libraries out there that simplify this process but
 * setting them up for this work is something I can do later
 */
export interface ICreateVideoBody{
  video_id: string;
  start_time: number;
}


export const createVideoOpts: RouteShorthandOptions = {
  schema:{
    body: {
      type: 'object',
      properties: {
        video_id:  {type: 'string'},
        start_time: {type: 'number'}
      },
      required: ['video_id','start_time']
    }
  }
}

export interface IUpdateVideoStreamingStateBody{
  has_streaming_started: boolean;
}

export interface IUpdateVideoStreamingStateParams{
  video_id: string;
}

export const updateVideoStreamingStateOpts: RouteShorthandOptions = {
  schema: {
    body: {
      type: 'object',
      properties: {
        has_streaming_started: {type: 'boolean'}
      },
      required: ['has_streaming_started']
    },
    params: {
      type: 'object',
      properties: {
        video_id: {type: 'string'}
      },
      required: ['video_id']
    }
  }
}