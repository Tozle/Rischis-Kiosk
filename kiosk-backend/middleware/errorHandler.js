import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  logger.error({ err }, 'unhandled error');
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message = err.message || 'Serverfehler';
  res.status(status).json({ error: message });
}
