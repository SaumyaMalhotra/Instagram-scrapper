/**
 * Request logger middleware.
 * Logs method, path, status code, and duration.
 * Safeguard: Never logs body payloads, authorization tokens, or sensitive headers.
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Clean log line without sensitive params
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
}
