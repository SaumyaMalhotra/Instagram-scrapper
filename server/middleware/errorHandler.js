import { config } from '../config.js';
import { ApifyProxyError } from '../services/apifyService.js';
import { ValidationError } from '../services/validation.js';

/**
 * Global error handler middleware.
 * Ensures consistent JSON structure: { error: { code, message, retryHint } }
 * Never leaks stack traces in production.
 * Never leaks API tokens or internal credentials.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let errorCode = 'internal_error';
  let message = 'An unexpected server error occurred.';
  let retryHint = 'Please try again later.';

  if (err instanceof ApifyProxyError) {
    statusCode = err.status || 500;
    errorCode = err.code || 'upstream_error';
    message = err.message;
    retryHint = err.retryHint || retryHint;
  } else if (err instanceof ValidationError || err.name === 'ValidationError') {
    statusCode = err.status || 400;
    errorCode = err.code || 'validation_error';
    message = err.message;
    retryHint = err.retryHint || 'Verify the input fields adhere to required constraints.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'payload_too_large';
    message = 'Request body exceeded size limit (max 50kb).';
    retryHint = 'Reduce the size of the request payload.';
  } else if (err.status === 400 || err.name === 'SyntaxError') {
    statusCode = 400;
    errorCode = 'validation_error';
    message = err.message || 'Malformed request payload.';
    retryHint = 'Ensure your request is properly formatted JSON.';
  } else if (err.message) {
    message = err.message;
  }

  // Safe server console logging without exposing sensitive internals
  console.error(`[Error] ${errorCode} (${statusCode}):`, message);

  const responsePayload = {
    error: {
      code: errorCode,
      message: message,
      ...(retryHint ? { retryHint } : {})
    }
  };

  // Stack traces only in development
  if (!config.isProduction && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
