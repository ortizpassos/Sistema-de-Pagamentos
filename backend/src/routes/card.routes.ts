import { Router } from 'express';
import { cardController } from '../controllers/card.controller';
import { authenticate } from '../middleware/auth';
import { validateCard } from '../utils/cardValidation';
import { saveCardSchema, updateCardSchema } from '../utils/cardValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Card CRUD operations
router.get('/', cardController.getUserCards);
router.post('/', validateCard(saveCardSchema), cardController.saveCard);
router.get('/:cardId', cardController.getCard);
router.put('/:cardId', validateCard(updateCardSchema), cardController.updateCard);
router.delete('/:cardId', cardController.deleteCard);

// Card management
router.patch('/:cardId/set-default', cardController.setDefaultCard);

// Card utilities and statistics
router.get('/check/expiration', cardController.checkCardExpiration);
router.get('/stats/overview', cardController.getCardStats);
router.delete('/expired/cleanup', cardController.deleteExpiredCards);

export default router;