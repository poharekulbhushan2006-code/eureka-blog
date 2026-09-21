document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('editor-content');
  const preview = document.getElementById('preview-content');
  const wordCountSpan = document.getElementById('word-count');
  const readingTimeSpan = document.getElementById('reading-time');
  const titleInput = document.getElementById('editor-title');

  const keyInput = document.getElementById('editor-auth-key');

  if (!textarea || !preview) return;

  // Restore saved editorial key
  if (keyInput) {
    const savedKey = localStorage.getItem('eureka-editorial-key') || '';
    if (savedKey) keyInput.value = savedKey;
    keyInput.addEventListener('input', () => {
      localStorage.setItem('eureka-editorial-key', keyInput.value.trim());
    });
  }

  // Simple client-side Markdown to HTML parser for live preview
  function renderMarkdown(md) {
    if (!md) return '<p style="color: var(--color-muted-foreground); font-style: italic;">Preview will appear here in real-time as you type...</p>';

    let html = md
      // Escaping
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headings
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Blockquotes
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Bold & Italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Horizontal Rules
      .replace(/^---$/gim, '<hr>')
      // Unordered lists
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n+/g, '</p><p>');

    return `<div class="article-prose"><p>${html}</p></div>`;
  }

  function updateStats() {
    const text = textarea.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 225));

    if (wordCountSpan) wordCountSpan.textContent = `${words} words`;
    if (readingTimeSpan) readingTimeSpan.textContent = `${minutes} min read`;
  }

  const draftStatusPill = document.getElementById('draft-status-pill');
  const clearDraftBtn = document.getElementById('clear-draft-btn');
  let saveTimer = null;

  function updatePreview() {
    preview.innerHTML = renderMarkdown(textarea.value);
    updateStats();

    if (draftStatusPill) draftStatusPill.textContent = 'Saving...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem('eureka-draft-title', titleInput ? titleInput.value : '');
      localStorage.setItem('eureka-draft-content', textarea.value);
      if (draftStatusPill) draftStatusPill.textContent = 'Draft saved';
    }, 400);
  }

  // Restore draft if empty
  const savedContent = localStorage.getItem('eureka-draft-content');
  const savedTitle = localStorage.getItem('eureka-draft-title');
  if (savedContent && !textarea.value) {
    textarea.value = savedContent;
    if (titleInput && savedTitle && !titleInput.value) {
      titleInput.value = savedTitle;
    }
  }

  // Clear Draft
  if (clearDraftBtn) {
    clearDraftBtn.addEventListener('click', () => {
      if (confirm('Clear current draft?')) {
        textarea.value = '';
        if (titleInput) titleInput.value = '';
        localStorage.removeItem('eureka-draft-content');
        localStorage.removeItem('eureka-draft-title');
        updatePreview();
        if (draftStatusPill) draftStatusPill.textContent = 'Draft cleared';
      }
    });
  }

  textarea.addEventListener('input', updatePreview);
  if (titleInput) titleInput.addEventListener('input', updatePreview);

  updatePreview();

  // Toolbar Actions
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      let replacement = '';

      switch (action) {
        case 'bold':
          replacement = `**${selected || 'bold text'}**`;
          break;
        case 'italic':
          replacement = `*${selected || 'italic text'}*`;
          break;
        case 'h2':
          replacement = `\n## ${selected || 'Section Heading'}\n`;
          break;
        case 'h3':
          replacement = `\n### ${selected || 'Subheading'}\n`;
          break;
        case 'quote':
          replacement = `\n> "${selected || 'Inspiring quote or key principle'}"\n`;
          break;
        case 'code':
          replacement = `\n\`\`\`javascript\n${selected || '// code snippet here'}\n\`\`\`\n`;
          break;
        case 'list':
          replacement = `\n- ${selected || 'Key item'}\n`;
          break;
      }

      textarea.setRangeText(replacement, start, end, 'end');
      textarea.focus();
      updatePreview();
    });
  });
});
