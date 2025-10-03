"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const env_1 = require("../config/env");
const email_service_1 = require("../services/email.service");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthController {
    constructor() {
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email, password, firstName, lastName, phone, document } = req.body;
            const existingUser = await User_1.User.findOne({ email });
            if (existingUser) {
                throw new errorHandler_1.AppError('Email already registered', 400, 'EMAIL_EXISTS');
            }
            if (document) {
                const existingDocument = await User_1.User.findOne({ document });
                if (existingDocument) {
                    throw new errorHandler_1.AppError('Document already registered', 400, 'DOCUMENT_EXISTS');
                }
            }
            const user = new User_1.User({
                email,
                password,
                firstName,
                lastName,
                phone,
                document
            });
            await user.save();
            const verificationToken = user.generateEmailVerificationToken();
            await user.save();
            (async () => {
                try {
                    await email_service_1.emailService.sendVerificationEmail(email, verificationToken, firstName);
                    if (!env_1.env.isProd)
                        console.log('[register] verification email queued/sent');
                }
                catch (error) {
                    console.error('[register] Failed to send verification email (non-blocking):', error);
                }
            })();
            if (env_1.env.features.autoLoginAfterRegister) {
                const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user._id, user.email);
                const freshUser = await User_1.User.findById(user._id).select('+refreshTokens');
                if (freshUser) {
                    freshUser.refreshTokens.push(refreshToken);
                    await freshUser.save();
                }
                const response = {
                    success: true,
                    data: {
                        user: user.toJSON(),
                        token: accessToken,
                        refreshToken,
                        expiresIn: 3600
                    }
                };
                res.status(201).json(response);
                return;
            }
            const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user._id, user.email);
            user.refreshTokens.push(refreshToken);
            await user.save();
            const response = {
                success: true,
                data: {
                    user: user.toJSON(),
                    token: accessToken,
                    refreshToken,
                    expiresIn: 3600
                }
            };
            res.status(201).json(response);
            if (!env_1.env.isProd)
                console.log('[register] user created and response sent:', user.email);
        });
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            const user = await User_1.User.findOne({ email }).select('+password +refreshTokens');
            if (!user || !(await user.comparePassword(password))) {
                throw new errorHandler_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
            }
            if (!user.isActive) {
                throw new errorHandler_1.AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
            }
            const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user._id, user.email);
            user.refreshTokens.push(refreshToken);
            await user.save();
            const response = {
                success: true,
                data: {
                    user: user.toJSON(),
                    token: accessToken,
                    refreshToken,
                    expiresIn: 3600
                }
            };
            res.json(response);
        });
        this.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const refreshToken = req.body.refreshToken;
            if (refreshToken) {
                const userDoc = await User_1.User.findById(user._id).select('+refreshTokens');
                if (userDoc) {
                    userDoc.refreshTokens = userDoc.refreshTokens.filter(token => token !== refreshToken);
                    await userDoc.save();
                }
            }
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new errorHandler_1.AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
            }
            try {
                const decoded = (0, auth_1.verifyToken)(refreshToken, process.env.JWT_REFRESH_SECRET);
                const user = await User_1.User.findById(decoded.id).select('+refreshTokens');
                if (!user || !user.refreshTokens.includes(refreshToken)) {
                    throw new errorHandler_1.AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
                }
                if (!user.isActive) {
                    throw new errorHandler_1.AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
                }
                const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateTokens)(user._id, user.email);
                const tokenIndex = user.refreshTokens.indexOf(refreshToken);
                user.refreshTokens[tokenIndex] = newRefreshToken;
                await user.save();
                const response = {
                    success: true,
                    data: {
                        user: user.toJSON(),
                        token: accessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: 3600
                    }
                };
                res.json(response);
            }
            catch (error) {
                if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                    throw new errorHandler_1.AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
                }
                throw error;
            }
        });
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            res.json({
                success: true,
                data: {
                    user: user.toJSON()
                }
            });
        });
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { firstName, lastName, phone, document } = req.body;
            if (document && document !== user.document) {
                const existingUser = await User_1.User.findOne({
                    document,
                    _id: { $ne: user._id }
                });
                if (existingUser) {
                    throw new errorHandler_1.AppError('Document already registered by another user', 400, 'DOCUMENT_EXISTS');
                }
            }
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, { firstName, lastName, phone, document }, { new: true, runValidators: true });
            const response = {
                success: true,
                data: {
                    user: updatedUser?.toJSON(),
                    token: '',
                    refreshToken: '',
                    expiresIn: 0
                }
            };
            res.json(response);
        });
        this.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { currentPassword, newPassword } = req.body;
            const userWithPassword = await User_1.User.findById(user._id).select('+password +refreshTokens');
            if (!userWithPassword || !(await userWithPassword.comparePassword(currentPassword))) {
                throw new errorHandler_1.AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
            }
            userWithPassword.password = newPassword;
            userWithPassword.refreshTokens = [];
            await userWithPassword.save();
            res.json({
                success: true,
                message: 'Password changed successfully. Please login again.'
            });
        });
        this.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const user = await User_1.User.findOne({ email });
            if (!user) {
                res.json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent.'
                });
                return;
            }
            const resetToken = user.generatePasswordResetToken();
            await user.save();
            try {
                await email_service_1.emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
                res.json({
                    success: true,
                    message: 'Password reset link sent to your email.'
                });
            }
            catch (error) {
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                await user.save();
                throw new errorHandler_1.AppError('Failed to send reset email. Please try again.', 500, 'EMAIL_SEND_FAILED');
            }
        });
        this.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token, newPassword } = req.body;
            const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const user = await User_1.User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            }).select('+refreshTokens');
            if (!user) {
                throw new errorHandler_1.AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
            }
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.refreshTokens = [];
            await user.save();
            res.json({
                success: true,
                message: 'Password reset successfully. Please login with your new password.'
            });
        });
        this.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token } = req.body;
            const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const user = await User_1.User.findOne({
                emailVerificationToken: hashedToken,
                emailVerificationExpires: { $gt: Date.now() }
            });
            if (!user) {
                throw new errorHandler_1.AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
            }
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();
            try {
                await email_service_1.emailService.sendWelcomeEmail(user.email, user.firstName);
            }
            catch (error) {
                console.error('Failed to send welcome email:', error);
            }
            res.json({
                success: true,
                message: 'Email verified successfully!'
            });
        });
        this.resendVerification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            if (user.isEmailVerified) {
                throw new errorHandler_1.AppError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
            }
            const verificationToken = user.generateEmailVerificationToken();
            await user.save();
            try {
                await email_service_1.emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
                res.json({
                    success: true,
                    message: 'Verification email sent successfully.'
                });
            }
            catch (error) {
                throw new errorHandler_1.AppError('Failed to send verification email. Please try again.', 500, 'EMAIL_SEND_FAILED');
            }
        });
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map