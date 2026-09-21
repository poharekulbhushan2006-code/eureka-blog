document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('search-modal-overlay');
  const searchInput = document.getElementById('search-modal-input');
  const resultsContainer = document.getElementById('search-results-list');
  const openButtons = document.querySelectorAll('.search-trigger-btn');
  const closeBtn = document.getElementById('search-modal-close');

  if (!modalOverlay || !searchInput || !resultsContainer) return;

  let debounceTimer = null;
  let activeIndex = -1;

  function openSearch() {
    modalOverlay.classList.add('open');
    searchInput.value = '';
    resultsContainer.innerHTML = '<li style="padding: 1.5rem; text-align: center; color: var(--color-muted-foreground); font-size: 0.9rem;">Type an article title, concept, or tag...</li>';
    activeIndex = -1;
    setTimeout(() => searchInput.focus(), 50);
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openButtons.forEach(btn => btn.addEventListener('click', openSearch));
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeSearch();
  });

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / Esc / '/')
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modalOverlay.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeSearch();
    } else if (e.key === '/' && !modalOverlay.classList.contains('open') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function performSearch(query) {
    if (!query || query.trim().length === 0) {
      resultsContainer.innerHTML = '<li style="padding: 1.5rem; text-align: center; color: var(--color-muted-foreground); font-size: 0.9rem;">Type an article title, concept, or tag...</li>';
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        resultsContainer.innerHTML = `<li style="padding: 1.5rem; text-align: center; color: var(--color-muted-foreground); font-size: 0.9rem;">No publications found matching "<strong>${escapeHtml(query)}</strong>"</li>`;
        return;
      }

      resultsContainer.innerHTML = results.map((item, idx) => `
        <li>
          <a href="/post/${encodeURIComponent(item.slug)}" class="search-result-item" data-index="${idx}">
            <div class="search-result-title">${escapeHtml(item.title)}</div>
            <div class="search-result-meta">
              <span class="badge badge-accent">${escapeHtml(item.category)}</span>
              <span>${escapeHtml(item.readingTime)}</span>
              <span>${escapeHtml(item.publishedAt)}</span>
            </div>
          </a>
        </li>
      `).join('');

      activeIndex = -1;
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(e.target.value);
    }, 200);
  });

  // Keyboard navigation within results
  searchInput.addEventListener('keydown', (e) => {
    const items = resultsContainer.querySelectorAll('.search-result-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    }
  });

  function updateHighlight(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === activeIndex);
      if (idx === activeIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }
});
