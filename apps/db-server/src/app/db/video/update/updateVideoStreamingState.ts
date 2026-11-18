import prismaClient from '../../prismaClient'


interface UpdateVideoStreamingStateParam {
  video_id: string;
  has_streaming_started: boolean;
  owner_id: string;
}

/**
 * Updates only where the owner matches. Returns the number of rows updated (0 = not found or not owned).
 * Prisma errors propagate to the caller.
 */
export const updateVideoStreamingState = async ({video_id, has_streaming_started, owner_id}: UpdateVideoStreamingStateParam) =>{
  if (!owner_id) return 0;
  const result = await prismaClient.video.updateMany({
    where: { video_id, owner_id },
    data: { is_streaming: has_streaming_started }
  })
  return result.count;
}
