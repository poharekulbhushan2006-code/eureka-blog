import { createApp } from '../src/app.js';

const app = createApp();

export default function handler(req, res) {
  // Normalize rewritten URL in Vercel serverless environment
  if (req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace(/^\/api\/index\.js/, '') || '/';
  }
  return app(req, res);
}

