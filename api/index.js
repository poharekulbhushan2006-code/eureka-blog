import { createApp } from '../src/app.js';

const app = createApp();

export default function handler(req, res) {
  try {
    if (!req.url || req.url === '') {
      req.url = '/';
    }
    if (req.url.startsWith('/api/index.js')) {
      req.url = req.url.replace(/^\/api\/index\.js/, '') || '/';
    }
    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }
    return app(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).send(`Vercel Handler Error: ${err.message}\n${err.stack}`);
  }
}

