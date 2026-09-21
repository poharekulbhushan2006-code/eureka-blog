import { Router } from 'express';
import { apiController } from '../controllers/apiController.js';
import { editorController } from '../controllers/editorController.js';
import { editorialAuth, editorLimiter } from '../middleware/security.js';

export const apiRoutes = Router();

// Search endpoint
apiRoutes.get('/search', apiController.search);

// Claps / Likes
apiRoutes.post('/posts/:slug/clap', apiController.clap);

// Newsletter
apiRoutes.post('/newsletter', apiController.subscribeNewsletter);

// Export current posts JSON
apiRoutes.get('/posts/export', apiController.exportPosts);

// Direct API publishing (Guarded with Editorial Auth & Rate Limiting)
apiRoutes.post('/posts', editorialAuth, editorLimiter, editorController.publishPost);

