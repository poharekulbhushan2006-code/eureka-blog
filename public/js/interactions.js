// User Interactions & Feedback
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
  // 1. Claps Handler
  const clapBtn = document.getElementById('clap-btn');
  if (clapBtn) {
    const slug = clapBtn.dataset.slug;
    const clapCountSpan = document.getElementById('clap-count');

    clapBtn.addEventListener('click', async () => {
      try {
        clapBtn.classList.add('clapped');

        // Floating +1 micro-interaction animation
        const rect = clapBtn.getBoundingClientRect();
        const bubble = document.createElement('div');
        bubble.className = 'clap-float-bubble';
        bubble.innerHTML = '<span>👏</span><span>+1</span>';
        bubble.style.left = `${rect.left + rect.width / 2 - 25}px`;
        bubble.style.top = `${rect.top - 15}px`;
        document.body.appendChild(bubble);
        setTimeout(() => bubble.remove(), 950);

        const res = await fetch(`/api/posts/${slug}/clap`, { method: 'POST' });
        const data = await res.json();
        if (data.success && clapCountSpan) {
          clapCountSpan.textContent = data.claps;
          showToast('👏 Thanks for your appreciation!');
        }
      } catch (err) {
        console.error('Error clapping:', err);
      }
    });
  }

  // 2. Bookmark Handler
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
        showToast('Saved to your reading list 🔖');
      }

      localStorage.setItem('eureka-bookmarks', JSON.stringify(current));
    });
  }

  // 3. Share / Copy Link Handler
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

  // 4. Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value : '';

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  // 5. Active TOC Scrollspy
  const tocLinks = document.querySelectorAll('.toc-link');
  const headings = document.querySelectorAll('.article-prose h2, .article-prose h3');

  if (tocLinks.length && headings.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });

    headings.forEach(h => observer.observe(h));
  }

  // 6. Mobile Sticky CTA Share Trigger
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

  // 7. Form Validation & Loading States
  const validatedForms = document.querySelectorAll('.eureka-validated-form');
  validatedForms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    // Validate on blur
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

      // Activate loading state on submit button
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

// ==========================================================================
// 8. Privacy-Friendly Reader Analytics Engine (Zero PII, Zero Ad Tracking)
// ==========================================================================
window.EurekaAnalytics = (function() {
  const STORAGE_KEY = 'eureka_cookie_consent_v1';
  let isEnabled = false;

  function checkConsent() {
    try {
      const consent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return consent && consent.analytics === true;
    } catch (e) {
      return false;
    }
  }

  function trackEvent(category, action, label = null) {
    if (!checkConsent() && !isEnabled) return;
    
    // Record privacy-friendly anonymous event locally & in console for transparency
    const eventPayload = {
      timestamp: new Date().toISOString(),
      category,
      action,
      label,
      path: window.location.pathname,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    if (window.console && console.debug) {
      console.debug('[EUREKA Analytics Event]', eventPayload);
    }
  }

  // Track initial page view & reading duration
  const startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const readingDurationSeconds = Math.round((Date.now() - startTime) / 1000);
    if (readingDurationSeconds > 5) {
      trackEvent('Engagement', 'Reading Duration', `${readingDurationSeconds}s`);
    }
  });

  return {
    enable: function() {
      isEnabled = true;
      trackEvent('Consent', 'Analytics Granted');
    },
    track: trackEvent
  };
})();

