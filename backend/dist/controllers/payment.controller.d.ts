import { Request, Response } from 'express';
declare class PaymentController {
    initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    processCreditCardPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    processPixPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkPixStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTransactionHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTestCards: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const paymentController: PaymentController;
export {};
//# sourceMappingURL=payment.controller.d.ts.map