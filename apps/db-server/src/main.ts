import Fastify from 'fastify';
import fastifyIO from "fastify-socket.io";
import type {Server} from 'socket.io';
import { app } from './app/app';
import { DB_SERVER_PORT } from '@globals/constants';
import { createWriteSteamInstance, closeWriteStreamInstance, streamVideoToStorage } from './app/video_processor';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : DB_SERVER_PORT;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.register(app);
// // Registers socket service
server.register(fastifyIO, {
  cors: {
    origin: `*`,
  }
});



server.ready().then(() =>{
  // Launches db client
  try{
    (async () =>{
      // Ts file is converted to js
      await import('./app/db/prismaClient.js')
    })()
  }catch(error) {
    console.error(error);
  }

  // Launches grpc service
  try{
    (async () =>{
      await import ('./app/grpc/index.js')
    })()
  }catch(e){
    console.error(e);
  }
  /**
   * Everything below can be organized better
   * Currently going with design for speed
   * 
   * Things I'd do better
   * move channel names that are being shared between UI apps and servers into a more global constants file
   * Move the set up of the socket connections to a separate file
   * Create namespace so that multiple ui's could set up streaming. 
   * Create a better state managment feature for determing if a stream is active or not
   */
  server.io.on('connection', (socket)=>{
    console.info("Socket connected!", socket.id)
    // @ts-ignore
    socket.on('initalizeStream', (data) =>{
      // Create a write stream based on client video path
      console.log("Creating write stream", data);
      createWriteSteamInstance(data.video_path);
    })
    // @ts-ignore
    socket.on('webcamVideoChunk', (data)=>{
      console.log("Streaming video");
      streamVideoToStorage({video_chunk: data.video_chunk});
    })

    // @ts-ignore
    socket.on('endWebcamStream', (data, ack) =>{
      // End the stream.. additional data is provided for more clean up operations
      console.log("Closing write stream")
      closeWriteStreamInstance();
      // indicates to the client the write stream has been closed
      ack(true);
    })
  });
})

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});

declare module "fastify" {
  interface FastifyInstance {
    io: Server<object>;
  }
}