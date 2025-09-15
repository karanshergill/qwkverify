import logger from '../utilities/logger.js';
import { AppError } from '../utilities/errors.js';

const errorHandler = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV !== 'production';
    const isOperational = err instanceof AppError || err.isOperational;

    const statusCode = err.statusCode || 500;
    const message = isOperational ? err.message : 'Internal server error';

    logger.error(`[${req.method}] ${req.originalUrl} - ${message}`);
    if (isDev || !isOperational) {
        logger.error(err.stack || err.message);
    }

    res.status(statusCode).json({
        error: message
    })
};

export default errorHandler;