"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEmailVerification = exports.optionalAuth = exports.authenticate = exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("../models/User");
const errorHandler_1 = require("./errorHandler");
const generateTokens = (userId, email) => {
    const accessSecret = (process.env.JWT_SECRET || 'dev_access_secret_please_change');
    const refreshSecret = (process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_please_change');
    const common = {
        issuer: 'sistema-pagamentos',
        audience: 'sistema-pagamentos-app'
    };
    const accessPayload = { id: userId, email };
    const refreshPayload = { id: userId, email, type: 'refresh' };
    const accessOptions = { ...common, expiresIn: (process.env.JWT_EXPIRES_IN || '1h') };
    const refreshOptions = { ...common, expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') };
    const accessToken = (0, jsonwebtoken_1.sign)(accessPayload, accessSecret, accessOptions);
    const refreshToken = (0, jsonwebtoken_1.sign)(refreshPayload, refreshSecret, refreshOptions);
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyToken = (token, secret) => {
    return (0, jsonwebtoken_1.verify)(token, secret, {
        issuer: 'sistema-pagamentos',
        audience: 'sistema-pagamentos-app'
    });
};
exports.verifyToken = verifyToken;
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Access token is required', 401, 'MISSING_TOKEN');
        }
        const token = authHeader.substring(7);
        const decoded = (0, exports.verifyToken)(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id).select('+refreshTokens');
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 401, 'USER_NOT_FOUND');
        }
        if (!user.isActive) {
            throw new errorHandler_1.AppError('User account is deactivated', 401, 'USER_DEACTIVATED');
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new errorHandler_1.AppError('Invalid token', 401, 'INVALID_TOKEN'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new errorHandler_1.AppError('Token expired', 401, 'TOKEN_EXPIRED'));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = (0, exports.verifyToken)(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    if (!req.user.isEmailVerified) {
        return next(new errorHandler_1.AppError('Email verification required', 403, 'EMAIL_NOT_VERIFIED'));
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
//# sourceMappingURL=auth.js.map