import type { FastifyReply, RawServerDefault, RouteGenericInterface, FastifySchema, FastifyTypeProviderDefault } from "fastify"
import type { IncomingMessage, ServerResponse } from "http"

interface ErrorHandlerParam {
  reply: FastifyReply<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, RouteGenericInterface, unknown, FastifySchema, FastifyTypeProviderDefault, unknown>
}

export interface ErrorResponseParam {
  error: Error,
  code?: number,
  handleByParent?: boolean
}


export const errorHandler = ({reply}: ErrorHandlerParam) => ({error, code, handleByParent}: ErrorResponseParam) =>{
  let finalReply = reply
  
  // Let main error handler address this issue
  if(handleByParent){
    finalReply.send(error);
    return;
  }

  // Potentiall a custom error

  if(code){
    finalReply = finalReply.status(code)
  }else{
    finalReply = finalReply.status(500)
  }

  finalReply.send({
    error,
    ok:false
  })

}