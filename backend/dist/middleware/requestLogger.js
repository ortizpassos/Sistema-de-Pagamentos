"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip}`);
    if (process.env.NODE_ENV === 'development' && req.body) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.cardNumber;
        delete sanitizedBody.cvv;
        delete sanitizedBody.token;
        if (Object.keys(sanitizedBody).length > 0) {
            console.log('📋 Request body:', sanitizedBody);
        }
    }
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`📤 ${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map