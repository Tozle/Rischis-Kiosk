import logger from '../utils/logger.js';

export default function requestLogger(req, res, next) {
  logger.info({ method: req.method, url: req.originalUrl }, 'incoming request');
  next();
}
