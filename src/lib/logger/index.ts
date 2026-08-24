import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'email'
    ],
    censor: '[REDACTED]',
  },
  base: {
    service: 'opspilot-core',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
  userRole?: string;
  ip?: string;
  durationMs?: number;
  statusCode?: number;
  error?: string;
}

export function logRequest(context: RequestLogContext) {
  const { statusCode = 200, durationMs, ...rest } = context;
  if (statusCode >= 500) {
    logger.error(rest, `HTTP ${context.method} ${context.path} ${statusCode} - ${durationMs}ms`);
  } else if (statusCode >= 400) {
    logger.warn(rest, `HTTP ${context.method} ${context.path} ${statusCode} - ${durationMs}ms`);
  } else {
    logger.info(rest, `HTTP ${context.method} ${context.path} ${statusCode} - ${durationMs}ms`);
  }
}

export function createChildLogger(moduleName: string, meta: Record<string, unknown> = {}) {
  return logger.child({ module: moduleName, ...meta });
}
