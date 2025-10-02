import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { encryptionService } from '../services/encryption.service';

const router = Router();

// All debug routes require auth (evita exposição indevida)
router.use(authenticate);

router.get('/encryption', (req, res, next): void => {
  try {
    const sample = 'debug-test-string';
    let encrypted: string;
    let decrypted: string | null = null;
    try {
      encrypted = encryptionService.encrypt(sample);
      decrypted = encryptionService.decrypt(encrypted);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Encryption test failed',
          code: err?.message?.includes('ENCRYPTION_KEY') ? 'ENCRYPTION_KEY_INVALID' : 'ENCRYPTION_RUNTIME_ERROR',
          details: process.env.NODE_ENV !== 'production' ? err?.message : undefined
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        keyLength: process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.length : 0,
        encryptedPreview: encrypted.substring(0, 32) + '...',
        roundTripOk: decrypted === sample
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
