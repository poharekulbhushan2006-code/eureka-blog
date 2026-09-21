import { siteConfig } from '../config/site.js';

export function notFoundHandler(req, res, next) {
  res.status(404).render('pages/404', {
    title: '404 — Page Not Found | Eureka',
    description: 'The requested page or publication does not exist.',
    siteConfig,
    activePath: ''
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL;

  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(status).json({
      error: isDev ? err.message : 'Internal Server Error',
      stack: isDev ? err.stack : undefined
    });
  }

  res.status(status).render('pages/404', {
    title: `${status} — Server Error | Eureka`,
    description: isDev ? err.message : 'An unexpected error occurred while rendering the page.',
    siteConfig,
    activePath: ''
  });
}
