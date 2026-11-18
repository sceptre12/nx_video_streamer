import Fastify, { FastifyInstance } from 'fastify';
import { app } from './app';

describe('GET /', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = Fastify();
    server.register(app);
  });

  afterEach(async () => {
    await server.close();
  });

  it('should respond with a message', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
      headers: { origin: 'http://localhost:36000' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Hello API' });
  });
});
