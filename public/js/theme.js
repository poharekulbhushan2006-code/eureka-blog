// ==========================================================================
// EUREKA — Permanent Dark Mode Engine
// ==========================================================================

(function () {
  const THEME_KEY = 'eureka-theme';

  function enforceDarkMode() {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem(THEME_KEY, 'dark');
    } catch (e) {}
  }

  // Enforce immediately
  enforceDarkMode();

  document.addEventListener('DOMContentLoaded', enforceDarkMode);
})();
