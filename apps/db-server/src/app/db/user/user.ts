import prismaClient from '../prismaClient'

// Prisma errors propagate to the gRPC handler, which maps them to a status code.

export const createUser = (username: string, password_hash: string) =>
  prismaClient.user.create({
    data: { username, password_hash, created_at: BigInt(Date.now()) }
  })

export const getUserByUsername = (username: string) =>
  prismaClient.user.findUnique({ where: { username } })

export const getUserById = (user_id: string) =>
  prismaClient.user.findUnique({ where: { user_id } })
