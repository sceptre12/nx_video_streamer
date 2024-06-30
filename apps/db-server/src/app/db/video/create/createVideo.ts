import prismaClient from '../../prismaClient'


interface CreateVideoParam {
  video_id: string;
  start_time: number;
  thumbnail_path: string;
  video_path: string;
  is_streaming: boolean;
}

export const createVideo = async ({video_id, start_time,thumbnail_path, video_path, is_streaming}: CreateVideoParam) =>{
  try{
    await prismaClient.video.create({
      data: {
        video_id, start_time,thumbnail_path, video_path, is_streaming
      }
    })
  }catch(error){
    // TODO create common error errorHandler
    // This error never gets send to the user but logged to 
    // analytics service
    console.error(error);
  }
}