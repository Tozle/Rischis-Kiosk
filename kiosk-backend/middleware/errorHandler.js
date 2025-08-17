import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  logger.error({ err }, 'unhandled error');
  if (res.headersSent) {
    return next(err);
  }
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Internal Server Error',
      code: err.code || status,
    });
}
