import path from 'path';

let app = null;
let startupError = null;

async function getApp() {
  if (startupError) throw startupError;
  if (app) return app;

  try {
    // Log environment for debugging
    console.log('[eureka] cwd:', process.cwd());
    console.log('[eureka] __dirname equivalent:', path.dirname(new URL(import.meta.url).pathname));
    console.log('[eureka] VERCEL env:', process.env.VERCEL);
    console.log('[eureka] NODE_ENV:', process.env.NODE_ENV);

    const { createApp } = await import('../src/app.js');
    app = createApp();
    console.log('[eureka] App created successfully');
    return app;
  } catch (err) {
    console.error('[eureka] STARTUP ERROR:', err);
    startupError = err;
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    // Normalize URL
    if (!req.url || req.url === '') req.url = '/';
    if (req.url.startsWith('/api/index.js')) {
      req.url = req.url.replace(/^\/api\/index\.js/, '') || '/';
    }
    if (!req.url.startsWith('/')) req.url = '/' + req.url;

    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (err) {
    console.error('[eureka] Handler error:', err);
    res.status(500).send(
      `<h2>EUREKA Server Error</h2>` +
      `<pre>${err.message}\n\n${err.stack}</pre>` +
      `<p>cwd: ${process.cwd()}</p>` +
      `<p>NODE_ENV: ${process.env.NODE_ENV}</p>` +
      `<p>VERCEL: ${process.env.VERCEL}</p>`
    );
  }
}

