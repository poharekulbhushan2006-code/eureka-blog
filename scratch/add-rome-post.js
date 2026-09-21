import fs from 'fs';
import path from 'path';

const postsFile = 'C:\\Users\\kulbhushan\\.gemini\\antigravity-ide\\scratch\\eureka-blog\\data\\posts.json';
const contentFile = 'C:\\Users\\kulbhushan\\.gemini\\antigravity-ide\\scratch\\eureka-blog\\scratch\\rome-content.md';

const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
const content = fs.readFileSync(contentFile, 'utf8');

const romePost = {
  id: 'post-3',
  slug: 'rome-wasnt-built-in-a-day-and-it-didnt-fall-in-one-either',
  title: 'Rome Wasn’t Built in a Day — And It Didn’t Fall in One Either',
  subtitle: 'How a small city became one of the ancient world\'s most powerful states—and how centuries of pressure eventually fractured the Western Roman Empire.',
  excerpt: 'Rome\'s story is not simply one of conquest and collapse. It is the story of an imperial system built on military organization, roads, legal citizenship, and provincial integration—and how scale eventually became its greatest challenge.',
  category: 'History & Civilization',
  tags: [
    'Roman Empire',
    'History',
    'Ancient Civilizations',
    'Imperial Systems',
    'Geopolitics'
  ],
  author: {
    name: 'Antara Morankar',
    role: 'Researched & Written by',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Historical systems synthesis, behavioral analysis, and long-form essays on human civilizations.'
  },
  publishedAt: '2026-09-20',
  featured: false,
  trending: true,
  claps: 1284,
  views: 18920,
  coverGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #d97706 100%)',
  content: content
};

const existingIndex = posts.findIndex(p => p.slug === romePost.slug);
if (existingIndex >= 0) {
  posts[existingIndex] = romePost;
  console.log('Updated existing Rome post.');
} else {
  posts.push(romePost);
  console.log('Added new Rome post.');
}

fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), 'utf8');
console.log('Successfully saved posts.json. Total posts:', posts.length);
