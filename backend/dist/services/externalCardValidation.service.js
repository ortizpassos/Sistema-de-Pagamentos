"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalCardValidationService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class ExternalCardValidationService {
    constructor() {
        this.enabled = env_1.env.externalCardApi.enabled;
    }
    async validate(data) {
        if (!this.enabled) {
            return { valid: true, provider: 'disabled' };
        }
        if (!env_1.env.externalCardApi.url) {
            return { valid: false, reason: 'CONFIG_MISSING_URL', provider: 'config' };
        }
        const started = Date.now();
        const debug = env_1.env.externalCardApi.debug;
        const maskCard = (c) => c.replace(/^(\d{6})\d+(\d{4})$/, '$1********$2');
        if (debug) {
            try {
                console.log('[EXT-CARD][REQUEST]', {
                    cardNumber: maskCard(data.cardNumber),
                    expirationMonth: data.expirationMonth,
                    expirationYear: data.expirationYear,
                    user: data.user?.id
                });
            }
            catch { }
        }
        try {
            const resp = await axios_1.default.post(env_1.env.externalCardApi.url + '/validate', data, {
                timeout: env_1.env.externalCardApi.timeoutMs,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': env_1.env.externalCardApi.key
                }
            });
            const latency = Date.now() - started;
            const response = { ...resp.data, networkLatencyMs: latency };
            if (debug) {
                try {
                    console.log('[EXT-CARD][RESPONSE]', {
                        valid: response.valid,
                        reason: response.reason,
                        provider: response.provider,
                        latencyMs: latency
                    });
                }
                catch { }
            }
            return response;
        }
        catch (err) {
            const latency = Date.now() - started;
            const ax = err;
            if (ax.code === 'ECONNABORTED') {
                const timeoutResp = { valid: false, reason: 'TIMEOUT', provider: 'external', networkLatencyMs: latency };
                if (debug)
                    console.log('[EXT-CARD][ERROR][TIMEOUT]', timeoutResp);
                return timeoutResp;
            }
            if (ax.response) {
                const r = ax.response.data || {};
                const rejected = { valid: false, reason: r.reason || r.message || 'EXTERNAL_REJECTED', provider: 'external', networkLatencyMs: latency };
                if (debug)
                    console.log('[EXT-CARD][ERROR][REJECTED]', rejected);
                return rejected;
            }
            const generic = { valid: false, reason: 'EXTERNAL_ERROR', provider: 'external', networkLatencyMs: latency };
            if (debug)
                console.log('[EXT-CARD][ERROR][GENERIC]', generic);
            return generic;
        }
    }
}
exports.externalCardValidationService = new ExternalCardValidationService();
//# sourceMappingURL=externalCardValidation.service.js.map