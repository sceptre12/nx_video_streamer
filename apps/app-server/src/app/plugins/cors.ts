import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors'


export default fp(async function (fastify: FastifyInstance) {
  console.log("ORRRDERRR CORS")
  fastify.register(cors, {
    origin: (origin, cb) =>{
      console.log("Origina CORS")
      const hostname = new URL(origin).hostname
      if(hostname === "localhost"){
        //  Request from localhost will pass
        cb(null, true)
        return
      }
      // Generate an error on other origins, disabling access
      cb(new Error("Not allowed"), false)
    },
  });
});
