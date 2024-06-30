import { PrismaClient } from '@prisma/client'

/**
 * Sets the defualt configs for prisma and creates a singelton within the db server
 * @returns 
 */
const launchPrismaClient = () =>{
  console.log("launching Db client")
  const prisma = new PrismaClient();

  console.log("Db client launched")

  return prisma;
}

export default launchPrismaClient()