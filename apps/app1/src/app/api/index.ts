import { APP_SERVER_PORT } from "@globals/constants"
import { resolveJson } from "@nx-video-streamer/globals"


interface ApiResponse<T>{
  error: null | Error;
  data: T | undefined
}

interface CreateVideoParams {
  video_id: string;
  start_time: number;
}

const API_VERSION = 'v1';

export interface VideoItem {
  video_id: string;
  start_time: number;
  is_streaming: boolean;
  thumbnail_path: string;
  video_path: string;
}

export const createVideo = async ({video_id, start_time}: CreateVideoParams): Promise<ApiResponse<VideoItem>> => {
  try{
    const result = await resolveJson<VideoItem>(fetch(`http://localhost:${APP_SERVER_PORT}/api/${API_VERSION}/video/create`,{
      method: 'POST',
      body: JSON.stringify({
        video_id,
        start_time
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }))

    return {
      error: null,
      data: result
    }
  }catch(error){
    return {
      error: error as Error,
      data: undefined
    }
  }
}


export const toggleStreamingState = async({video_id, has_started}: {video_id: string, has_started: boolean}):Promise<ApiResponse<boolean>> => {
  try{
    const result = await resolveJson<{success: boolean}>(fetch(`http://localhost:${APP_SERVER_PORT}/api/${API_VERSION}/video/${video_id}`,{
      method: 'POST',
      body: JSON.stringify({
        has_streaming_started: has_started
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }))

    if(result){
      return {
        error: null,
        data: result.success
      }
    }
    throw new Error("Server did not return any result");
  }catch(error){
    return {
      error: error as Error,
      data: undefined
    }
  }
}