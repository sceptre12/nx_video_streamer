import type { ServiceError } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import type { ErrorResponseParam } from '../../routes/utils/errorHandler';

export type UnaryMethod = (request: object, cb: (err: ServiceError | null, response?: unknown) => void) => unknown;

export interface UnaryParams<Req, Res> {
  requestObject: Req;
  callBack: (arg: Res) => void;
  errorHandler: (arg: ErrorResponseParam) => void;
}

/** HTTP code for the gRPC statuses of contracts/grpc-db.md; anything else is left to the error handler (500). */
export const httpCodeFor = (code: number | undefined): number | undefined => {
  switch (code) {
    case status.NOT_FOUND: return 404;
    case status.ALREADY_EXISTS: return 409;
    case status.INVALID_ARGUMENT: return 400;
    default: return undefined;
  }
};

/**
 * Shared unary call: runs `method`, maps the raw response with `fromRaw`, hands the result to
 * callBack and resolves with it; a gRPC error goes to errorHandler (with an HTTP `code` for
 * NOT_FOUND, ALREADY_EXISTS, INVALID_ARGUMENT) and resolves with null.
 */
export const callUnary = <Req extends object, Res>(
  method: UnaryMethod,
  fromRaw: (raw: unknown) => Res,
  { requestObject, callBack, errorHandler }: UnaryParams<Req, Res>
): Promise<Res | null> =>
  new Promise((resolve) => {
    try {
      method(requestObject, (err, response) => {
        if (err) {
          errorHandler({ error: err, code: httpCodeFor(err.code) });
          resolve(null);
          return;
        }
        try {
          const result = fromRaw(response);
          callBack(result);
          resolve(result);
        } catch (error) {
          errorHandler({ error: error as Error });
          resolve(null);
        }
      });
    } catch (error) {
      errorHandler({ error: error as Error });
      resolve(null);
    }
  });
