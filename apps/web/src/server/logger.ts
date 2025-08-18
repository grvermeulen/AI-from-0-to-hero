import pino from 'pino';

export type LogFields = {
  requestId?: string;
  code?: string;
  [key: string]: unknown;
};

export function createLogger(bindings?: LogFields) {
  return pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: undefined,
  }).child(bindings || {});
}

export function getRequestId(req: Request): string {
  const header = req.headers.get('x-request-id') || undefined;
  return header || Math.random().toString(36).slice(2);
}


