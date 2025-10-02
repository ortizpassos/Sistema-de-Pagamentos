import { Request, Response } from 'express';
import { User } from '../models/User';
import { asyncHandler, AppError } from '../middleware/errorHandler';

class UserController {
  // GET /api/users?q=term  (list limited users for selection)
  list = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query as { q?: string };
    const filter: any = {};

    if (q) {
      const term = String(q).trim();
      // basic search by name or email (case-insensitive)
      filter.$or = [
        { email: { $regex: term, $options: 'i' } },
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .limit(20)
      .sort({ createdAt: -1 })
      .select('firstName lastName email');

    return res.json({
      success: true,
      data: users.map(u => ({
        id: (u as any).id || u._id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email
      }))
    });
  });

  // GET /api/users/lookup?email=foo@bar.com (find one by email)
  lookupByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query as { email?: string };

    if (!email) {
      throw new AppError('Email é obrigatório', 400, 'EMAIL_REQUIRED');
    }

    const user = await User.findOne({ email: String(email).toLowerCase() })
      .select('firstName lastName email');

    if (!user) {
      return res.json({ success: true, data: null });
    }

    return res.json({
      success: true,
      data: {
        id: (user as any).id || user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email
      }
    });
  });
}

export const userController = new UserController();
