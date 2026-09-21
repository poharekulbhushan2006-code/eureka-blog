import { Router } from 'express';
import { postController } from '../controllers/postController.js';
import { editorController } from '../controllers/editorController.js';
import { formLimiter, editorLimiter, editorialAuth } from '../middleware/security.js';

export const webRoutes = Router();

// Editorial & Reader Routes
webRoutes.get('/', postController.getHome);
webRoutes.get('/sitemap.xml', postController.getSitemap);
webRoutes.get('/rss.xml', postController.getFeed);
webRoutes.get('/feed.xml', postController.getFeed);
webRoutes.get('/privacy', postController.getPrivacy);
webRoutes.get('/terms', postController.getTerms);
webRoutes.get('/contact', postController.getContact);
webRoutes.post('/contact', formLimiter, postController.submitContact);
webRoutes.get('/thank-you', postController.getThankYou);
webRoutes.get('/post/:slug', postController.getPost);
webRoutes.get('/category/:category', postController.getCategory);
webRoutes.get('/tag/:tag', postController.getTag);
webRoutes.get('/about', postController.getAbout);

// Studio & Authoring Routes (Guarded with Editorial Auth & Rate Limiter)
webRoutes.get('/editor', editorialAuth, editorController.renderEditor);
webRoutes.post('/editor', editorialAuth, editorLimiter, editorController.publishPost);
