import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validatePayment } from '../utils/paymentValidation';
import {
  initiatePaymentSchema,
  creditCardPaymentSchema,
  pixPaymentSchema
} from '../utils/paymentValidation';

const router = Router();

// Protected routes (require authentication)
router.use(authenticate);

// Payment initiation
router.post('/initiate', validatePayment(initiatePaymentSchema), paymentController.initiatePayment);

// Recent transactions (must come before /:transactionId)
router.get('/recent', paymentController.recentTransactions);

// Payment processing
router.post('/credit-card', validatePayment(creditCardPaymentSchema), paymentController.processCreditCardPayment);
router.post('/pix', validatePayment(pixPaymentSchema), paymentController.processPixPayment);

// Payment status and management
router.get('/pix/:transactionId/status', paymentController.checkPixStatus);
router.get('/:transactionId', paymentController.getTransaction);
router.patch('/:transactionId/cancel', paymentController.cancelTransaction);

// User transaction management
router.get('/', paymentController.getTransactionHistory);
router.get('/stats/overview', paymentController.getPaymentStats);

// Development helpers
router.get('/test/cards', paymentController.getTestCards);

export default router;