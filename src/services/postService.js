import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust path resolution for both local and Vercel serverless environments
function resolveDataFile() {
  const candidates = [
    path.join(process.cwd(), 'data/posts.json'),
    path.join(__dirname, '../../data/posts.json'),
    path.join(__dirname, '../data/posts.json'),
    '/var/task/data/posts.json',
  ];
  // Return first existing path or default to cwd-based
  // (We'll try all at runtime in loadPosts)
  return candidates;
}

const DATA_FILE_CANDIDATES = resolveDataFile();

console.log('[postService] cwd:', process.cwd());
console.log('[postService] __dirname:', __dirname);
console.log('[postService] DATA_FILE_CANDIDATES:', DATA_FILE_CANDIDATES);

class PostService {
  constructor() {
    this.postsCache = null;
    this.lastLoaded = 0;
    this.activeDataFile = DATA_FILE_CANDIDATES[0]; // default, updated when successfully read
  }

  async loadPosts() {
    // Try each candidate path until one works
    for (const candidate of DATA_FILE_CANDIDATES) {
      try {
        const raw = await fs.readFile(candidate, 'utf-8');
        const parsed = JSON.parse(raw);
        this.postsCache = parsed;
        this.lastLoaded = Date.now();
        this.activeDataFile = candidate;
        console.log(`[postService] Loaded ${parsed.length} posts from: ${candidate}`);
        return this.postsCache;
      } catch (err) {
        console.warn(`[postService] Could not read ${candidate}:`, err.message);
      }
    }
    console.error('[postService] All data file paths failed! Returning empty array.');
    return this.postsCache || [];
  }

  async getPosts() {
    if (!this.postsCache || Date.now() - this.lastLoaded > 60000) {
      await this.loadPosts();
    }
    return this.postsCache || [];
  }

  calculateReadingTime(text) {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 225));
    return `${minutes} min read`;
  }

  sanitizeRenderedHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html
      // 1. Strip dangerous executable tags completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/<base\b[^>]*>/gi, '')
      // 2. Strip dangerous inline event handlers (onerror, onclick, onload, etc.)
      .replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      // 3. Neutralize javascript: and vbscript: URIs in href and src
      .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"')
      .replace(/src\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'src=""')
      .replace(/href\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, 'href="#"')
      .replace(/src\s*=\s*(?:'vbscript:[^']*'|"vbscript:[^"]*"|vbscript:[^\s>]+)/gi, 'src=""');
  }

  extractHeadingsAndHtml(markdown) {
    const headings = [];
    const renderer = new marked.Renderer();

    renderer.heading = function (token) {
      const text = typeof token === 'object' ? token.text : token;
      const level = typeof token === 'object' ? token.depth : arguments[1];
      const plainText = typeof text === 'string' ? text.replace(/<[^>]*>/g, '') : '';
      const slug = plainText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      if (level >= 2 && level <= 3) {
        headings.push({ text: plainText, level, slug });
      }
      return `<h${level} id="${slug}" class="heading-anchor">${text}</h${level}>`;
    };

    const rawHtml = marked.parse(markdown || '', { renderer, gfm: true, breaks: true });
    const html = this.sanitizeRenderedHtml(rawHtml);
    return { html, headings };
  }

  async getAllPosts({ category, tag, query, page = 1, limit = 10 } = {}) {
    let posts = await this.getPosts();

    if (category) {
      posts = posts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (tag) {
      posts = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }

    if (query) {
      const q = query.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.author && p.author.name.toLowerCase().includes(q))
      );
    }

    posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    const total = posts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit).map(p => ({
      ...p,
      readingTime: this.calculateReadingTime(p.content)
    }));

    return {
      posts: paginatedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getFeaturedPost() {
    const posts = await this.getPosts();
    const featured = posts.find(p => p.featured) || posts[0];
    if (!featured) return null;
    return {
      ...featured,
      readingTime: this.calculateReadingTime(featured.content)
    };
  }

  async getTrendingPosts(limit = 4) {
    const posts = await this.getPosts();
    return posts
      .filter(p => p.trending)
      .slice(0, limit)
      .map(p => ({
        ...p,
        readingTime: this.calculateReadingTime(p.content)
      }));
  }

  async getPostBySlug(slug) {
    const posts = await this.getPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) return null;

    const { html, headings } = this.extractHeadingsAndHtml(post.content);
    return {
      ...post,
      readingTime: this.calculateReadingTime(post.content),
      renderedHtml: html,
      toc: headings
    };
  }

  async getRelatedPosts(currentSlug, category, limit = 3) {
    const posts = await this.getPosts();
    return posts
      .filter(p => p.slug !== currentSlug && p.category.toLowerCase() === category.toLowerCase())
      .slice(0, limit)
      .map(p => ({
        ...p,
        readingTime: this.calculateReadingTime(p.content)
      }));
  }

  async getAllCategories() {
    const posts = await this.getPosts();
    const map = new Map();
    for (const post of posts) {
      const count = map.get(post.category) || 0;
      map.set(post.category, count + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }

  async getAllTags() {
    const posts = await this.getPosts();
    const map = new Map();
    for (const post of posts) {
      if (Array.isArray(post.tags)) {
        for (const t of post.tags) {
          map.set(t, (map.get(t) || 0) + 1);
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async createPost({ title, subtitle, category, tags, content, authorName, authorRole }) {
    const posts = await this.getPosts();
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString().slice(-4));

    const excerpt = content
      .replace(/#+\s/g, '')
      .replace(/[`*_[\]]/g, '')
      .slice(0, 180)
      .trim() + '...';

    const newPost = {
      id: `post-${Date.now()}`,
      slug,
      title,
      subtitle: subtitle || '',
      excerpt,
      category: category || 'Psychology',
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean),
      author: {
        name: authorName || 'EUREKA Research',
        role: authorRole || 'Research Fellow',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Contributor to the EUREKA Research Journal.'
      },
      publishedAt: new Date().toISOString().split('T')[0],
      featured: false,
      trending: false,
      claps: 0,
      views: 1,
      coverGradient: 'linear-gradient(135deg, #18181b 0%, #312e81 50%, #4f46e5 100%)',
      content
    };

    posts.unshift(newPost);
    try {
      await fs.writeFile(this.activeDataFile, JSON.stringify(posts, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn('[postService] Could not persist post (read-only filesystem on Vercel):', writeErr.message);
    }
    this.postsCache = posts;
    this.lastLoaded = Date.now();
    return newPost;
  }

  async incrementClaps(slug) {
    const posts = await this.getPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) return null;
    post.claps = (post.claps || 0) + 1;
    try {
      await fs.writeFile(this.activeDataFile, JSON.stringify(posts, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn('[postService] Could not persist claps (read-only filesystem on Vercel):', writeErr.message);
    }
    return post.claps;
  }

  async search(query) {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const posts = await this.getPosts();
    return posts
      .filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      )
      .slice(0, 8)
      .map(p => ({
        title: p.title,
        slug: p.slug,
        category: p.category,
        excerpt: p.excerpt,
        publishedAt: p.publishedAt,
        readingTime: this.calculateReadingTime(p.content)
      }));
  }
}

export const postService = new PostService();
