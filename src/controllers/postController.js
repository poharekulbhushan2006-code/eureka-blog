import { postService } from '../services/postService.js';
import { siteConfig } from '../config/site.js';

export const postController = {
  async getHome(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const featured = await postService.getFeaturedPost();
      const trending = (await postService.getTrendingPosts(4)) || [];
      const { posts = [], total = 0, totalPages = 1 } = (await postService.getAllPosts({ page, limit: 6 })) || {};
      const categories = (await postService.getAllCategories()) || [];
      const tags = (await postService.getAllTags()) || [];

      res.render('pages/index', {
        title: `${siteConfig.name} — ${siteConfig.tagline}`,
        description: siteConfig.description,
        siteConfig,
        featured,
        trending,
        posts,
        total,
        page,
        totalPages,
        categories,
        tags,
        pageType: 'home',
        topic: 'default',
        activePath: '/'
      });
    } catch (err) {
      console.error('getHome error:', err);
      res.status(500).send(`Homepage Render Error: ${err.message}\n${err.stack}`);
    }
  },

  async getPost(req, res, next) {
    try {
      const { slug } = req.params;
      const post = await postService.getPostBySlug(slug);

      if (!post) {
        return res.status(404).render('pages/404', {
          title: 'Essay Not Found — Eureka',
          description: 'The requested publication could not be located.',
          siteConfig,
          pageType: 'error',
          topic: 'default',
          activePath: ''
        });
      }

      const related = await postService.getRelatedPosts(post.slug, post.category, 3);

      const allPosts = await postService.getPosts();
      const otherPosts = allPosts
        .filter(p => p.slug !== post.slug)
        .map(p => {
          let heroImage = null;
          const match = (p.content || '').match(/!\[.*?\]\((.*?)\)/);
          if (match) heroImage = match[1];
          return {
            ...p,
            readingTime: postService.calculateReadingTime(p.content),
            heroImage
          };
        });

      let topic = 'default';
      const catLower = (post.category || '').toLowerCase();
      const slugLower = (post.slug || '').toLowerCase();
      if (slugLower.includes('quantum') || catLower.includes('science') || slugLower.includes('hogwarts')) {
        topic = 'quantum';
      } else if (slugLower.includes('attachment') || catLower.includes('psychology') || catLower.includes('relationships')) {
        topic = 'psychology';
      } else if (slugLower.includes('rome') || slugLower.includes('history') || catLower.includes('history') || catLower.includes('civilization')) {
        topic = 'rome';
      }

      res.render('pages/post', {
        title: `${post.title} — Eureka`,
        description: post.excerpt,
        siteConfig,
        post,
        related,
        otherPosts,
        pageType: 'post',
        topic,
        activePath: `/category/${encodeURIComponent(post.category)}`
      });
    } catch (err) {
      next(err);
    }
  },

  async getCategory(req, res, next) {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const { posts, total, totalPages } = await postService.getAllPosts({ category, page, limit: 9 });
      const categories = await postService.getAllCategories();

      const matchedCat = siteConfig.categories.find(
        c => c.slug.toLowerCase() === category.toLowerCase()
      );

      const catSlug = category.toLowerCase();
      let topic = 'default';
      if (catSlug.includes('science')) {
        topic = 'quantum';
      } else if (catSlug.includes('psychology') || catSlug.includes('relationship')) {
        topic = 'psychology';
      } else if (catSlug.includes('history') || catSlug.includes('civilization') || catSlug.includes('rome')) {
        topic = 'rome';
      }

      res.render('pages/category', {
        title: `${category} — Eureka Journal`,
        description: matchedCat ? matchedCat.description : `Articles in ${category}`,
        categoryName: category,
        categoryMeta: matchedCat,
        posts,
        total,
        page,
        totalPages,
        categories,
        isTag: false,
        siteConfig,
        pageType: 'category',
        topic,
        activePath: `/category/${category}`
      });
    } catch (err) {
      next(err);
    }
  },

  async getTag(req, res, next) {
    try {
      const { tag } = req.params;
      const page = parseInt(req.query.page) || 1;
      const { posts, total, totalPages } = await postService.getAllPosts({ tag, page, limit: 9 });
      const tags = await postService.getAllTags();

      res.render('pages/category', {
        title: `#${tag} — Eureka Tags`,
        description: `Explore all essays and dispatches tagged with #${tag}`,
        categoryName: `#${tag}`,
        categoryMeta: { description: `Curated essays exploring #${tag}.` },
        posts,
        total,
        page,
        totalPages,
        tags,
        isTag: true,
        siteConfig,
        activePath: ''
      });
    } catch (err) {
      next(err);
    }
  },

  getAbout(req, res) {
    res.render('pages/about', {
      title: 'About Eureka — Editorial Manifesto & Standards',
      description: 'The philosophy, editorial standards, and contributor guidelines of Eureka Blog.',
      siteConfig,
      pageType: 'about',
      topic: 'default',
      activePath: '/about'
    });
  },

  async getSitemap(req, res, next) {
    try {
      const posts = await postService.getPosts();
      const categories = await postService.getAllCategories();
      const baseUrl = (siteConfig.url || 'http://localhost:3000').replace(/\/$/, '');
      const today = new Date().toISOString().split('T')[0];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

      // Static pages
      const staticPages = [
        { path: '/about', priority: '0.7', changefreq: 'monthly' },
        { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
        { path: '/terms', priority: '0.5', changefreq: 'yearly' },
        { path: '/contact', priority: '0.6', changefreq: 'monthly' }
      ];

      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}${page.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }

      // Categories
      for (const cat of categories) {
        const catSlug = cat.slug || cat.name || cat;
        xml += `  <url>\n    <loc>${baseUrl}/category/${encodeURIComponent(catSlug)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      // Posts
      for (const post of posts) {
        const postDate = post.date ? new Date(post.date).toISOString().split('T')[0] : today;
        xml += `  <url>\n    <loc>${baseUrl}/post/${encodeURIComponent(post.slug)}</loc>\n    <lastmod>${postDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      }

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  },

  getPrivacy(req, res) {
    res.render('pages/privacy', {
      title: 'Privacy Policy — EUREKA',
      description: 'Privacy policy, data collection standards, and user protection measures at EUREKA.',
      siteConfig,
      pageType: 'legal',
      topic: 'default',
      activePath: '/privacy'
    });
  },

  getTerms(req, res) {
    res.render('pages/terms', {
      title: 'Terms of Service & Editorial Standards — EUREKA',
      description: 'Terms of service, reader rights, intellectual property, and editorial governance at EUREKA.',
      siteConfig,
      pageType: 'legal',
      topic: 'default',
      activePath: '/terms'
    });
  },

  getContact(req, res) {
    res.render('pages/contact', {
      title: 'Contact & Editorial Office — EUREKA',
      description: 'Get in touch with the EUREKA research and editorial team. Office address, media inquiries, and reader dispatches.',
      siteConfig,
      pageType: 'contact',
      topic: 'default',
      activePath: '/contact',
      error: null
    });
  },

  submitContact(req, res) {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).render('pages/contact', {
        title: 'Contact & Editorial Office — EUREKA',
        description: 'Get in touch with the EUREKA research and editorial team.',
        siteConfig,
        pageType: 'contact',
        topic: 'default',
        activePath: '/contact',
        error: 'Please complete all required fields (Name, Email, Message).'
      });
    }

    res.redirect('/thank-you');
  },

  getThankYou(req, res) {
    res.render('pages/thank-you', {
      title: 'Dispatch Received — EUREKA',
      description: 'Thank you for reaching out to the EUREKA editorial office. Your dispatch has been received.',
      siteConfig,
      pageType: 'thank-you',
      topic: 'default',
      activePath: '/thank-you'
    });
  }
};
