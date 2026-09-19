import { postService } from '../services/postService.js';
import { siteConfig } from '../config/site.js';

export const editorController = {
  renderEditor(req, res) {
    res.render('pages/editor', {
      title: 'Eureka Studio — Write & Publish',
      description: 'The minimalist Markdown authoring studio for Eureka contributors.',
      siteConfig,
      categories: siteConfig.categories,
      error: null,
      formData: {},
      activePath: '/editor'
    });
  },

  async publishPost(req, res, next) {
    try {
      const isJson = req.xhr || req.headers.accept?.includes('json') || req.originalUrl.startsWith('/api');
      const { title, subtitle, category, tags, content, authorName, authorRole } = req.body || {};

      // 1. Validation for Writers & Developers
      if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
        const errorMsg = 'Post title is required and must be between 3 and 200 characters.';
        if (isJson) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        return res.status(400).render('pages/editor', {
          title: 'Eureka Studio — Write & Publish',
          description: 'The minimalist Markdown authoring studio for Eureka contributors.',
          siteConfig,
          categories: siteConfig.categories,
          error: errorMsg,
          formData: req.body,
          activePath: '/editor'
        });
      }

      if (!content || typeof content !== 'string' || content.trim().length < 10 || content.length > 500000) {
        const errorMsg = 'Post content is required and must be between 10 and 500,000 characters.';
        if (isJson) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        return res.status(400).render('pages/editor', {
          title: 'Eureka Studio — Write & Publish',
          description: 'The minimalist Markdown authoring studio for Eureka contributors.',
          siteConfig,
          categories: siteConfig.categories,
          error: errorMsg,
          formData: req.body,
          activePath: '/editor'
        });
      }

      // 2. Category Normalization
      const validCategories = siteConfig.categories.map(c => c.slug.toLowerCase());
      const chosenCategory = category && validCategories.includes(category.toLowerCase())
        ? category
        : 'Psychology';

      // 3. Tags Normalization
      let processedTags = [];
      if (Array.isArray(tags)) {
        processedTags = tags.map(t => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 15);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(t => t.trim().slice(0, 30)).filter(Boolean).slice(0, 15);
      }

      // 4. Create Post via Service
      const newPost = await postService.createPost({
        title: title.trim(),
        subtitle: (subtitle && typeof subtitle === 'string') ? subtitle.trim().slice(0, 300) : '',
        category: chosenCategory,
        tags: processedTags,
        content: content.trim(),
        authorName: (authorName && typeof authorName === 'string') ? authorName.trim().slice(0, 100) : 'EUREKA Research',
        authorRole: (authorRole && typeof authorRole === 'string') ? authorRole.trim().slice(0, 100) : 'Research Fellow'
      });

      if (isJson) {
        return res.status(201).json({
          success: true,
          message: 'Dispatch published successfully.',
          post: {
            id: newPost.id,
            slug: newPost.slug,
            title: newPost.title,
            category: newPost.category,
            url: `/post/${newPost.slug}`
          }
        });
      }

      res.redirect(`/post/${newPost.slug}?published=true`);
    } catch (err) {
      next(err);
    }
  }
};
