import prismaClient from '../../prismaClient'


interface UpdateVideoStreamingStateParam {
  video_id: string;
  has_streaming_started: boolean;
}

export const updateVideoStreamingState = async ({video_id, has_streaming_started}: UpdateVideoStreamingStateParam) =>{
  try{
    await prismaClient.video.update({
      where: {
        video_id
      },
      data: {
        is_streaming: has_streaming_started
      }
    })
  }catch(error){
    console.log("ERRORRR")
    // TODO create common error errorHandler
    // This error never gets send to the user but logged to 
    // analytics service
    console.error(error, video_id);
  }
}