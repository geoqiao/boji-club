(() => {
  const dialog = document.getElementById('site-search');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  if (!(dialog instanceof HTMLDialogElement) || !(input instanceof HTMLInputElement) || !results || !status) return;
  let index = null;
  let loading = null;
  let composing = false;
  let previousFocus = null;
  let revision = 0;

  const normalize = (value) => String(value || '').normalize('NFKC').toLocaleLowerCase().trim();

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch('/search.json', { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        })
        .then((data) => {
          if (!Array.isArray(data)) throw new Error('Invalid search index');
          index = data.filter((item) => item && typeof item.title === 'string' && typeof item.path === 'string' && item.path.startsWith('/blog/') && !item.path.includes('\\'))
            .map((item) => ({ ...item, normalizedTitle: normalize(item.title), normalizedBody: normalize(item.text), normalizedDescription: normalize(item.description) }));
          return index;
        })
        .catch((error) => { loading = null; throw error; });
    }
    return loading;
  }

  async function search() {
    const currentRevision = ++revision;
    const query = normalize(input.value);
    results.replaceChildren();
    if (!query) {
      status.textContent = '输入关键词，找到适合你的下一步。';
      return;
    }
    status.textContent = '正在查找…';
    try {
      const data = await loadIndex();
      if (currentRevision !== revision) return;
      const terms = query.split(/\s+/u).filter(Boolean);
      const matches = data.map((item) => {
        let score = 0;
        for (const term of terms) {
          if (item.normalizedTitle.includes(term)) score += 8;
          else if (item.normalizedDescription.includes(term)) score += 4;
          else if (item.normalizedBody.includes(term)) score += 1;
          else return null;
        }
        return { item, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score);
      status.textContent = matches.length
        ? '找到 ' + matches.length + ' 篇相关内容' + (matches.length > 30 ? '，显示前 30 篇。' : '。')
        : '还没有找到相关内容。试试更短的词，例如「训练」「恢复」。';
      const fragment = document.createDocumentFragment();
      for (const { item } of matches.slice(0, 30)) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        const title = document.createElement('strong');
        const excerpt = document.createElement('p');
        link.href = item.path;
        title.textContent = item.title;
        const text = String(item.text || item.description || '').replace(/\s+/g, ' ');
        const normalizedText = normalize(text);
        const hit = terms.map((term) => normalizedText.indexOf(term)).find((position) => position >= 0) ?? -1;
        const start = hit > 40 ? hit - 40 : 0;
        excerpt.textContent = (start ? '…' : '') + text.slice(start, start + 130) + (text.length > start + 130 ? '…' : '');
        link.append(title, excerpt);
        li.append(link);
        fragment.append(li);
      }
      results.append(fragment);
    } catch {
      if (currentRevision === revision) status.textContent = '搜索索引暂时加载失败，请稍后重新输入，或通过学习目录查找。';
    }
  }

  function openSearch() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    input.focus();
    if (input.value.trim()) search();
  }
  function closeSearch() { dialog.close(); }
  document.querySelectorAll('[data-open-search]').forEach((button) => button.addEventListener('click', openSearch));
  dialog.querySelector('[data-close-search]')?.addEventListener('click', closeSearch);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeSearch();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  });
  document.getElementById('search-form')?.addEventListener('submit', (event) => { event.preventDefault(); search(); });
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; search(); });
  input.addEventListener('input', () => { if (!composing) search(); });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) closeSearch(); else openSearch();
    }
    if (event.key === 'Escape' && dialog.open) {
      event.preventDefault();
      closeSearch();
    }
  });
})();
