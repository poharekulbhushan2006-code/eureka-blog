# Eureka Blog — Modernist Editorial Tech Platform

> An editorial tech publication and blogging platform crafted with **Swiss Modernism 2.0** design principles and senior-developer **Node.js** architecture.

---

## 🌟 Features

- **Swiss Modernism 2.0 Aesthetic**: Editorial typography pairing **Libre Bodoni** (serif headlines) with **Public Sans** (geometric body) and **JetBrains Mono** (code blocks).
- **Asymmetric 12-Column Grid**: Dynamic magazine layouts with featured story heroes and trending numbered dispatches (`01`, `02`, `03`, `04`).
- **Zero-Flicker Light & Dark Theme Switcher**: Automatically syncs with OS theme preferences and saves to `localStorage`.
- **Dynamic Reading Progress Bar**: Real-time progress bar docked to the top of the viewport during article reading.
- **Sticky Table of Contents (TOC)**: Auto-generated from Markdown headings with active scrollspy indicator.
- **Command Palette Search (Ctrl+K / Cmd+K / `/`)**: Instant fuzzy search across articles, topics, and authors with keyboard navigation.
- **Interactive Action Rail**: 👏 Claps counter with animated feedback, 🔖 bookmarking saved to `localStorage`, and 📋 one-click link copying.
- **Eureka Studio (`/editor`)**: Markdown authoring studio with live split-screen preview, real-time word count, reading-time calculator, draft auto-save, and instant publishing.

---

## 🏗️ Architecture

- **Runtime**: Node.js (v24 LTS, Native ES Modules `"type": "module"`)
- **Web Framework**: Express.js
- **Templating**: EJS with reusable partials
- **Security & Performance**: Helmet, Gzip compression, CORS
- **Markdown Engine**: `marked` with custom heading slug renderer

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or for development with automatic restart:
```bash
npm run dev
```

### 3. Open in Browser
Visit: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
eureka-blog/
├── package.json
├── README.md
├── .gitignore
├── data/
│   └── posts.json             # Seed articles
├── src/
│   ├── app.js                 # Express app & middleware setup
│   ├── server.js              # Server entry point & graceful shutdown
│   ├── config/
│   │   └── site.js            # Site metadata & navigation
│   ├── controllers/
│   │   ├── postController.js  # Pages: Home, Post, Category, Tag, About
│   │   ├── editorController.js# Studio & publishing handlers
│   │   └── apiController.js   # Live search, claps, newsletter
│   ├── services/
│   │   └── postService.js     # Post repository, TOC extractor, search
│   ├── middleware/
│   │   ├── errorHandler.js    # 404 & global error handling
│   │   └── requestLogger.js   # HTTP request logging
│   └── routes/
│       ├── webRoutes.js       # Page routes
│       └── apiRoutes.js       # REST API endpoints
├── public/
│   ├── css/
│   │   ├── tokens.css         # Swiss Modernism 2.0 design tokens
│   │   ├── base.css           # Resets, typography, grid system
│   │   ├── components.css     # Navbar, hero, cards, modal, toast
│   │   ├── article.css        # Drop caps, pull quotes, code blocks, TOC
│   │   └── editor.css         # Split-screen writing studio
│   └── js/
│       ├── theme.js           # Theme toggle & storage logic
│       ├── reading-progress.js# Scroll-driven progress bar
│       ├── search.js          # Command palette (Ctrl+K)
│       ├── interactions.js    # Claps, bookmarks, toast alerts
│       └── editor.js          # Live markdown preview & draft save
└── views/
    ├── partials/
    │   ├── head.ejs           # FOUC-free head markup
    │   ├── header.ejs         # Navigation & search trigger
    │   ├── footer.ejs         # Swiss-grid footer
    │   ├── search-modal.ejs   # Command palette overlay
    │   └── scripts.ejs        # Script tags & toast container
    └── pages/
        ├── index.ejs          # Editorial magazine homepage
        ├── post.ejs           # Long-form article with TOC & rail
        ├── category.ejs       # Category & tag filter page
        ├── editor.ejs         # Eureka Studio writing interface
        ├── about.ejs          # Manifesto & masthead
        └── 404.ejs            # Minimalist error page
```

---

## 📄 License
MIT
