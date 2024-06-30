import Fastify from 'fastify';
import { app } from './app/app';
// import "./app/grpc";

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3002;

// Instantiate Fastify with some config
const server = Fastify({
  logger: {
    level: 'info',
  },
});

// Register your application as a normal plugin.
server.register(app);

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});