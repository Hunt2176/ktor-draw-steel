import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Thrown by route handlers to produce a specific HTTP status + JSON error. */
export class HttpError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (msg = 'Invalid request') => new HttpError(400, msg);
export const notFound = (msg = 'Entity not found') => new HttpError(404, msg);

/** Mirrors Kotlin's `error("...")` (an IllegalStateException → HTTP 500). */
export const fail = (msg: string) => new HttpError(500, msg);

/** Parse a route `:id` param to an int, or throw 400 like the original routes. */
export function parseId(value: string | undefined): number {
  const id = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(id)) {
    throw badRequest('Invalid ID');
  }
  return id;
}
