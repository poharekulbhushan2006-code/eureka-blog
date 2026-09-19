import { postService } from '../services/postService.js';

export const apiController = {
  async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await postService.search(q);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  },

  async clap(req, res, next) {
    try {
      const { slug } = req.params;
      const claps = await postService.incrementClaps(slug);
      if (claps === null) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ success: true, claps });
    } catch (err) {
      next(err);
    }
  },

  async subscribeNewsletter(req, res) {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    // Simulate newsletter subscription
    return res.json({
      success: true,
      message: 'Thank you for subscribing to the EUREKA Dispatch.'
    });
  }
};
