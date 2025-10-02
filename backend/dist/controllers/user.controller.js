"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
class UserController {
    constructor() {
        this.list = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { q } = req.query;
            const filter = {};
            if (q) {
                const term = String(q).trim();
                filter.$or = [
                    { email: { $regex: term, $options: 'i' } },
                    { firstName: { $regex: term, $options: 'i' } },
                    { lastName: { $regex: term, $options: 'i' } }
                ];
            }
            const users = await User_1.User.find(filter)
                .limit(20)
                .sort({ createdAt: -1 })
                .select('firstName lastName email');
            return res.json({
                success: true,
                data: users.map(u => ({
                    id: u.id || u._id,
                    name: `${u.firstName} ${u.lastName}`.trim(),
                    email: u.email
                }))
            });
        });
        this.lookupByEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.query;
            if (!email) {
                throw new errorHandler_1.AppError('Email é obrigatório', 400, 'EMAIL_REQUIRED');
            }
            const user = await User_1.User.findOne({ email: String(email).toLowerCase() })
                .select('firstName lastName email');
            if (!user) {
                return res.json({ success: true, data: null });
            }
            return res.json({
                success: true,
                data: {
                    id: user.id || user._id,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email
                }
            });
        });
    }
}
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map