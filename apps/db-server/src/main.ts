import Fastify from 'fastify';
import fastifyIO from "fastify-socket.io";
import type {Server} from 'socket.io';
import { app } from './app/app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.register(app);
// Registers socket service
server.register(fastifyIO);



server.ready().then(() =>{
  server.io.on('connection', (socket)=>{
    console.info("Socket connected!", socket.id)
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