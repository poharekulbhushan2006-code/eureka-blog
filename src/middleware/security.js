// ==========================================================================
// EUREKA — Security Middleware (Full-Stack Protection)
// Rate Limiting, Input Sanitization, Security Headers, CSRF & Editorial Auth
// ==========================================================================

import crypto from 'crypto';

// 1. Serverless-safe Sliding Window Rate Limiter (No setInterval)
// Uses in-memory Map with lazy cleanup on request, safe for both local dev and serverless warm containers.
class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests, message = 'Too many requests, please try again later.') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.hits = new Map();
  }

  middleware() {
    return (req, res, next) => {
      let ip = req.ip;
      if (!ip && req.headers['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'];
        ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]).trim();
      }
      if (!ip) ip = req.socket?.remoteAddress || 'unknown';
      const now = Date.now();

      // Lazy cleanup: prune stale entries periodically without using timers
      if (this.hits.size > 500) {
        for (const [key, rec] of this.hits.entries()) {
          if (now - rec.startTime > this.windowMs) {
            this.hits.delete(key);
          }
        }
      }

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
export const formLimiter = new SlidingWindowRateLimiter(15 * 60 * 1000, 10, 'Too many form submissions from this IP. Please wait a few minutes.').middleware();
export const editorLimiter = new SlidingWindowRateLimiter(60 * 60 * 1000, 25, 'Publishing limit reached. Please wait before saving more dispatches.').middleware();

// 2. Input Sanitization Middleware (XSS & Prototype Pollution Prevention)
function sanitizeValue(value) {
  if (typeof value === 'string') {
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
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https://images.unsplash.com https://*.unsplash.com; " +
    "connect-src 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  next();
}

// 4. CSRF / Origin Verification Middleware
export function csrfProtection(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers['origin'];
    const host = req.headers['host'];
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        const isLocal = originHost.includes('localhost') || originHost.includes('127.0.0.1');
        const isVercel = originHost.endsWith('.vercel.app') || originHost === 'eureka-blog.vercel.app';
        const isSameHost = originHost === host;

        if (!isSameHost && !isLocal && !isVercel) {
          const isJson = req.xhr || req.headers.accept?.includes('json') || req.originalUrl.startsWith('/api');
          if (isJson) {
            return res.status(403).json({ success: false, error: 'Forbidden: Origin validation failed.' });
          }
          return res.status(403).send('Forbidden: Request origin not allowed.');
        }
      } catch {
        return res.status(403).json({ success: false, error: 'Malformed Origin.' });
      }
    }
  }
  next();
}

// 5. Constant-time Safe String Comparison
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// 6. Editorial Access Control (Protects /editor and POST /api/posts for owner & writers)
export function editorialAuth(req, res, next) {
  const editorialSecret = process.env.EUREKA_EDITORIAL_KEY || 'eureka-editorial-2026';
  const clientToken = req.headers['x-editorial-key'] || req.query.key || (req.body && req.body.editorialKey);
  const isJson = req.xhr || req.headers.accept?.includes('json') || req.originalUrl.startsWith('/api');

  // If a key was submitted, verify it
  if (clientToken && !safeEqual(clientToken, editorialSecret)) {
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

  // Publishing (POST) requires the key
  if (req.method === 'POST' && !clientToken) {
    if (isJson) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to publish. Please enter your Editorial Key.'
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

