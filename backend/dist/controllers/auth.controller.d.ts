import { Request, Response, NextFunction } from 'express';
declare class AuthController {
    register: (req: Request, res: Response, next: NextFunction) => void;
    login: (req: Request, res: Response, next: NextFunction) => void;
    logout: (req: Request, res: Response, next: NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    getProfile: (req: Request, res: Response, next: NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: NextFunction) => void;
    changePassword: (req: Request, res: Response, next: NextFunction) => void;
    forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
    resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    verifyEmail: (req: Request, res: Response, next: NextFunction) => void;
    resendVerification: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const authController: AuthController;
export {};
//# sourceMappingURL=auth.controller.d.ts.map