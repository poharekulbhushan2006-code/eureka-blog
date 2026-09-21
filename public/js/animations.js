// ==========================================================================
// EUREKA — Editorial Scroll Reveals, Motion & Reading Experience Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 0. Website Opening Intro Animation Controller (Splash Screen)
  // ========================================================================
  const introOverlay = document.getElementById('site-intro-overlay');
  if (introOverlay) {
    setTimeout(() => {
      introOverlay.classList.add('intro-hidden');
      document.body.classList.add('page-loaded');
      setTimeout(() => {
        try { introOverlay.remove(); } catch (e) {}
      }, 750);
    }, 1050);
  } else {
    document.body.classList.add('page-loaded');
  }

  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  // ========================================================================
  // 1. Article Reading Scroll-Reveal Observer (Premium Editorial Flow)
  // ========================================================================
  const articleProse = document.querySelector('.article-prose');
  if (articleProse && 'IntersectionObserver' in window) {
    // Automatically wrap any bare markdown tables in a responsive scroll container
    const tables = articleProse.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.parentElement.classList.contains('table-scroll-wrap')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll-wrap reading-reveal';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Select reading elements for smooth scroll reveal
    // Target blocks, headings, quotes, infographic cards and grids
    const readingElements = articleProse.querySelectorAll(
      'h2, h3, p, blockquote, .attachment-cards-grid, .quantum-cards-grid, figure, .table-scroll-wrap, pre, .flowchart-container, .timeline-container, .timeline-item, hr'
    );

    const readingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          readingObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    readingElements.forEach((el) => {
      el.classList.add('reading-reveal');

      // Check if already in viewport on load
      const rect = el.getBoundingClientRect();
      if (rect.top <= windowHeight * 0.92) {
        el.classList.add('is-revealed');
      } else {
        readingObserver.observe(el);
      }
    });

    // Observe bottom elements (actions bar, IG banner, tags, related dispatches)
    const bottomElements = document.querySelectorAll(
      '.article-actions-bar, .article-ig-banner, .article-tags-row, .related-dispatches-section, .related-dispatch-card'
    );
    bottomElements.forEach(el => {
      el.classList.add('reading-reveal');
      const rect = el.getBoundingClientRect();
      if (rect.top <= windowHeight * 0.92) {
        el.classList.add('is-revealed');
      } else {
        readingObserver.observe(el);
      }
    });
  }

  // ========================================================================
  // 2. Home Page & General Page Scroll-Reveal Observer
  // ========================================================================
  const generalElements = document.querySelectorAll('.reveal');
  if (generalElements.length > 0 && 'IntersectionObserver' in window) {
    const generalObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          generalObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    generalElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= windowHeight * 0.92) {
        el.classList.add('is-revealed');
      } else {
        generalObserver.observe(el);
      }
    });
  } else if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    document.querySelectorAll('.reveal, .reading-reveal').forEach(el => el.classList.add('is-revealed'));
  }

  // Safety fallback: ensure no element remains accidentally hidden
  setTimeout(() => {
    document.querySelectorAll('.reading-reveal:not(.is-revealed), .reveal:not(.is-revealed)').forEach(el => {
      el.classList.add('is-revealed');
    });
  }, 2500);

  // ========================================================================
  // 3. Top Page-Loading Progress Bar (YouTube / GitHub / Medium Style)
  // ========================================================================
  const navLoader = document.getElementById('page-nav-loader');
  const navLoaderBar = navLoader ? navLoader.querySelector('.nav-loader-bar') : null;

  if (navLoader && navLoaderBar) {
    // Finish loading animation on initial page arrival
    navLoader.classList.add('is-loading');
    navLoaderBar.style.width = '100%';
    setTimeout(() => {
      navLoader.classList.remove('is-loading');
      setTimeout(() => {
        navLoaderBar.style.width = '0%';
      }, 300);
    }, 350);

    // Trigger loading bar when clicking any internal article or navigation link
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      // Ignore anchors, external protocols, and modifier keys
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank' || e.metaKey || e.ctrlKey) {
        return;
      }

      // Check if same origin
      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        navLoader.classList.add('is-loading');
        navLoaderBar.style.transition = 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        navLoaderBar.style.width = '30%';

        document.body.classList.add('page-is-navigating');

        setTimeout(() => {
          if (document.body.classList.contains('page-is-navigating')) {
            navLoaderBar.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            navLoaderBar.style.width = '78%';
          }
        }, 200);
      }
    });

    // Reset when navigating via back/forward cache
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('page-is-navigating');
      navLoader.classList.remove('is-loading');
      navLoaderBar.style.width = '0%';
    });
  }

  // ========================================================================
  // 4. Image Loading Skeleton & Fade-In Reveal
  // ========================================================================
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.classList.add('article-img-loading');

    if (img.complete && img.naturalHeight !== 0) {
      img.classList.add('article-img-loaded');
      img.classList.remove('article-img-loading');
    } else {
      img.addEventListener('load', () => {
        img.classList.add('article-img-loaded');
        img.classList.remove('article-img-loading');
      });
      img.addEventListener('error', () => {
        img.classList.remove('article-img-loading');
      });
    }
  });
});
