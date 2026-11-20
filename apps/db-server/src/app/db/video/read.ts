import prismaClient from '../prismaClient'

// Owner-filtered reads: rows with owner_id NULL never match a non-empty owner id.

export const listVideosByOwner = (owner_id: string) =>
  owner_id
    ? prismaClient.video.findMany({ where: { owner_id }, orderBy: { start_time: 'desc' } })
    : Promise.resolve([])

export const getVideoForOwner = (video_id: string, owner_id: string) =>
  owner_id
    ? prismaClient.video.findFirst({ where: { video_id, owner_id } })
    : Promise.resolve(null)
