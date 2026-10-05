// ==========================================================================
// ARCHIVE READER — Client Interactions & TOC Navigator
// Handles dynamic table of contents, reading preferences, applaud,
// reading list persistence, and share links with minimal 150ms transitions.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const proseContent = document.getElementById('archive-prose-content');
  const tocContainer = document.getElementById('archive-toc-list');
  const tocBox = document.getElementById('archive-toc-box');

  // ========================================================================
  // 1. Dynamic Table of Contents Generator & Intersection Observer
  // ========================================================================
  if (proseContent && tocContainer) {
    const headings = proseContent.querySelectorAll('h2, h3');

    if (headings.length > 0) {
      if (tocBox) tocBox.style.display = 'block';
      tocContainer.innerHTML = '';

      headings.forEach((heading, idx) => {
        let id = heading.id;
        if (!id) {
          id = 'section-' + (idx + 1) + '-' + heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          heading.id = id;
        }

        const link = document.createElement('a');
        link.href = '#' + id;
        link.className = 'archive-toc-link' + (heading.tagName.toLowerCase() === 'h3' ? ' sub-heading' : '');
        link.textContent = heading.textContent.replace(/^#+\s*/, '').replace(/^[0-9]+[—\.\s]*/, '');

        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.getElementById(id);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', '#' + id);
          }
        });

        tocContainer.appendChild(link);
      });

      // Active Section Highlighting
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const currentId = entry.target.id;
            tocContainer.querySelectorAll('.archive-toc-link').forEach(a => {
              if (a.getAttribute('href') === '#' + currentId) {
                a.classList.add('active');
              } else {
                a.classList.remove('active');
              }
            });
          }
        });
      }, {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
      });

      headings.forEach(h => observer.observe(h));
    }
  }

  // ========================================================================
  // 2. Reading Controls (Type Size Switcher)
  // ========================================================================
  const sizeButtons = document.querySelectorAll('[data-ar-size]');
  const fontButtons = document.querySelectorAll('[data-ar-font]');

  // Load preferences from localStorage
  try {
    const prefs = JSON.parse(localStorage.getItem('eureka-archive-prefs') || '{}');
    if (prefs.size) applySize(prefs.size);
    if (prefs.font) applyFont(prefs.font);
  } catch (e) {}

  function applySize(size) {
    if (!proseContent) return;
    sizeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-ar-size') === size);
    });

    if (size === 'sm') {
      proseContent.style.fontSize = '15.2px';
      proseContent.style.lineHeight = '25px';
    } else if (size === 'lg') {
      proseContent.style.fontSize = '19px';
      proseContent.style.lineHeight = '30px';
    } else {
      proseContent.style.fontSize = '16.8px';
      proseContent.style.lineHeight = '27.3px';
    }

    try {
      const prefs = JSON.parse(localStorage.getItem('eureka-archive-prefs') || '{}');
      prefs.size = size;
      localStorage.setItem('eureka-archive-prefs', JSON.stringify(prefs));
    } catch (e) {}
  }

  function applyFont(font) {
    if (!proseContent) return;
    fontButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-ar-font') === font);
    });

    if (font === 'sans') {
      proseContent.style.fontFamily = 'var(--font-sans)';
    } else {
      proseContent.style.fontFamily = 'var(--ar-font-body)';
    }

    try {
      const prefs = JSON.parse(localStorage.getItem('eureka-archive-prefs') || '{}');
      prefs.font = font;
      localStorage.setItem('eureka-archive-prefs', JSON.stringify(prefs));
    } catch (e) {}
  }

  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => applySize(btn.getAttribute('data-ar-size')));
  });

  fontButtons.forEach(btn => {
    btn.addEventListener('click', () => applyFont(btn.getAttribute('data-ar-font')));
  });

  // ========================================================================
  // 3. Applaud Button (Live Clap Counter)
  // ========================================================================
  const clapBtn = document.getElementById('archive-clap-btn');
  const clapCountEl = document.getElementById('archive-clap-count');

  if (clapBtn && clapCountEl) {
    const slug = clapBtn.getAttribute('data-slug');
    let hasClapped = false;

    clapBtn.addEventListener('click', async () => {
      let current = parseInt(clapCountEl.textContent, 10) || 0;
      current += 1;
      clapCountEl.textContent = current;
      clapBtn.classList.add('active');

      if (window.showToast) {
        window.showToast('Applauded essay (+1)');
      }

      try {
        await fetch(`/api/posts/${slug}/clap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('Failed to register clap:', err);
      }
    });
  }

  // ========================================================================
  // 4. Bookmark / Save to Reading List
  // ========================================================================
  const bookmarkBtn = document.getElementById('archive-save-btn');
  if (bookmarkBtn) {
    const slug = bookmarkBtn.getAttribute('data-slug');
    const title = bookmarkBtn.getAttribute('data-title');

    function checkSaved() {
      try {
        const saved = JSON.parse(localStorage.getItem('eureka_saved_posts') || '[]');
        const isSaved = saved.some(item => (typeof item === 'string' ? item : item.slug) === slug);
        bookmarkBtn.classList.toggle('active', isSaved);
      } catch (e) {}
    }

    checkSaved();

    bookmarkBtn.addEventListener('click', () => {
      try {
        let saved = JSON.parse(localStorage.getItem('eureka_saved_posts') || '[]');
        const existingIdx = saved.findIndex(item => (typeof item === 'string' ? item : item.slug) === slug);

        if (existingIdx >= 0) {
          saved.splice(existingIdx, 1);
          bookmarkBtn.classList.remove('active');
          if (window.showToast) window.showToast('Removed from Reading List');
        } else {
          saved.push({
            slug: slug,
            title: title || document.title,
            savedAt: new Date().toISOString()
          });
          bookmarkBtn.classList.add('active');
          if (window.showToast) window.showToast('Saved to Reading List');
        }
        localStorage.setItem('eureka_saved_posts', JSON.stringify(saved));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
    });
  }

  // ========================================================================
  // 5. Share Link Copy
  // ========================================================================
  const shareBtn = document.getElementById('archive-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          if (window.showToast) window.showToast('Article link copied to clipboard');
        } else {
          const temp = document.createElement('input');
          temp.value = url;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
          if (window.showToast) window.showToast('Article link copied to clipboard');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Copy URL from address bar');
      }
    });
  }

  // ========================================================================
  // 6. Code Snippets Copy Buttons
  // ========================================================================
  if (proseContent) {
    const preBlocks = proseContent.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      if (!pre.querySelector('.code-copy-btn')) {
        const btn = document.createElement('button');
        btn.className = 'archive-ctrl-btn';
        btn.style.position = 'absolute';
        btn.style.top = '8px';
        btn.style.right = '8px';
        btn.style.fontSize = '9px';
        btn.style.padding = '2px 6px';
        btn.textContent = 'COPY';

        btn.addEventListener('click', async () => {
          const code = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
          try {
            await navigator.clipboard.writeText(code);
            btn.textContent = 'COPIED!';
            setTimeout(() => { btn.textContent = 'COPY'; }, 1800);
          } catch (e) {}
        });

        pre.appendChild(btn);
      }
    });
  }
});
