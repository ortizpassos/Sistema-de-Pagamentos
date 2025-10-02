import { Request, Response } from 'express';
declare class CardController {
    getUserCards: (req: Request, res: Response, next: import("express").NextFunction) => void;
    saveCard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    setDefaultCard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCardForPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    validateCardOwnership: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkCardExpiration: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCardStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteExpiredCards: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const cardController: CardController;
export {};
//# sourceMappingURL=card.controller.d.ts.map