"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./utils/database");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const card_routes_1 = __importDefault(require("./routes/card.routes"));
const debug_routes_1 = __importDefault(require("./routes/debug.routes"));
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3000');
        this.validateEnvironment();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.connectToDatabase();
    }
    validateEnvironment() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            console.error('❌ ENCRYPTION_KEY is not defined in environment variables');
            process.exit(1);
        }
        if (key.length !== 32) {
            console.error(`❌ ENCRYPTION_KEY must be exactly 32 characters long. Current length: ${key.length}`);
            process.exit(1);
        }
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔐 ENCRYPTION_KEY loaded and valid (length 32)');
        }
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:4200',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            message: {
                success: false,
                error: {
                    message: 'Too many requests from this IP, please try again later',
                    code: 'RATE_LIMIT_EXCEEDED'
                }
            }
        });
        this.app.use('/api/', limiter);
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(requestLogger_1.requestLogger);
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Sistema de Pagamentos API is running',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        this.app.use('/api/auth', auth_routes_1.default);
        this.app.use('/api/payments', payment_routes_1.default);
        this.app.use('/api/cards', card_routes_1.default);
        this.app.use('/api/debug', debug_routes_1.default);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    message: `Route ${req.method} ${req.baseUrl} not found`,
                    code: 'ROUTE_NOT_FOUND'
                }
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    async connectToDatabase() {
        try {
            await (0, database_1.connectDatabase)();
            console.log('📦 Database connected successfully');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📡 API available at: http://localhost:${this.port}/api`);
            console.log(`❤️  Health check: http://localhost:${this.port}/health`);
        });
    }
}
const app = new App();
app.listen();
exports.default = app;
//# sourceMappingURL=app.js.map