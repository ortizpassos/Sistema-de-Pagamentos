"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const encryption_service_1 = require("../services/encryption.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/encryption', (req, res, next) => {
    try {
        const sample = 'debug-test-string';
        let encrypted;
        let decrypted = null;
        try {
            encrypted = encryption_service_1.encryptionService.encrypt(sample);
            decrypted = encryption_service_1.encryptionService.decrypt(encrypted);
        }
        catch (err) {
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
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=debug.routes.js.map