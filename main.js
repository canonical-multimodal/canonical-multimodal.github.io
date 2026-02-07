/* Main page behavior (no inline JS in index.html):
 * - TOC (Outline) behavior
 * - BibTeX copy button
 */

function copyBibtex() {
  const bibtexEl = document.getElementById('bibtex-text');
  const svg = document.getElementById('copy-icon');
  if (!bibtexEl) return;

  const bibtexText = bibtexEl.textContent || '';

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    // Fallback: select text for manual copy
    const range = document.createRange();
    range.selectNodeContents(bibtexEl);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return;
  }

  navigator.clipboard.writeText(bibtexText).then(() => {
    if (!svg) return;
    const prev = svg.style.stroke;
    svg.style.stroke = '#4caf50';
    setTimeout(() => {
      svg.style.stroke = prev || '#1976d2';
    }, 600);
  });
}

function initBibtexCopy() {
  const btn = document.getElementById('copy-button');
  if (!btn) return;
  btn.addEventListener('click', copyBibtex);
}

function initOutlineToc() {
  const tocEl = document.getElementById('toc');
  const tocCardEl = document.getElementById('toc-card');
  if (!tocEl || !tocCardEl) return;

  const tocToggleEl = document.getElementById('toc-toggle');
  const narrowMq = window.matchMedia ? window.matchMedia('(max-width: 1399px)') : null;

  const slugify = (text) =>
    (text || '')
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-+/g, '-');

  const isUniqueId = (id) => {
    try {
      return document.querySelectorAll(`#${CSS.escape(id)}`).length === 1;
    } catch {
      return false;
    }
  };

  const used = new Set();
  const createAnchorBefore = (heading, baseText) => {
    const base = slugify(baseText) || 'section';
    let id = base;
    let i = 0;
    while (document.getElementById(id) || used.has(id)) {
      i += 1;
      id = `${base}-${i}`;
    }
    used.add(id);

    const anchor = document.createElement('span');
    anchor.className = 'toc-anchor';
    anchor.id = id;
    heading.parentNode.insertBefore(anchor, heading);
    return id;
  };

  const getTocIdForHeading = (heading) => {
    const existing = (heading.getAttribute('id') || '').trim();
    if (existing && isUniqueId(existing)) return existing;
    return createAnchorBefore(heading, heading.textContent || 'section');
  };

  const h1s = Array.from(document.querySelectorAll('h1'));
  if (!h1s.length) {
    tocCardEl.style.display = 'none';
    if (tocToggleEl) tocToggleEl.style.display = 'none';
    return;
  }

  const items = [];
  let inResults = false;
  const isResultsSectionHeading = (text) => (text || '').toLowerCase().includes('results');
  const headings = Array.from(document.querySelectorAll('h1, h4'));
  for (const h of headings) {
    const tag = (h.tagName || '').toLowerCase();
    const rawText = (h.textContent || '').trim().replace(/\s+/g, ' ');
    if (!rawText) continue;

    if (tag === 'h1') {
      const id = getTocIdForHeading(h);
      items.push({ level: 1, id, text: rawText });
      inResults = isResultsSectionHeading(rawText);
      continue;
    }

    if (tag === 'h4' && inResults && /^\d+\.\s+/.test(rawText)) {
      const id = getTocIdForHeading(h);
      items.push({ level: 2, id, text: rawText });
    }
  }

  tocEl.innerHTML =
    `<ul>` +
    items
      .map((it) => `<li class="lvl-${it.level}"><a href="#${it.id}">${it.text}</a></li>`)
      .join('') +
    `</ul>`;

  tocEl.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
    if (narrowMq && narrowMq.matches && tocCardEl.classList) {
      tocCardEl.classList.add('is-collapsed');
      if (tocToggleEl) tocToggleEl.setAttribute('aria-expanded', 'false');
    }
  });

  const links = Array.from(tocEl.querySelectorAll('a'));
  const linkById = new Map(
    links
      .map((a) => [a.getAttribute('href').slice(1), a])
      .filter(([id]) => !!id)
  );
  const observed = items.map((it) => document.getElementById(it.id)).filter(Boolean);

  const clearActive = () => links.forEach((a) => a.classList.remove('active'));
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((ent) => ent.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const a = linkById.get(visible.target.id);
      if (!a) return;
      clearActive();
      a.classList.add('active');
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.2, 0.6, 1] }
  );
  observed.forEach((h) => observer.observe(h));

  const setTocMode = () => {
    if (!tocToggleEl || !tocCardEl.classList) return;
    if (narrowMq && narrowMq.matches) {
      tocCardEl.classList.add('is-collapsed');
      tocToggleEl.style.display = 'block';
      tocToggleEl.setAttribute('aria-expanded', 'false');
    } else {
      tocCardEl.classList.remove('is-collapsed');
      tocToggleEl.style.display = 'none';
      tocToggleEl.setAttribute('aria-expanded', 'true');
    }
  };

  if (narrowMq && narrowMq.addEventListener) {
    narrowMq.addEventListener('change', setTocMode);
  }
  setTocMode();

  if (tocToggleEl && tocCardEl.classList) {
    tocToggleEl.addEventListener('click', () => {
      const collapsed = tocCardEl.classList.toggle('is-collapsed');
      tocToggleEl.setAttribute('aria-expanded', String(!collapsed));
    });
    document.addEventListener('click', (evt) => {
      if (!narrowMq || !narrowMq.matches) return;
      const t = evt.target;
      if (tocCardEl.contains(t) || tocToggleEl.contains(t)) return;
      tocCardEl.classList.add('is-collapsed');
      tocToggleEl.setAttribute('aria-expanded', 'false');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBibtexCopy();
  initOutlineToc();
});

