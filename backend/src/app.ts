import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './utils/database';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { env } from './config/env';

// Routes
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import cardRoutes from './routes/card.routes';
import debugRoutes from './routes/debug.routes';
import userRoutes from './routes/user.routes';

class App {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
  this.port = env.port;
  this.validateEnvironment();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.connectToDatabase();
  }

  private validateEnvironment(): void {
    const key = env.encryptionKey;
    if (!key) {
      console.error('❌ ENCRYPTION_KEY is not defined in environment variables');
      process.exit(1);
    }
    if (key.length !== 32) {
      console.error(`❌ ENCRYPTION_KEY must be exactly 32 characters long. Current length: ${key.length}`);
      process.exit(1);
    }
    if (!env.isProd) {
      console.log('🔐 ENCRYPTION_KEY loaded and valid (length 32)');
    }
  }

  private initializeMiddlewares(): void {
    // Trust proxy (Render / proxies)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet());

    // Dynamic CORS
    const allowedOrigins = env.frontendUrls.length ? env.frontendUrls : ['http://localhost:4200'];
    this.app.use(cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // non-browser clients
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('CORS_NOT_ALLOWED'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));

    // Rate limiting (environment driven)
    const limiter = rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Sistema de Pagamentos API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/cards', cardRoutes);
    this.app.use('/api/users', userRoutes);
    if (!env.isProd) {
      this.app.use('/api/debug', debugRoutes);
    }

    // 404 handler
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

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async connectToDatabase(): Promise<void> {
    try {
      await connectDatabase();
      console.log('📦 Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`🌍 Environment: ${env.nodeEnv}`);
      console.log(`📡 API base: http://localhost:${this.port}/api`);
      console.log(`❤️  Health: http://localhost:${this.port}/health`);
      if (env.frontendUrls.length) {
        console.log('🌐 Allowed CORS Origins:', env.frontendUrls.join(', '));
      }
    });
  }
}

// Start the server
const app = new App();
app.listen();

export default app;