"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
function errorHandler(error, _req, res, _next) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    console.error(`Error ${statusCode}: ${message}`);
    console.error(error.stack);
    const errorResponse = {
        success: false,
        error: {
            message: process.env['NODE_ENV'] === 'production' && statusCode === 500
                ? 'Internal Server Error'
                : message,
            ...(process.env['NODE_ENV'] !== 'production' && { stack: error.stack })
        }
    };
    res.status(statusCode).json(errorResponse);
}
function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}
//# sourceMappingURL=errorHandler.js.map