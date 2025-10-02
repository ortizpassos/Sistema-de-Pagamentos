"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const connectDatabase = async () => {
    const mongoUri = env_1.env.mongoUri || 'mongodb://localhost:27017/sistema_pagamentos';
    const startedAt = Date.now();
    try {
        console.log(`[DB] Connecting to: ${mongoUri}`);
        await mongoose_1.default.connect(mongoUri, {});
        const ms = Date.now() - startedAt;
        console.log(`✅ MongoDB connected (${ms}ms)`);
        mongoose_1.default.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('🔄 MongoDB connection closed (SIGINT)');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
exports.default = mongoose_1.default;
//# sourceMappingURL=database.js.map