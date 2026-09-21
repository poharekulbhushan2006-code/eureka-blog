// ==========================================================================
// EUREKA — Senior Full-Stack Interactions, Reading List, TOC & Editorial UX
// ==========================================================================

function showToast(message, duration = 2800) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 180ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 1. Live Masthead Date
  // ========================================================================
  const liveDateEl = document.getElementById('masthead-live-date');
  if (liveDateEl) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    liveDateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // ========================================================================
  // 2. Mobile Navigation Drawer Controller
  // ========================================================================
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');
  const mobileClose = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    if (!mobileDrawer || !mobileOverlay) return;
    mobileDrawer.classList.add('open');
    mobileOverlay.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    mobileOverlay.setAttribute('aria-hidden', 'false');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!mobileDrawer || !mobileOverlay) return;
    mobileDrawer.classList.remove('open');
    mobileOverlay.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileNav);

  // ========================================================================
  // 3. Saved Reading List ("Save for Later") Drawer & Manager
  // ========================================================================
  const readingListToggle = document.getElementById('reading-list-toggle');
  const readingListDrawer = document.getElementById('reading-list-drawer');
  const readingListOverlay = document.getElementById('reading-list-overlay');
  const readingListClose = document.getElementById('reading-list-close');
  const readingListContainer = document.getElementById('reading-list-container');
  const readingListClearBtn = document.getElementById('reading-list-clear-btn');
  const savedCountBadge = document.getElementById('saved-count-badge');

  function getSavedPosts() {
    try {
      return JSON.parse(localStorage.getItem('eureka_saved_posts') || '[]');
    } catch {
      return [];
    }
  }

  function setSavedPosts(posts) {
    localStorage.setItem('eureka_saved_posts', JSON.stringify(posts));
    updateSavedUI();
  }

  function updateSavedUI() {
    const posts = getSavedPosts();
    if (savedCountBadge) {
      savedCountBadge.textContent = posts.length;
      savedCountBadge.style.display = posts.length > 0 ? 'inline-flex' : 'inline-flex';
    }

    // Update bookmark button state on article page
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) {
      const currentSlug = bookmarkBtn.dataset.slug;
      const isSaved = posts.some(p => p.slug === currentSlug);
      const textSpan = bookmarkBtn.querySelector('.action-btn-text');
      if (isSaved) {
        bookmarkBtn.classList.add('active');
        if (textSpan) textSpan.textContent = 'Saved';
      } else {
        bookmarkBtn.classList.remove('active');
        if (textSpan) textSpan.textContent = 'Save';
      }
    }

    // Update inline save buttons on home page
    document.querySelectorAll('.inline-save-btn').forEach(btn => {
      const slug = btn.dataset.slug;
      const isSaved = posts.some(p => p.slug === slug);
      const span = btn.querySelector('span');
      if (isSaved) {
        btn.classList.add('active');
        if (span) span.textContent = 'Saved';
      } else {
        btn.classList.remove('active');
        if (span) span.textContent = 'Save';
      }
    });

    renderReadingListDrawer();
  }

  function renderReadingListDrawer() {
    if (!readingListContainer) return;
    const posts = getSavedPosts();

    if (posts.length === 0) {
      readingListContainer.innerHTML = `
        <div class="reading-list-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-muted-foreground); margin-bottom: 8px;">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <p style="font-size: var(--text-sm); color: var(--color-muted-foreground); margin: 0;">
            Your reading list is empty. Click Save on any essay to read it later.
          </p>
        </div>
      `;
      if (readingListClearBtn) readingListClearBtn.style.display = 'none';
      return;
    }

    if (readingListClearBtn) readingListClearBtn.style.display = 'block';

    let html = '';
    posts.forEach(item => {
      html += `
        <div class="reading-list-item">
          <a href="/post/${encodeURIComponent(item.slug)}" class="reading-list-item-title">${escapeHtml(item.title)}</a>
          <div class="reading-list-item-meta">
            <span>Saved ${item.savedAt || 'Recently'}</span>
            <button type="button" class="remove-saved-btn" data-slug="${encodeURIComponent(item.slug)}">Remove</button>
          </div>
        </div>
      `;
    });
    readingListContainer.innerHTML = html;

    readingListContainer.querySelectorAll('.remove-saved-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slugToRemove = btn.dataset.slug;
        const remaining = getSavedPosts().filter(p => p.slug !== slugToRemove);
        setSavedPosts(remaining);
        showToast('Removed from reading list');
      });
    });
  }

  function openReadingList() {
    if (!readingListDrawer || !readingListOverlay) return;
    readingListDrawer.classList.add('open');
    readingListOverlay.classList.add('open');
    readingListDrawer.setAttribute('aria-hidden', 'false');
    readingListOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeReadingList() {
    if (!readingListDrawer || !readingListOverlay) return;
    readingListDrawer.classList.remove('open');
    readingListOverlay.classList.remove('open');
    readingListDrawer.setAttribute('aria-hidden', 'true');
    readingListOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (readingListToggle) readingListToggle.addEventListener('click', openReadingList);
  if (readingListClose) readingListClose.addEventListener('click', closeReadingList);
  if (readingListOverlay) readingListOverlay.addEventListener('click', closeReadingList);

  if (readingListClearBtn) {
    readingListClearBtn.addEventListener('click', () => {
      setSavedPosts([]);
      showToast('Reading list cleared');
    });
  }

  // Handle article page bookmark button
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      const slug = bookmarkBtn.dataset.slug;
      const title = bookmarkBtn.dataset.title;
      let posts = getSavedPosts();
      const existingIdx = posts.findIndex(p => p.slug === slug);

      if (existingIdx > -1) {
        posts.splice(existingIdx, 1);
        setSavedPosts(posts);
        showToast('Removed from reading list');
      } else {
        posts.unshift({
          slug,
          title,
          savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        setSavedPosts(posts);
        showToast('Saved to reading list');
      }
    });
  }

  // Handle home page inline save buttons
  document.querySelectorAll('.inline-save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const slug = btn.dataset.slug;
      const title = btn.dataset.title;
      let posts = getSavedPosts();
      const existingIdx = posts.findIndex(p => p.slug === slug);

      if (existingIdx > -1) {
        posts.splice(existingIdx, 1);
        setSavedPosts(posts);
        showToast('Removed from reading list');
      } else {
        posts.unshift({
          slug,
          title,
          savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        setSavedPosts(posts);
        showToast('Saved to reading list');
      }
    });
  });

  // Initialize saved UI on load
  updateSavedUI();

  // Escape key closes drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileDrawer && mobileDrawer.classList.contains('open')) closeMobileNav();
      if (readingListDrawer && readingListDrawer.classList.contains('open')) closeReadingList();
    }
  });

  // ========================================================================
  // 4. Dynamic Table of Contents (TOC) with Scroll-Spy
  // ========================================================================
  const articleContent = document.getElementById('article-prose-content');
  const tocBox = document.getElementById('table-of-contents-box');
  const tocNavList = document.getElementById('toc-nav-list');

  if (articleContent && tocBox && tocNavList) {
    const headings = articleContent.querySelectorAll('h2, h3');
    if (headings.length >= 2) {
      tocBox.style.display = 'block';
      let tocHtml = '';

      headings.forEach((heading, idx) => {
        if (!heading.id) {
          heading.id = 'section-' + (idx + 1) + '-' + heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        const isH3 = heading.tagName.toLowerCase() === 'h3';
        tocHtml += `
          <a href="#${heading.id}" class="toc-nav-link ${isH3 ? 'sub-heading' : ''}" data-target="${heading.id}">
            ${escapeHtml(heading.textContent)}
          </a>
        `;
      });

      tocNavList.innerHTML = tocHtml;

      // Smooth scroll on click
      tocNavList.querySelectorAll('.toc-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('data-target');
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', '#' + targetId);
          }
        });
      });

      // Scroll-Spy IntersectionObserver
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tocNavList.querySelectorAll('.toc-nav-link').forEach(l => {
              l.classList.toggle('active', l.getAttribute('data-target') === id);
            });
          }
        });
      }, { rootMargin: '-80px 0px -70% 0px' });

      headings.forEach(h => observer.observe(h));
    }
  }

  // ========================================================================
  // 5. Code Block 1-Click Copy Injector
  // ========================================================================
  if (articleContent) {
    const preBlocks = articleContent.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.type = 'button';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');

      copyBtn.addEventListener('click', async () => {
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(codeText);
          } else {
            const ta = document.createElement('textarea');
            ta.value = codeText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
          showToast('Code copied to clipboard');
        } catch (err) {
          showToast('Failed to copy code');
        }
      });

      pre.appendChild(copyBtn);
    });
  }

  // ========================================================================
  // 6. Claps Handler
  // ========================================================================
  const clapBtn = document.getElementById('clap-btn');
  if (clapBtn) {
    const slug = clapBtn.dataset.slug;
    const clapCountSpan = document.getElementById('clap-count');
    const localClapsKey = `eureka-claps-${slug}`;

    const cachedClaps = parseInt(localStorage.getItem(localClapsKey), 10);
    if (!isNaN(cachedClaps) && clapCountSpan && cachedClaps > parseInt(clapCountSpan.textContent, 10)) {
      clapCountSpan.textContent = cachedClaps;
    }

    clapBtn.addEventListener('click', async () => {
      try {
        let currentCount = parseInt(clapCountSpan?.textContent || '0', 10) + 1;
        if (clapCountSpan) clapCountSpan.textContent = currentCount;
        localStorage.setItem(localClapsKey, currentCount);

        const res = await fetch(`/api/posts/${slug}/clap`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.claps !== null && clapCountSpan) {
            clapCountSpan.textContent = data.claps;
            localStorage.setItem(localClapsKey, data.claps);
          }
        }
        showToast('Thanks for applauding!');
      } catch (err) {
        showToast('Applauded!');
      }
    });
  }

  // ========================================================================
  // 7. Share / Copy Link Handler
  // ========================================================================
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: url
          });
          return;
        } catch {}
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard');
      } else {
        showToast(`Article URL: ${url}`);
      }
    });
  }

  // ========================================================================
  // 8. Reader Display Preferences (Font Size & Typography Switcher)
  // ========================================================================
  const readerBar = document.getElementById('reader-controls-bar');
  if (articleContent && readerBar) {
    const savedPrefs = JSON.parse(localStorage.getItem('eureka-reader-prefs') || '{}');
    const size = savedPrefs.size || 'md';
    const font = savedPrefs.font || 'serif';

    articleContent.classList.add(`font-${size}`);
    articleContent.classList.add(`font-${font}-mode`);

    readerBar.querySelectorAll('[data-font-size]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fontSize === size);
      btn.addEventListener('click', () => {
        articleContent.classList.remove('font-sm', 'font-md', 'font-lg');
        articleContent.classList.add(`font-${btn.dataset.fontSize}`);
        readerBar.querySelectorAll('[data-font-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        savedPrefs.size = btn.dataset.fontSize;
        localStorage.setItem('eureka-reader-prefs', JSON.stringify(savedPrefs));
      });
    });

    readerBar.querySelectorAll('[data-font-family]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fontFamily === font);
      btn.addEventListener('click', () => {
        articleContent.classList.remove('font-serif-mode', 'font-sans-mode');
        articleContent.classList.add(`font-${btn.dataset.fontFamily}-mode`);
        readerBar.querySelectorAll('[data-font-family]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        savedPrefs.font = btn.dataset.fontFamily;
        localStorage.setItem('eureka-reader-prefs', JSON.stringify(savedPrefs));
      });
    });
  }

  // ========================================================================
  // 9. Newsletter Form
  // ========================================================================
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Subscribed successfully');
          newsletterForm.reset();
        } else {
          showToast(data.error || 'Failed to subscribe');
        }
      } catch (err) {
        showToast('Subscribed to EUREKA Letters');
        newsletterForm.reset();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
});
