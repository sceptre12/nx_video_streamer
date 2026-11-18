import Fastify from 'fastify';
import fastifyIO from "fastify-socket.io";
import type {Server} from 'socket.io';
import { app } from './app/app';
import { DB_SERVER_PORT } from '@globals/constants';
import { CaptureSession, openCaptureSession, writeCaptureChunk, closeCaptureSession } from './app/video_processor';
import { socketAuth } from './app/plugins/socketAuth';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : DB_SERVER_PORT;

// Contract runtime-env-ports: JWT_SECRET has no default, at least 32 bytes; refuse to start without it.
const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (Buffer.byteLength(JWT_SECRET) < 32) {
  console.error('JWT_SECRET is required (at least 32 bytes); refusing to start');
  process.exit(1);
}
const UI_HOST_PORT = process.env.UI_HOST_PORT || '36000';

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.register(app);
// // Registers socket service
server.register(fastifyIO, {
  cors: {
    origin: [`http://localhost:${UI_HOST_PORT}`],
    credentials: true,
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
  server.io.use(socketAuth(JWT_SECRET));
  server.io.on('connection', (socket)=>{
    // Capture state lives on this socket only; cleared on end and on disconnect.
    const user_id = socket.data.user_id as string;
    let session: CaptureSession | undefined;
    let opening = false;
    const clear = async () => {
      const s = session;
      session = undefined;
      await closeCaptureSession(s);
    };

    // @ts-expect-error socket.io event name is not in the typed event map
    socket.on('initalizeStream', async (data: {video_id?: unknown}, ack?: (r: unknown) => void) =>{
      // A client-sent video_path is ignored; the path is derived server-side from the owned video_id.
      // One open at a time per socket: an overlapping initalizeStream is rejected, so no WriteStream leaks.
      if (opening) {
        if (typeof ack === 'function') ack({ok: false, error: 'busy'});
        return;
      }
      opening = true;
      const opened_ref: {current?: CaptureSession} = {};
      try {
        await clear();
        const opened = await openCaptureSession(user_id, data?.video_id as string, () => {
          // Stream failed asynchronously: drop this session (if still current) and release the stream.
          if (session === opened_ref.current) void clear();
        });
        opened_ref.current = opened;
        if (!socket.connected) {
          // Disconnected while opening: the disconnect handler found no session, so close it here.
          await closeCaptureSession(opened);
          return;
        }
        session = opened;
        if (typeof ack === 'function') ack({ok: true});
      } catch (e) {
        const code = (e as {code?: string}).code ?? 'internal';
        if (typeof ack === 'function') ack({ok: false, error: code});
      } finally {
        opening = false;
      }
    })
    // @ts-expect-error socket.io event name is not in the typed event map
    socket.on('webcamVideoChunk', (data: {video_chunk?: unknown})=>{
      writeCaptureChunk(session, data?.video_chunk);
    })

    // @ts-expect-error socket.io event name is not in the typed event map
    socket.on('endWebcamStream', async (_data: unknown, ack?: (r: unknown) => void) =>{
      // Acts only on this socket's own stream (the video_id in the payload is not trusted).
      await clear();
      if (typeof ack === 'function') ack(true);
    })

    socket.on('disconnect', () => { void clear(); });
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