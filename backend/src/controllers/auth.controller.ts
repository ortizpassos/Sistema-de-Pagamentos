import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { generateTokens, verifyToken } from '../middleware/auth';
import { env } from '../config/env';
import { emailService } from '../services/email.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

class AuthController {
  // Register new user
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, phone, document } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    // Check if document is already registered (if provided)
    if (document) {
      const existingDocument = await User.findOne({ document });
      if (existingDocument) {
        throw new AppError('Document already registered', 400, 'DOCUMENT_EXISTS');
      }
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      document
    });

    await user.save();

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (non-blocking)
    (async () => {
      try {
        await emailService.sendVerificationEmail(email, verificationToken, firstName);
        if (!env.isProd) console.log('[register] verification email queued/sent');
      } catch (error) {
        console.error('[register] Failed to send verification email (non-blocking):', error);
      }
    })();

    // Auto login feature flag
    if (env.features.autoLoginAfterRegister) {
      const { accessToken, refreshToken } = generateTokens(user._id, user.email);
      // Persist refresh token
      const freshUser = await User.findById(user._id).select('+refreshTokens');
      if (freshUser) {
        freshUser.refreshTokens.push(refreshToken);
        await freshUser.save();
      }
      const response: AuthResponse = {
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

  // Generate tokens (default path)
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    // Persistir refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    const response: AuthResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        token: accessToken,
        refreshToken,
        expiresIn: 3600 // 1h em segundos
      }
    };
    res.status(201).json(response);
    if (!env.isProd) console.log('[register] user created and response sent:', user.email);
  });

  // Login user
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.email);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    const response: AuthResponse = {
      success: true,
      data: {
        user: user.toJSON(),
        token: accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour
      }
    };

    res.json(response);
  });

  // Logout user
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Remove specific refresh token
      const userDoc = await User.findById(user._id).select('+refreshTokens');
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

  // Refresh access token
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id).select('+refreshTokens');
      
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.email);

      // Replace old refresh token with new one
      const tokenIndex = user.refreshTokens.indexOf(refreshToken);
      user.refreshTokens[tokenIndex] = newRefreshToken;
      await user.save();

      const response: AuthResponse = {
        success: true,
        data: {
          user: user.toJSON(),
          token: accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        }
      };

      res.json(response);

    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  });

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  });

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { firstName, lastName, phone, document } = req.body;

    // Check if document is already used by another user
    if (document && document !== user.document) {
      const existingUser = await User.findOne({ 
        document, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        throw new AppError('Document already registered by another user', 400, 'DOCUMENT_EXISTS');
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { firstName, lastName, phone, document },
      { new: true, runValidators: true }
    );

    const response: AuthResponse = {
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

  // Change password
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const userWithPassword = await User.findById(user._id).select('+password +refreshTokens');
    
    if (!userWithPassword || !(await userWithPassword.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Update password
    userWithPassword.password = newPassword;
    
    // Clear all refresh tokens (force re-login on all devices)
    userWithPassword.refreshTokens = [];
    
    await userWithPassword.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  });

  // Forgot password
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
      return;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      
      res.json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (error) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      throw new AppError('Failed to send reset email. Please try again.', 500, 'EMAIL_SEND_FAILED');
    }
  });

  // Reset password
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+refreshTokens');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens
    user.refreshTokens = [];
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  });

  // Verify email
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    // Hash token and find user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    res.json({
      success: true,
      message: 'Email verified successfully!'
    });
  });

  // Resend verification email
  resendVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as IUser;

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED');
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
      
      res.json({
        success: true,
        message: 'Verification email sent successfully.'
      });
    } catch (error) {
      throw new AppError('Failed to send verification email. Please try again.', 500, 'EMAIL_SEND_FAILED');
    }
  });
}

export const authController = new AuthController();