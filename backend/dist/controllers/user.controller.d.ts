import { Request, Response } from 'express';
declare class UserController {
    list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    lookupByEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const userController: UserController;
export {};
//# sourceMappingURL=user.controller.d.ts.map