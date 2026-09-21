// ==========================================================================
// EUREKA — Security Middleware (Full-Stack Protection)
// Rate Limiting, Input Sanitization, Security Headers & Editorial Auth
// ==========================================================================

// 1. Serverless-safe Rate Limiter
// Uses in-memory Map on long-running servers (local dev).
// On Vercel serverless, functions are stateless per-request so persistent
// rate limiting is not feasible — Vercel's edge network handles DDoS protection.
const IS_SERVERLESS = !!process.env.VERCEL;

class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests, message = 'Too many requests, please try again later.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    if (!IS_SERVERLESS) {
      this.hits = new Map();
      // Only run cleanup interval on persistent (non-serverless) servers
      const timer = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of this.hits.entries()) {
          if (now - record.startTime > this.windowMs) {
            this.hits.delete(ip);
          }
        }
      }, 5 * 60 * 1000);
      if (timer.unref) timer.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      // On serverless: skip rate limiting (Vercel edge handles it)
      if (IS_SERVERLESS) return next();

      let ip = req.ip;
      if (!ip && req.headers['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'];
        ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]).trim();
      }
      if (!ip) ip = req.socket?.remoteAddress || 'unknown';
      const now = Date.now();

      let record = this.hits.get(ip);
      if (!record || now - record.startTime > this.windowMs) {
        record = { startTime: now, count: 1 };
        this.hits.set(ip, record);
      } else {
        record.count++;
      }

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + this.windowMs) / 1000));

      if (record.count > this.maxRequests) {
        res.setHeader('Retry-After', Math.ceil((record.startTime + this.windowMs - now) / 1000));
        return res.status(429).json({
          success: false,
          error: this.message
        });
      }

      next();
    };
  }
}

// Instantiate limiters
export const globalLimiter = new SlidingWindowRateLimiter(60 * 1000, 150, 'Global rate limit exceeded. Please slow down.').middleware();
export const apiLimiter = new SlidingWindowRateLimiter(60 * 1000, 60, 'API rate limit exceeded. Please try again in a minute.').middleware();
export const formLimiter = new SlidingWindowRateLimiter(15 * 60 * 1000, 8, 'Too many form submissions from this IP. Please wait 15 minutes.').middleware();
export const editorLimiter = new SlidingWindowRateLimiter(60 * 60 * 1000, 20, 'Publishing limit reached. Please wait before saving more dispatches.').middleware();

// 2. Input Sanitization Middleware (XSS & Prototype Pollution Prevention)
function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Strip dangerous tags and JS event handlers while preserving safe text
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      // Prevent prototype pollution attacks
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  return value;
}

export function inputSanitizer(req, res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
}

// 3. Security Headers Enhancement
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Enforce HSTS (1 year)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Content Security Policy (allows Google Fonts, Unsplash images, local scripts/styles)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https://images.unsplash.com; " +
    "connect-src 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  next();
}

// 4. Editorial Access Control (Protects /editor and POST /api/posts for owner & writers)
export function editorialAuth(req, res, next) {
  const editorialSecret = process.env.EUREKA_EDITORIAL_KEY || 'eureka-editorial-2026';
  const clientToken = req.headers['x-editorial-key'] || req.query.key || (req.body && req.body.editorialKey);
  const isJson = req.xhr || req.headers.accept?.includes('json') || req.originalUrl.startsWith('/api');

  // Verify key if provided
  if (clientToken && clientToken !== editorialSecret) {
    if (isJson) {
      return res.status(403).json({
        success: false,
        error: 'Invalid Editorial Key. Access denied.'
      });
    }
    return res.status(403).render('pages/editor', {
      title: 'Eureka Studio — Access Restricted',
      description: 'The editorial key provided was invalid.',
      siteConfig: req.app.locals.siteConfig || {},
      categories: (req.app.locals.siteConfig && req.app.locals.siteConfig.categories) || [],
      error: 'Invalid Editorial Key. Please check your key and try again.',
      formData: req.body || {},
      activePath: '/editor'
    });
  }

  // In production, token is strictly mandatory
  if (process.env.NODE_ENV === 'production' && !clientToken) {
    if (isJson) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please supply X-Editorial-Key.'
      });
    }
    return res.status(401).render('pages/editor', {
      title: 'Eureka Studio — Authentication Required',
      description: 'Editorial key required to publish dispatches.',
      siteConfig: req.app.locals.siteConfig || {},
      categories: (req.app.locals.siteConfig && req.app.locals.siteConfig.categories) || [],
      error: 'Editorial Key required to publish.',
      formData: req.body || {},
      activePath: '/editor'
    });
  }

  next();
}
