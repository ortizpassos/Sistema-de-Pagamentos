import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { userController } from '../controllers/user.controller';

const router = Router();

// Protected user listing for selecting recipients
router.use(authenticate);

router.get('/', userController.list);
router.get('/lookup', userController.lookupByEmail);

export default router;
