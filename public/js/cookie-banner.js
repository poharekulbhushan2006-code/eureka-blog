// ==========================================================================
// EUREKA — Privacy & Cookie Consent Handler
// ==========================================================================
(function() {
  const STORAGE_KEY = 'eureka_cookie_consent_v1';

  function initCookieBanner() {
    const banner = document.getElementById('eureka-cookie-banner');
    if (!banner) return;

    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Show after subtle delay for comfortable reading experience
        setTimeout(() => {
          banner.classList.add('is-visible');
        }, 1200);
      }
    } catch (e) {
      // LocalStorage might be disabled in private mode
    }

    const acceptBtn = document.getElementById('cookie-accept-all');
    const essentialBtn = document.getElementById('cookie-essential-only');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            accepted: true,
            analytics: true,
            date: new Date().toISOString()
          }));
        } catch (e) {}
        banner.classList.remove('is-visible');
        if (window.EurekaAnalytics && typeof window.EurekaAnalytics.enable === 'function') {
          window.EurekaAnalytics.enable();
        }
      });
    }

    if (essentialBtn) {
      essentialBtn.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            accepted: true,
            analytics: false,
            date: new Date().toISOString()
          }));
        } catch (e) {}
        banner.classList.remove('is-visible');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieBanner);
  } else {
    initCookieBanner();
  }
})();
