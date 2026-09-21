import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { globalLimiter, apiLimiter, inputSanitizer, securityHeaders, csrfProtection } from './middleware/security.js';
import { siteConfig } from './config/site.js';
import { webRoutes } from './routes/webRoutes.js';
import { apiRoutes } from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Hide server fingerprint
  app.disable('x-powered-by');

  // Trust proxy for rate limiting if behind reverse proxy
  app.set('trust proxy', 1);

  // Security Headers & Full-Stack Protection
  app.use(helmet({
    contentSecurityPolicy: false, // Handled by securityHeaders for fine-grained control
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' }
  }));
  app.use(securityHeaders);
  app.use(compression());
  app.use(cors());

  // Global Rate Limiting
  app.use(globalLimiter);

  // Logging
  app.use(requestLogger);

  // Body Parsing with Input Sanitization
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(express.json({ limit: '2mb' }));
  app.use(inputSanitizer);
  app.use(csrfProtection);

  // Static Assets (Cache-Control for performance)
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0',
    etag: true
  }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Global Locals
  app.locals.siteConfig = siteConfig;

  // View Engine Configuration
  app.set('view engine', 'ejs');
  app.set('views', [
    path.join(process.cwd(), 'views'),
    path.join(__dirname, '../views')
  ]);

  // Application Routes
  app.use('/api', apiLimiter, apiRoutes);
  app.use('/', webRoutes);

  // Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

const app = createApp();
export default app;

