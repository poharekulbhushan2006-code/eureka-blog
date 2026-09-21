// ==========================================================================
// EUREKA — User Interactions, Mobile Navigation, Reader Display & Feedback
// ==========================================================================

function showToast(message, duration = 3000) {
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
    toast.style.transform = 'translateY(100%)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 1. Mobile Navigation Drawer Controller
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) {
      closeMobileNav();
    }
  });

  // ========================================================================
  // 2. Claps Handler (Resilient Client + Serverless Fallback)
  // ========================================================================
  const clapBtn = document.getElementById('clap-btn');
  if (clapBtn) {
    const slug = clapBtn.dataset.slug;
    const clapCountSpan = document.getElementById('clap-count');
    const localClapsKey = `eureka-claps-${slug}`;

    // Restore locally incremented claps if cached
    const cachedClaps = parseInt(localStorage.getItem(localClapsKey), 10);
    if (!isNaN(cachedClaps) && clapCountSpan && cachedClaps > parseInt(clapCountSpan.textContent, 10)) {
      clapCountSpan.textContent = cachedClaps;
    }

    clapBtn.addEventListener('click', async () => {
      try {
        clapBtn.classList.add('clapped');

        // Floating +1 micro-interaction animation
        const rect = clapBtn.getBoundingClientRect();
        const bubble = document.createElement('div');
        bubble.className = 'clap-float-bubble';
        bubble.innerHTML = '<span>👏</span><span>+1</span>';
        bubble.style.left = `${Math.max(10, rect.left + rect.width / 2 - 25)}px`;
        bubble.style.top = `${Math.max(10, rect.top - 15)}px`;
        document.body.appendChild(bubble);
        setTimeout(() => bubble.remove(), 950);

        // Optimistic UI update
        let currentCount = parseInt(clapCountSpan?.textContent || '0', 10) + 1;
        if (clapCountSpan) clapCountSpan.textContent = currentCount;
        localStorage.setItem(localClapsKey, currentCount);

        const res = await fetch(`/api/posts/${slug}/clap`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.claps !== null && clapCountSpan) {
            clapCountSpan.textContent = data.claps;
            localStorage.setItem(localClapsKey, data.claps);
          }
        }
        showToast('👏 Thanks for applauding!');
      } catch (err) {
        console.warn('Network sync for claps bypassed, recorded locally:', err);
        showToast('👏 Applauded!');
      }
    });
  }

  // ========================================================================
  // 3. Bookmark Handler
  // ========================================================================
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) {
    const slug = bookmarkBtn.dataset.slug;
    const title = bookmarkBtn.dataset.title;
    const bookmarks = JSON.parse(localStorage.getItem('eureka-bookmarks') || '[]');

    if (bookmarks.some(b => b.slug === slug)) {
      bookmarkBtn.classList.add('clapped');
      bookmarkBtn.setAttribute('title', 'Remove Bookmark');
    }

    bookmarkBtn.addEventListener('click', () => {
      let current = JSON.parse(localStorage.getItem('eureka-bookmarks') || '[]');
      const exists = current.some(b => b.slug === slug);

      if (exists) {
        current = current.filter(b => b.slug !== slug);
        bookmarkBtn.classList.remove('clapped');
        showToast('Bookmark removed');
      } else {
        current.push({ slug, title, date: new Date().toISOString() });
        bookmarkBtn.classList.add('clapped');
        showToast('Saved to reading list 🔖');
      }

      localStorage.setItem('eureka-bookmarks', JSON.stringify(current));
    });
  }

  // ========================================================================
  // 4. Share / Copy Link Handler
  // ========================================================================
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard! 📋');
      } else {
        showToast(`Article URL: ${url}`);
      }
    });
  }

  // ========================================================================
  // 5. Reader Display Preferences (Font Size & Typography Switcher)
  // ========================================================================
  const articleProse = document.querySelector('.article-prose');
  const readerBar = document.getElementById('reader-controls-bar');
  if (articleProse && readerBar) {
    const savedPrefs = JSON.parse(localStorage.getItem('eureka-reader-prefs') || '{}');
    const size = savedPrefs.size || 'md';
    const font = savedPrefs.font || 'serif';

    articleProse.classList.add(`font-${size}`);
    articleProse.classList.add(`font-${font}-mode`);

    // Mark active buttons
    readerBar.querySelectorAll('[data-font-size]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fontSize === size);
      btn.addEventListener('click', () => {
        articleProse.classList.remove('font-sm', 'font-md', 'font-lg');
        articleProse.classList.add(`font-${btn.dataset.fontSize}`);
        readerBar.querySelectorAll('[data-font-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        savedPrefs.size = btn.dataset.fontSize;
        localStorage.setItem('eureka-reader-prefs', JSON.stringify(savedPrefs));
      });
    });

    readerBar.querySelectorAll('[data-font-family]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fontFamily === font);
      btn.addEventListener('click', () => {
        articleProse.classList.remove('font-serif-mode', 'font-sans-mode');
        articleProse.classList.add(`font-${btn.dataset.fontFamily}-mode`);
        readerBar.querySelectorAll('[data-font-family]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        savedPrefs.font = btn.dataset.fontFamily;
        localStorage.setItem('eureka-reader-prefs', JSON.stringify(savedPrefs));
      });
    });
  }

  // ========================================================================
  // 6. Text Selection & Floating Quote Citation Tooltip
  // ========================================================================
  if (articleProse) {
    let quoteTooltip = null;

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (!selectedText || selectedText.length < 8 || selectedText.length > 500) {
        if (quoteTooltip) {
          quoteTooltip.remove();
          quoteTooltip = null;
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Only show if selection is within the article container
      if (!articleProse.contains(range.commonAncestorContainer)) {
        if (quoteTooltip) quoteTooltip.remove();
        return;
      }

      if (!quoteTooltip) {
        quoteTooltip = document.createElement('div');
        quoteTooltip.className = 'quote-share-tooltip';
        quoteTooltip.innerHTML = `
          <button type="button" class="quote-share-btn" id="quote-copy-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span>Copy Quote</span>
          </button>
        `;
        document.body.appendChild(quoteTooltip);

        document.getElementById('quote-copy-btn')?.addEventListener('click', async () => {
          const citation = `"${selectedText}" — EUREKA Journal (${window.location.href})`;
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(citation);
            showToast('Quote & Citation copied! 📖');
          }
          if (quoteTooltip) quoteTooltip.remove();
        });
      }

      quoteTooltip.style.left = `${Math.max(10, rect.left + rect.width / 2 - 60)}px`;
      quoteTooltip.style.top = `${Math.max(10, window.scrollY + rect.top - 38)}px`;
    });
  }

  // ========================================================================
  // 7. Newsletter Form
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
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message);
          newsletterForm.reset();
        } else {
          showToast(data.error || 'Failed to subscribe');
        }
      } catch (err) {
        showToast('Subscription failed. Please try again.');
      }
    });
  }

  // ========================================================================
  // 8. Mobile Sticky CTA Share Trigger
  // ========================================================================
  const mobileShareTrigger = document.getElementById('mobile-share-trigger');
  if (mobileShareTrigger) {
    mobileShareTrigger.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        text: 'Read this essay on EUREKA:',
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // User dismissed or share failed
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard! 📋');
      } else {
        showToast(`Article URL: ${window.location.href}`);
      }
    });
  }

  // ========================================================================
  // 9. Form Validation & Loading States
  // ========================================================================
  const validatedForms = document.querySelectorAll('.eureka-validated-form');
  validatedForms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      let isFormValid = true;
      let firstInvalid = null;

      inputs.forEach(input => {
        const isValid = validateField(input);
        if (!isValid) {
          isFormValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!isFormValid) {
        e.preventDefault();
        if (firstInvalid) firstInvalid.focus();
        showToast('⚠️ Please correct highlighted fields.');
        return false;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('is-loading');
      }
    });
  });

  function validateField(field) {
    if (!field.hasAttribute('required') && !field.value.trim()) {
      field.classList.remove('is-invalid');
      const errorMsg = field.parentElement ? field.parentElement.querySelector('.field-error-msg') : null;
      if (errorMsg) errorMsg.style.display = 'none';
      return true;
    }

    let isValid = true;
    const value = field.value.trim();

    if (field.hasAttribute('required') && !value) {
      isValid = false;
    } else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
    } else if (field.tagName === 'TEXTAREA' && field.hasAttribute('required') && value.length < 10) {
      isValid = false;
    }

    const errorMsg = field.parentElement ? field.parentElement.querySelector('.field-error-msg') : null;
    if (!isValid) {
      field.classList.add('is-invalid');
      if (errorMsg) errorMsg.style.display = 'block';
    } else {
      field.classList.remove('is-invalid');
      if (errorMsg) errorMsg.style.display = 'none';
    }

    return isValid;
  }
});
