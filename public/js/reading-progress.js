// ==========================================================================
// EUREKA — Reading Progress Tracker & Guided Reading Focus
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.getElementById('reading-progress-bar');
  const article = document.querySelector('.article-prose');
  if (!progressBar && !article) return;

  let ticking = false;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let progress = 0;

    if (article) {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + scrollTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;

      if (scrollTop < articleTop) {
        progress = 0;
      } else if (scrollTop > articleTop + articleHeight - windowHeight) {
        progress = 100;
      } else {
        const raw = ((scrollTop - articleTop) / (articleHeight - windowHeight)) * 100;
        progress = Math.min(100, Math.max(0, raw));
      }
    } else {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    }

    // 1. Update top bar
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      if (progress > 0) {
        progressBar.classList.add('is-active');
      } else {
        progressBar.classList.remove('is-active');
      }
    }

    // 2. Guided Paragraph Reading Focus
    if (article) {
      const viewportSweetSpot = window.innerHeight * 0.42;
      const paragraphs = article.querySelectorAll('p');
      let activeP = null;
      let minDistance = Infinity;

      paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top <= viewportSweetSpot && rect.bottom >= viewportSweetSpot * 0.5) {
          const pCenter = rect.top + rect.height / 2;
          const dist = Math.abs(pCenter - viewportSweetSpot);
          if (dist < minDistance) {
            minDistance = dist;
            activeP = p;
          }
        }
      });

      paragraphs.forEach(p => {
        if (p === activeP) {
          p.classList.add('reading-focused');
        } else {
          p.classList.remove('reading-focused');
        }
      });
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  updateProgress();
});
