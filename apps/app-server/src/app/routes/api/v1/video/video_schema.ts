import type { RouteShorthandOptions } from 'fastify';

/** video_id shape shared by the create body and the update path (contracts/api-http.md). */
export const VIDEO_ID_PATTERN = '^[A-Za-z0-9_-]{1,64}$';

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
        video_id:  {type: 'string', pattern: VIDEO_ID_PATTERN},
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
        video_id: {type: 'string', pattern: VIDEO_ID_PATTERN}
      },
      required: ['video_id']
    }
  }
}