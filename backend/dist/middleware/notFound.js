"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
function notFound(_req, _res, next) {
    const error = new Error(`Route ${_req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
}
//# sourceMappingURL=notFound.js.map