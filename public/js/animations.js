// ==========================================================================
// EUREKA — Scroll Reveals & Reading Experience Animations
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. General page scroll reveal
  if ('IntersectionObserver' in window) {
    const generalObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          generalObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => generalObserver.observe(el));

    // 2. Reading Experience Scroll Reveal (Article Content)
    const articleProse = document.querySelector('.article-prose');
    if (articleProse) {
      // Ensure all tables are wrapped in a responsive scroll container for all screen sizes
      const tables = articleProse.querySelectorAll('table');
      tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-scroll-wrap')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-scroll-wrap';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });

      // Automatically target key reading elements
      const readingElements = articleProse.querySelectorAll(
        'h2, h3, p, blockquote, figure, img, .table-scroll-wrap, pre, .flowchart-container, .timeline-container, .timeline-item'
      );

      const readingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            readingObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '0px 0px -35px 0px',
        threshold: 0.08
      });

      readingElements.forEach((el, idx) => {
        el.classList.add('reading-reveal');
        
        // Stagger timeline items
        if (el.classList.contains('timeline-item')) {
          el.style.setProperty('--item-i', idx % 6);
        }

        readingObserver.observe(el);
      });

      // Also observe bottom action bar and related reading
      const actionBars = document.querySelectorAll('.article-actions-bar, .article-container + section');
      actionBars.forEach(el => {
        el.classList.add('reading-reveal');
        readingObserver.observe(el);
      });
    }
  } else {
    // Fallback for older browsers
    document.querySelectorAll('.reveal, .reading-reveal').forEach(el => el.classList.add('is-revealed'));
  }

  // ========================================================================
  // 3. Top Page-Loading Progress Bar (YouTube / GitHub Style)
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


