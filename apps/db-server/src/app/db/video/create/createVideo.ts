import prismaClient from '../../prismaClient'

interface CreateVideoParam {
  video_id: string;
  start_time: number;
  thumbnail_path: string;
  video_path: string;
  is_streaming: boolean;
  owner_id?: string;
}

/**
 * Creates the row, then runs `afterCreate` inside the same transaction, so a failing
 * side effect (the folder creation) rolls the row back. Errors propagate to the caller.
 */
export const createVideo = async (
  {video_id, start_time, thumbnail_path, video_path, is_streaming, owner_id}: CreateVideoParam,
  afterCreate?: () => Promise<void>
) =>{
  return prismaClient.$transaction(async (tx) => {
    const row = await tx.video.create({
      data: {
        video_id,
        start_time: BigInt(start_time),
        thumbnail_path,
        video_path,
        is_streaming,
        owner_id: owner_id || null
      }
    })
    if (afterCreate) await afterCreate();
    return row;
  })
}
