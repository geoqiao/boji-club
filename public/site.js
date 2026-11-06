(() => {
  const menu = document.querySelector('.navigation-disclosure');
  const mobile = window.matchMedia('(max-width: 760px)');
  function adaptNavigation() {
    if (menu instanceof HTMLDetailsElement) menu.open = !mobile.matches;
  }
  adaptNavigation();
  mobile.addEventListener('change', adaptNavigation);

  const commentCleanup = new WeakMap();

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const playButton = event.target.closest('button[data-bilibili]');
    if (playButton) {
      const bvid = playButton.getAttribute('data-bilibili') || '';
      if (!/^BV[A-Za-z0-9]{10}$/.test(bvid)) return;
      const wrapper = playButton.closest('.video-embed');
      if (!wrapper) return;
      const frame = document.createElement('iframe');
      frame.src = 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(bvid) + '&p=1&autoplay=0';
      frame.title = '哔哩哔哩训练教学视频';
      frame.allow = 'fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      wrapper.replaceChildren(frame);
      frame.focus();
    }

    const loadButton = event.target.closest('[data-load-comments]');
    if (loadButton instanceof HTMLButtonElement) {
      const section = loadButton.closest('[data-comments]');
      if (!(section instanceof HTMLElement) || section.dataset.loading === 'true') return;
      const issueNumber = section.dataset.issueNumber || '';
      if (!/^[1-9]\d*$/.test(issueNumber)) return;
      const thread = section.querySelector('[data-comment-thread]');
      const status = section.querySelector('[data-comment-status]');
      if (!thread || !status) return;
      commentCleanup.get(section)?.();
      thread.replaceChildren();
      section.dataset.loading = 'true';
      loadButton.hidden = false;
      loadButton.disabled = true;
      loadButton.textContent = '正在加载评论…';
      status.textContent = '正在连接 GitHub 评论。若网络受限，可使用上方链接直接参与讨论。';

      const script = document.createElement('script');
      script.src = 'https://utteranc.es/client.js';
      script.setAttribute('repo', 'geoqiao/boji-club');
      script.setAttribute('issue-number', issueNumber);
      script.setAttribute('theme', 'github-light');
      script.crossOrigin = 'anonymous';
      script.async = true;
      let settled = false;
      const observer = new MutationObserver(() => {
        thread.querySelectorAll('iframe').forEach((frame) => {
          frame.loading = 'eager';
        });
      });
      function cleanup() {
        observer.disconnect();
        window.removeEventListener('message', onMessage);
        window.clearTimeout(timer);
        script.removeEventListener('error', fail);
        commentCleanup.delete(section);
      }
      function fail() {
        if (settled) return;
        settled = true;
        cleanup();
        section.dataset.loading = 'false';
        loadButton.hidden = false;
        loadButton.disabled = false;
        loadButton.textContent = '重新加载评论';
        status.textContent = '评论服务暂时无法连接，可重试或前往 GitHub。';
        thread.replaceChildren();
      }
      function onMessage(message) {
        if (settled || message.origin !== 'https://utteranc.es') return;
        const frame = thread.querySelector('iframe');
        const data = message.data;
        if (!frame || message.source !== frame.contentWindow || !data || data.type !== 'resize' || !Number.isFinite(data.height) || data.height <= 0) return;
        settled = true;
        cleanup();
        section.dataset.loading = 'false';
        loadButton.hidden = true;
        status.textContent = '评论由 GitHub 提供；登录 GitHub 后即可参与。';
      }
      const timer = window.setTimeout(fail, 12000);
      commentCleanup.set(section, cleanup);
      observer.observe(thread, { childList: true, subtree: true });
      window.addEventListener('message', onMessage);
      script.addEventListener('error', fail);
      thread.append(script);
    }
  });

  const tocLinks = Array.from(document.querySelectorAll('.page-toc nav a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const observed = new Map();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) observed.set(entry.target.id, entry.isIntersecting);
      const firstVisible = tocLinks.find((link) => observed.get(decodeURIComponent(link.hash.slice(1))));
      if (!firstVisible) return;
      tocLinks.forEach((link) => {
        if (link === firstVisible) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-8% 0px -65% 0px', threshold: 0 });
    tocLinks.forEach((link) => {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading) observer.observe(heading);
    });
  }
})();
