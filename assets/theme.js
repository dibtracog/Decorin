/* DecorIn theme scripts \u2014 no dependencies. */
(() => {
  'use strict';

  /* ---------- Header: solid background once the page scrolls ---------- */
  const onScroll = () => document.body.classList.toggle('header-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menu = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn) {
    const closeBtn = menu.querySelector('[data-menu-close]');
    const open = () => {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      document.body.classList.add('menu-open');
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn && closeBtn.focus();
    };
    const close = () => {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      openBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450);
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    menu.addEventListener('click', (e) => { if (e.target === menu) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) close(); });
  }

  /* ---------- Countdown ---------- */
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const target = new Date(el.dataset.countdown);
    if (isNaN(target)) { el.hidden = true; return; }
    const units = {};
    el.querySelectorAll('[data-unit]').forEach((u) => { units[u.dataset.unit] = u; });
    const label = el.querySelector('[data-countdown-label]');
    const pad = (n) => String(n).padStart(2, '0');
    let timer;
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) {
        el.classList.add('is-done');
        if (label) label.textContent = el.dataset.done;
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      units.days && (units.days.textContent = pad(Math.floor(s / 86400)));
      units.hours && (units.hours.textContent = pad(Math.floor((s % 86400) / 3600)));
      units.minutes && (units.minutes.textContent = pad(Math.floor((s % 3600) / 60)));
      units.seconds && (units.seconds.textContent = pad(s % 60));
    };
    tick();
    timer = setInterval(tick, 1000);
  });

  /* ---------- Carousel (native scroll-snap + arrows/dots) ---------- */
  const initCarousel = (section) => {
    const track = section.querySelector('[data-carousel-track]');
    if (!track || track.dataset.ready) return;
    track.dataset.ready = 'true';
    const slides = Array.from(track.children);
    const prev = section.querySelector('[data-carousel-prev]');
    const next = section.querySelector('[data-carousel-next]');
    const dots = Array.from(section.querySelectorAll('[data-carousel-dots] button'));

    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
    const goTo = (i) => track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      const index = Math.round(track.scrollLeft / step());
      const active = track.scrollLeft >= max ? slides.length - 1 : Math.min(index, slides.length - 1);
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === active);
        d.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };

    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  /* ---------- Catalogue facets: filters, sort, drawer ---------- */
  const desktop = window.matchMedia('(min-width: 990px)');

  const setLoading = (on) => {
    const root = document.querySelector('[data-results-root]');
    root && root.classList.toggle('is-loading', on);
  };

  // Replace the results area (filters, grid, pagination) with freshly rendered HTML
  const swapResults = (html, url) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-results]');
    const results = document.querySelector('[data-results]');
    if (!fresh || !results) throw new Error('missing results');
    results.innerHTML = fresh.innerHTML;
    results.dataset.results = fresh.dataset.results;
    const freshTitle = doc.querySelector('[data-results-title]');
    const title = document.querySelector('[data-results-title]');
    if (freshTitle && title) title.textContent = freshTitle.textContent.trim();
    const intro = document.querySelector('.catalogue__intro');
    if (intro) {
      const freshIntro = doc.querySelector('.catalogue__intro');
      intro.hidden = !freshIntro;
      if (freshIntro) intro.innerHTML = freshIntro.innerHTML;
    }
    history.replaceState({}, '', url);
    initFacets(results);
  };

  const initFacets = (root = document) => {
    root.querySelectorAll('[data-facets]').forEach((facets) => {
      if (facets.dataset.ready) return;
      facets.dataset.ready = 'true';
      const sectionId = facets.dataset.sectionId;
      const form = facets.querySelector('[data-facets-form]');
      const drawer = facets.querySelector('[data-facets-drawer]');
      const openBtn = facets.querySelector('[data-facets-open]');
      const closeBtn = facets.querySelector('[data-facets-close]');

      const openDrawer = () => {
        facets.classList.add('is-open'); document.body.classList.add('facets-open');
        openBtn && openBtn.setAttribute('aria-expanded', 'true');
        facets.querySelectorAll('[data-facet].is-active').forEach((d) => { d.open = true; });
        closeBtn && closeBtn.focus();
      };
      const closeDrawer = () => {
        facets.classList.remove('is-open'); document.body.classList.remove('facets-open');
        openBtn && openBtn.setAttribute('aria-expanded', 'false');
      };
      openBtn && openBtn.addEventListener('click', openDrawer);
      closeBtn && closeBtn.addEventListener('click', closeDrawer);
      facets.addEventListener('click', (e) => { if (e.target === facets) closeDrawer(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); closeDropdowns(); } });

      // Desktop: only one dropdown open at a time, close on outside click
      const details = Array.from(facets.querySelectorAll('[data-facet]'));
      const closeDropdowns = (except) => { if (desktop.matches) details.forEach((d) => { if (d !== except) d.open = false; }); };
      details.forEach((d) => d.addEventListener('toggle', () => { if (d.open) closeDropdowns(d); }));
      document.addEventListener('click', (e) => { if (desktop.matches && !e.target.closest('[data-facet]')) closeDropdowns(); });

      // Desktop: apply instantly without a page reload. Mobile: apply with the drawer's button.
      let timer;
      form.addEventListener('input', (e) => {
        if (!desktop.matches && !e.target.matches('[data-facets-sort]')) return;
        clearTimeout(timer);
        timer = setTimeout(() => render(urlFromForm(form)), e.target.type === 'number' ? 700 : 0);
      });
      form.addEventListener('submit', (e) => { e.preventDefault(); closeDrawer(); render(urlFromForm(form)); });
      facets.querySelectorAll('[data-facets-link]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); render(a.href); }));

      function urlFromForm(f) {
        const params = new URLSearchParams();
        new FormData(f).forEach((v, k) => { if (v !== '') params.append(k, v); });
        return `${f.getAttribute('action').split('?')[0]}?${params.toString()}`;
      }

      async function render(url) {
        const results = facets.closest('[data-results]');
        const sectionId = results ? results.dataset.results : facets.dataset.sectionId;
        const openIndex = details.findIndex((d) => d.open);
        setLoading(true);
        try {
          const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=${encodeURIComponent(sectionId)}`);
          if (!res.ok) throw new Error(res.status);
          swapResults(await res.text(), url);
          document.body.classList.remove('facets-open');
          if (desktop.matches && openIndex > -1) {
            const d = document.querySelectorAll('[data-results] [data-facet]')[openIndex];
            if (d) d.open = true;
          }
        } catch (err) {
          window.location.href = url; // fall back to a normal page load
        } finally {
          setLoading(false);
        }
      }
    });
  };
  initFacets();
  document.addEventListener('shopify:section:load', () => initFacets());

  /* ---------- Live search: instant, predictable filtering of the catalogue ----------
     The whole catalogue is loaded once (section "search-index") and filtered in the
     browser. Every word typed must match the start of a word in the product's title,
     type or tags, so each extra letter can only narrow the results, never reshuffle
     them. A trailing "s" is ignored (vases \u2192 vase). Order stays in catalogue order,
     with title matches first. */
  const normalizeText = (s) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const stem = (t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
  const queryTokens = (q) => normalizeText(q).split(' ').filter(Boolean).map(stem);
  const matchesAll = (words, tokens) => tokens.every((t) => words.some((w) => w.startsWith(t)));

  const initSearch = () => {
    const form = document.querySelector('[data-facets-search]');
    if (!form || form.dataset.ready) return;
    form.dataset.ready = 'true';
    const input = form.querySelector('[data-search-input]');
    const clear = form.querySelector('[data-search-clear]');
    const catalogue = form.dataset.catalogueUrl;
    const results = document.querySelector('[data-results]');
    const titleEl = document.querySelector('[data-results-title]');
    const introEl = document.querySelector('.catalogue__intro');
    const onSearchPage = window.location.pathname.startsWith(form.getAttribute('action'));
    if (!results) return; // plain form fallback (normal submit)

    // Snapshot of the page as it loaded, so clearing the search restores it instantly
    const original = {
      html: results.innerHTML,
      title: titleEl ? titleEl.textContent : '',
      introHidden: introEl ? introEl.hidden : true,
    };
    const basePath = onSearchPage ? catalogue : window.location.pathname;
    const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
    const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // Build the search index. Preferred source: the theme's search-index section (same cards as
    // the catalogue). Fallback: Shopify's public products.json feed, rendered with a simple card.
    const toItem = (el, i) => ({
      el, i,
      words: normalizeText(el.dataset.search || '').split(' '),
      titleWords: normalizeText(el.dataset.searchTitle || '').split(' '),
    });
    const fromSection = async () => {
      const res = await fetch(`${catalogue}?section_id=search-index`, { headers: { Accept: 'text/html' } });
      if (!res.ok) throw new Error(`search-index section: HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const items = Array.from(doc.querySelectorAll('[data-search-item]')).map(toItem);
      if (!items.length) throw new Error('search-index section: no products in response');
      return items;
    };
    const money = (value) => `\u20b9${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fromJson = async () => {
      const res = await fetch(`${catalogue}/products.json?limit=250`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`products.json: HTTP ${res.status}`);
      const { products = [] } = await res.json();
      if (!products.length) throw new Error('products.json: no products');
      return products.map((p, i) => {
        const v = (p.variants && p.variants[0]) || {};
        const img = p.images && p.images[0];
        const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
        const li = document.createElement('li');
        li.dataset.searchTitle = (p.title || '').toLowerCase();
        li.dataset.search = `${p.title || ''} ${p.product_type || ''} ${tags}`.toLowerCase();
        const compare = v.compare_at_price && Number(v.compare_at_price) > Number(v.price);
        li.innerHTML = `
          <div class="product-card"><a class="product-card__link" href="/products/${encodeURIComponent(p.handle)}">
            <div class="product-card__media">${img ? `<img class="product-card__img" loading="lazy" src="${img.src}${img.src.includes('?') ? '&' : '?'}width=600" alt="${escapeHtml(p.title || '')}">` : ''}</div>
            <div class="product-card__info">
              <h3 class="product-card__title">${escapeHtml(p.title || '')}</h3>
              <p class="product-card__price">${v.price ? money(v.price) : ''}${compare ? ` <s class="product-card__compare">${money(v.compare_at_price)}</s>` : ''}</p>
            </div>
          </a></div>`;
        return toItem(li, i);
      });
    };

    let indexPromise = null;
    const loadIndex = () => {
      if (!indexPromise) {
        form.classList.add('is-searching');
        indexPromise = fromSection()
          .catch((err) => { console.warn('[DecorIn search] falling back to products.json:', err.message); return fromJson(); })
          .finally(() => form.classList.remove('is-searching'));
        indexPromise.catch((err) => { console.error('[DecorIn search] could not load catalogue:', err.message); indexPromise = null; });
      }
      return indexPromise;
    };

    const restore = () => {
      if (onSearchPage) { window.location.href = catalogue; return; }
      results.innerHTML = original.html;
      if (titleEl) titleEl.textContent = original.title;
      if (introEl) introEl.hidden = original.introHidden;
      history.replaceState({}, '', basePath);
      form.removeAttribute('data-has-results');
      initFacets(results);
    };

    const shopifySearch = (q) => {
      window.location.href = `${form.getAttribute('action')}?q=${encodeURIComponent(q)}&type=product&options%5Bprefix%5D=last`;
    };
    let renderToken = 0;
    const render = (q) => renderResults(q).catch((err) => {
      console.error('[DecorIn search] live search failed, using Shopify search:', err);
      if (q.trim()) shopifySearch(q.trim());
    });
    const renderResults = async (q) => {
      const tokens = queryTokens(q);
      if (!tokens.length) { restore(); return; }
      const current = ++renderToken;
      let index;
      try { index = await loadIndex(); } catch (e) { shopifySearch(q.trim()); return; }
      if (current !== renderToken) return; // a newer keystroke already rendered

      const hits = index.filter((item) => matchesAll(item.words, tokens));
      const inTitle = (item) => matchesAll(item.titleWords, tokens);
      hits.sort((a, b) => (inTitle(b) - inTitle(a)) || (a.i - b.i));

      const terms = q.trim();
      const count = fill((hits.length === 1 ? form.dataset.textOne : form.dataset.textOther) || '{count} pieces', { count: hits.length });
      results.innerHTML = `
        <div class="search-live__bar">
          <p class="facets__count" role="status">${escapeHtml(count)}</p>
          <button type="button" class="facets__reset" data-live-clear>${escapeHtml(form.dataset.textClear || 'Clear search')}</button>
        </div>
        ${hits.length
          ? '<ul class="product-grid" role="list"></ul>'
          : `<div class="catalogue__empty"><span aria-hidden="true">\u2726</span><p>${escapeHtml(fill(form.dataset.textEmpty, { terms }))}</p></div>`}`;
      const grid = results.querySelector('.product-grid');
      if (grid) hits.forEach((item) => grid.appendChild(item.el.cloneNode(true)));
      results.querySelector('[data-live-clear]').addEventListener('click', () => { input.value = ''; input.focus(); restore(); });

      if (titleEl) titleEl.textContent = fill(form.dataset.textTitle, { terms });
      if (introEl) introEl.hidden = true;
      form.setAttribute('data-has-results', '');
      history.replaceState({}, '', `${basePath}?q=${encodeURIComponent(terms)}`);
    };

    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => render(input.value), 120);
    });
    input.addEventListener('focus', () => { loadIndex().catch(() => {}); }, { once: true }); // warm up
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      if (!window.matchMedia('(min-width: 990px)').matches) input.blur(); // reveal results on phones
      render(input.value);
    });
    clear && clear.addEventListener('click', () => {
      input.value = '';
      input.focus();
      clearTimeout(timer);
      restore();
    });

    // Deep links: /collections/all?q=vase and the header search icon (#search)
    const params = new URLSearchParams(window.location.search);
    if (!onSearchPage && params.get('q')) { input.value = params.get('q'); render(input.value); }
    if (window.location.hash === '#search') { input.focus({ preventScroll: false }); }
  };
  initSearch();

  /* ---------- Cart page: quantity steppers & remove without reloading ---------- */
  const initCart = () => {
    const section = document.querySelector('[data-cart-section]');
    if (!section || section.dataset.ready) return;
    section.dataset.ready = 'true';
    const sectionId = section.dataset.cartSection;
    const changeUrl = `${section.dataset.changeUrl}.js`;
    let busy = false;

    const showError = (msg) => {
      const el = section.querySelector('[data-cart-error]');
      if (el) { el.textContent = msg; el.hidden = false; }
    };

    const update = async (line, quantity) => {
      if (busy) return;
      busy = true;
      const form = section.querySelector('.cart-layout');
      form && form.classList.add('is-loading');
      try {
        const res = await fetch(changeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ line, quantity, sections: [sectionId], sections_url: window.location.pathname }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.description || data.message || '');
        const html = data.sections && data.sections[sectionId];
        if (html) {
          const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-cart-section]');
          if (fresh) section.innerHTML = fresh.innerHTML;
        } else {
          window.location.reload();
        }
        document.querySelectorAll('.cart-count').forEach((el) => {
          el.textContent = data.item_count;
          el.hidden = data.item_count === 0;
        });
      } catch (err) {
        form && form.classList.remove('is-loading');
        showError(err.message || section.dataset.errorText || 'Something went wrong.');
      } finally {
        busy = false;
      }
    };

    section.addEventListener('click', (e) => {
      const step = e.target.closest('[data-qty-change]');
      const remove = e.target.closest('[data-cart-remove]');
      const item = e.target.closest('[data-cart-line]');
      if (!item) return;
      const line = Number(item.dataset.cartLine);
      if (step) {
        const input = item.querySelector('[data-qty-input]');
        const next = Math.max(0, Number(input.value || 0) + Number(step.dataset.qtyChange));
        input.value = next;
        update(line, next);
      } else if (remove) {
        e.preventDefault();
        update(line, 0);
      }
    });

    let timer;
    section.addEventListener('input', (e) => {
      if (!e.target.matches('[data-qty-input]')) return;
      const line = Number(e.target.closest('[data-cart-line]').dataset.cartLine);
      clearTimeout(timer);
      timer = setTimeout(() => { if (e.target.value !== '') update(line, Math.max(0, Number(e.target.value))); }, 600);
    });
    // Enter in a quantity box updates instead of submitting to checkout
    section.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[data-qty-input]')) { e.preventDefault(); e.target.blur(); e.target.dispatchEvent(new Event('input', { bubbles: true })); }
    });
  };
  initCart();

  /* ---------- UPI payment page: QR + copy UPI ID ---------- */
  const initUpi = () => {
    const box = document.querySelector('[data-upi-qr]');
    if (box && !box.dataset.ready) {
      const draw = () => {
        if (typeof window.qrcode !== 'function') return false;
        const qr = window.qrcode(0, 'M');
        qr.addData(box.dataset.upi);
        qr.make();
        box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        box.dataset.ready = 'true';
        return true;
      };
      if (!draw()) window.addEventListener('load', draw, { once: true });
    }
    // Save the payment reference on the cart so it carries over to the Shopify order later
    const pay = document.querySelector('[data-upi-checkout][data-ref]');
    if (pay && pay.dataset.ref && pay.dataset.cartUpdateUrl) {
      fetch(`${pay.dataset.cartUpdateUrl}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ attributes: { 'Payment reference': pay.dataset.ref, 'Payment amount': pay.dataset.amount, 'Payment method': 'UPI QR' } }),
      }).catch(() => {});
    }
    document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); } catch (e) { return; }
      const label = btn.querySelector('.pay__copy-label');
      if (!label) return;
      const original = label.textContent;
      label.textContent = btn.dataset.copied;
      setTimeout(() => { label.textContent = original; }, 1600);
    }));
  };
  initUpi();

  // ---------- Product reviews (stored as blog comments) ----------
  // Approved reviews are comments on one blog post. The theme reads them from
  // that post via the Section Rendering API (sections/review-data.liquid).
  const RETURN_KEY = 'decorin:reviewReturn';
  const REVIEWS_DEBUG = /[?&]reviews_debug/.test(location.search);
  const rlog = (...a) => console.info('[DecorIn reviews]', ...a);
  // After a review is sent Shopify shows the reviews blog post; send the shopper back.
  if (document.body.classList.contains('template-article')) {
    let saved = null;
    for (const store of [() => sessionStorage, () => localStorage]) {
      try { saved = saved || store().getItem(RETURN_KEY); store().removeItem(RETURN_KEY); } catch (e) { /* storage blocked */ }
    }
    let path = '';
    try { const v = JSON.parse(saved || 'null'); if (v && Date.now() - v.t < 15 * 60 * 1000) path = v.path; } catch (e) { path = saved || ''; }
    if (!path) { try { const ref = new URL(document.referrer); if (ref.origin === location.origin && ref.pathname.includes('/products/')) path = ref.pathname; } catch (e) { /* no referrer */ } }
    const errors = document.querySelector('[data-comment-errors]');
    if (path && path.startsWith('/') && !errors) {
      const url = new URL(path, location.origin);
      url.searchParams.set('review', 'thanks');
      url.hash = 'reviews';
      location.replace(url.toString());
    } else if (path && errors) {
      const link = document.createElement('a');
      link.href = `${path}#reviews`; link.className = 'button button--dark'; link.textContent = '\u2190 Back to the product';
      errors.after(link);
    }
  }

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.6l2.83 6.08 6.67.78-4.93 4.56 1.32 6.58L12 17.3l-5.89 3.3 1.32-6.58L2.5 9.46l6.67-.78L12 2.6z"/></svg>';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const starsHtml = (percent, label, size) => `<span class="stars stars--${size}" role="img" aria-label="${esc(label)}"><span class="stars__base">${STAR.repeat(5)}</span><span class="stars__fill" style="width:${Math.max(0, Math.min(100, percent))}%">${STAR.repeat(5)}</span></span>`;
  const plural = (pair, n) => { const [one, other] = String(pair).split('|'); return (n === 1 ? one : (other || one)).replace('{n}', n); };
  const TAG_RE = /^\s*\[\[([^|\]]+)\|([1-5])(?:\|([^\]]*))?\]\]\s*/;

  const htmlToText = (html) => {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    doc.querySelectorAll('p').forEach((p) => p.append('\n\n'));
    return doc.body.textContent.replace(/\n{3,}/g, '\n\n').trim();
  };

  let reviewStore = null;
  const loadReviews = () => {
    if (reviewStore) return reviewStore;
    const base = document.body.dataset.reviewsUrl;
    reviewStore = (async () => {
      if (!base) throw new Error('no reviews url');
      const cacheKey = `decorin:reviews:${base}`;
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
        if (cached && Date.now() - cached.t < 30000 && !REVIEWS_DEBUG && !document.querySelector('[data-reviews]')) return cached.v;
      } catch (e) { /* ignore */ }
      const out = { ok: false, enabled: false, moderated: true, action: `${base}/comments`, reviews: [] };
      for (let page = 1; page <= 10; page++) {
        const url = `${base}?section_id=review-data&page=${page}&t=${Math.floor(Date.now() / 15000)}`;
        const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
        rlog('GET', url, res.status);
        if (!res.ok) { out.reason = `HTTP ${res.status} for ${base} (does the blog post exist and is it visible?)`; break; }
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const node = doc.querySelector('[data-review-data]');
        if (!node) { out.reason = 'review-data section missing from response'; break; }
        const data = JSON.parse(node.textContent);
        if (!data.ok) { out.reason = data.reason || 'not ok'; break; }
        Object.assign(out, { ok: true, enabled: data.enabled, moderated: data.moderated, action: data.action || out.action });
        for (const c of data.comments || []) {
          const text = htmlToText(c.c);
          const m = text.match(TAG_RE);
          if (!m) continue;
          out.reviews.push({ handle: m[1].trim(), rating: Number(m[2]), title: (m[3] || '').trim(), body: text.slice(m[0].length).trim(), author: c.a, date: c.d });
        }
        if (!data.next) break;
      }
      rlog('loaded', out);
      if (out.ok) { try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), v: out })); } catch (e) { /* ignore */ } }
      return out;
    })();
    return reviewStore;
  };
  const statsFor = (data, handle) => {
    const list = data.reviews.filter((r) => r.handle === handle);
    const total = list.reduce((a, r) => a + r.rating, 0);
    return { list, count: list.length, avg: list.length ? Math.round((total / list.length) * 10) / 10 : 0, percent: list.length ? (total / list.length) * 20 : 0 };
  };

  const paintRatings = (data) => {
    document.querySelectorAll('[data-rating-chip]').forEach((el) => {
      const s = statsFor(data, el.dataset.ratingChip);
      if (!s.count) { el.hidden = true; return; }
      el.innerHTML = `${starsHtml(s.percent, `${s.avg} / 5`, 'xs')}<span class="rating-chip__count">(${s.count})</span>`;
      el.hidden = false;
    });
    document.querySelectorAll('[data-rating-inline]').forEach((el) => {
      const s = statsFor(data, el.dataset.ratingInline);
      const label = (el.dataset.textStars || '{n} out of 5 stars').replace('{n}', s.avg);
      if (s.count) {
        el.classList.remove('rating-inline--empty');
        el.innerHTML = `${starsHtml(s.percent, label, 'sm')}<span class="rating-inline__avg">${s.avg}</span><span class="rating-inline__count">${esc(plural(el.dataset.textCounts || '{n} review|{n} reviews', s.count))}</span>`;
        el.hidden = false;
      } else if (data.enabled) {
        el.classList.add('rating-inline--empty');
        el.innerHTML = `${starsHtml(0, '', 'sm')}<span class="rating-inline__count">${esc(el.dataset.textFirst || 'Be the first to review')}</span>`;
        el.hidden = false;
      }
    });
  };

  const initReviews = (root, data) => {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    const text = (k, d) => root.dataset[k] || d;
    const debug = root.querySelector('[data-review-debug]');
    const design = root.dataset.designMode === 'true';
    if (!data.ok) {
      if (design || REVIEWS_DEBUG) { root.hidden = false; root.querySelector('[data-review-layout]').hidden = true; root.querySelector('[data-review-setup]').hidden = false; }
      if (REVIEWS_DEBUG && debug) { debug.hidden = false; debug.textContent = `Reviews not loaded: ${data.reason || 'unknown'}`; }
      return;
    }
    const s = statsFor(data, root.dataset.handle);
    if (!s.count && !data.enabled) { if (REVIEWS_DEBUG && debug) { root.hidden = false; debug.hidden = false; debug.textContent = 'Blog post found but comments are disabled and there are no reviews.'; } return; }
    root.hidden = false;
    if (REVIEWS_DEBUG && debug) { debug.hidden = false; debug.textContent = `Reviews OK: ${data.reviews.length} approved in total, ${s.count} for this product. Comments ${data.enabled ? 'enabled' : 'disabled'}${data.moderated ? ', moderated' : ''}.`; }

    // Summary card
    const summary = root.querySelector('[data-review-summary]');
    if (s.count) {
      const bars = [5, 4, 3, 2, 1].map((n) => {
        const c = s.list.filter((r) => r.rating === n).length;
        return `<li class="reviews__bar"><span class="reviews__bar-label">${n}\u2605</span><span class="reviews__bar-track"><span style="width:${Math.round((c / s.count) * 100)}%"></span></span><span class="reviews__bar-num">${c}</span></li>`;
      }).join('');
      summary.innerHTML = `<p class="reviews__avg">${s.avg}<span>/5</span></p>${starsHtml(s.percent, text('textStars', '{n} out of 5 stars').replace('{n}', s.avg), 'lg')}<p class="reviews__based">${esc(plural(text('textBased', 'Based on {n} review|Based on {n} reviews'), s.count))}</p><ul class="reviews__bars" role="list">${bars}</ul>`;
    } else {
      summary.innerHTML = `<p class="reviews__avg reviews__avg--empty">${esc(text('textNoReviews', 'No reviews yet'))}</p>${starsHtml(0, '', 'lg')}<p class="reviews__based">${esc(text('textNoReviewsText', ''))}</p>`;
    }

    // List
    const perPage = Number(root.dataset.perPage) || 6;
    const list = root.querySelector('[data-review-list]');
    const fmt = (d) => { const dt = new Date(`${d}T00:00:00`); return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); };
    list.innerHTML = s.list.map((r, i) => `
      <li class="review${i >= perPage ? ' is-collapsed' : ''}">
        <div class="review__top">${starsHtml(r.rating * 20, text('textStars', '{n} out of 5 stars').replace('{n}', r.rating), 'sm')}<time class="review__date" datetime="${esc(r.date)}">${esc(fmt(r.date))}</time></div>
        ${r.title ? `<h3 class="review__title">${esc(r.title)}</h3>` : ''}
        <div class="review__body">${r.body.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</div>
        <p class="review__author"><span class="review__avatar" aria-hidden="true">${esc((r.author || '?').trim().charAt(0).toUpperCase())}</span><span>${esc(r.author)}</span></p>
      </li>`).join('');
    root.querySelector('[data-review-empty]').hidden = s.count > 0;
    const more = root.querySelector('[data-review-more]');
    if (s.count > perPage) {
      more.textContent = text('textShowAll', 'Show all {n} reviews').replace('{n}', s.count);
      more.hidden = false;
      more.addEventListener('click', () => { list.querySelectorAll('.is-collapsed').forEach((r) => r.classList.remove('is-collapsed')); more.hidden = true; });
    }

    // Form
    const panel = root.querySelector('[data-review-panel]');
    const openBtn = root.querySelector('[data-review-open]');
    const form = root.querySelector('[data-review-form]');
    const thanks = root.querySelector('[data-review-thanks]');
    const showThanks = () => {
      panel.hidden = true;
      openBtn.hidden = true; openBtn.setAttribute('aria-expanded', 'false');
      thanks.querySelector('p').textContent = text('textThanks', 'Thank you!');
      thanks.hidden = false;
    };
    if (new URLSearchParams(location.search).get('review') === 'thanks') {
      showThanks();
      const url = new URL(location.href); url.searchParams.delete('review');
      history.replaceState(null, '', url.toString());
    }
    if (!data.enabled) return;
    root.querySelector('[data-review-note]').textContent = data.moderated ? text('textModerated', '') : text('textPublic', '');
    if (thanks.hidden) openBtn.hidden = false;
    openBtn.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      openBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    const hints = text('textHints', 'Poor|Fair|Good|Very good|Loved it').split('|');
    const hint = root.querySelector('[data-star-hint]');
    root.querySelectorAll('[data-review-rating]').forEach((r) => r.addEventListener('change', () => {
      hint.textContent = hints[Number(r.value) - 1] || ''; hint.classList.remove('is-error');
    }));

    const status = form.querySelector('[data-review-status]');
    const submit = form.querySelector('[data-review-submit]');
    const clean = (v) => String(v || '').replace(/[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim();
    // ---- Validation: every field is checked before anything can be sent ----
    const fields = {
      name: form.querySelector('[data-review-name]'),
      phone: form.querySelector('[data-review-phone]'),
      body: form.querySelector('[data-review-body]'),
    };
    const phoneDigits = () => {
      let d = fields.phone.value.replace(/\D/g, '');
      if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
      if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
      return d;
    };
    const rating = () => {
      const r = form.querySelector('[data-review-rating]:checked');
      const n = r ? Number(r.value) : 0;
      return n >= 1 && n <= 5 ? n : 0;
    };
    const problems = () => {
      const out = [];
      if (!rating()) out.push('rating');
      if (fields.name.value.trim().length < 2) out.push('name');
      if (!/^[6-9]\d{9}$/.test(phoneDigits())) out.push('phone');
      if (fields.body.value.trim().length < 10) out.push('body');
      return out;
    };
    const todo = form.querySelector('[data-review-todo]');
    const todoNames = text('textTodoItems', 'star rating|name|phone number|review').split('|');
    const ORDER = ['rating', 'name', 'phone', 'body'];
    let showErrors = false;
    const refresh = () => {
      const bad = problems();
      submit.setAttribute('aria-disabled', String(bad.length > 0));
      todo.textContent = bad.length ? text('textTodo', 'Still needed: {items}').replace('{items}', bad.map((k) => todoNames[ORDER.indexOf(k)]).join(', ')) : '';
      ORDER.forEach((k) => {
        const err = form.querySelector(`[data-error-for="${k}"]`);
        const on = showErrors && bad.includes(k);
        if (err) err.hidden = !on;
        const target = k === 'rating' ? form.querySelector('[data-star-input]') : fields[k];
        target.classList.toggle('is-invalid', on);
        if (k !== 'rating') target.setAttribute('aria-invalid', String(on));
      });
      return bad;
    };
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    // Capture phase on the document runs BEFORE any other submit listener on the form,
    // including Shopify's spam protection (CAPTCHA). Invalid reviews are stopped here;
    // valid ones continue as a normal form submit so Shopify can add its CAPTCHA token.
    let sending = false;
    const stop = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
    document.addEventListener('submit', (event) => {
      if (event.target !== form) return;
      if (sending) { stop(event); return; }
      showErrors = true;
      const bad = refresh();
      if (bad.length) {
        stop(event);
        const first = bad[0];
        const starBox = form.querySelector('[data-star-input]');
        if (first === 'rating') {
          starBox.classList.remove('is-shaking'); void starBox.offsetWidth; starBox.classList.add('is-shaking');
          starBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          form.querySelector('[data-review-rating]').focus({ preventScroll: true });
        } else {
          fields[first].focus();
        }
        return;
      }
      const stars = rating();
      const email = `91${phoneDigits()}@example.com`;
      const handle = form.dataset.reviewForm;
      const title = clean(form.querySelector('[data-review-title]').value).slice(0, 80);
      const composed = `[[${handle}|${stars}|${title}]] ${fields.body.value.trim()}`;
      // Last safety net: never post anything that doesn't carry a 1-5 rating.
      if (!/^\[\[[^|\]]+\|[1-5]\|/.test(composed)) { stop(event); return; }
      form.querySelector('[data-review-composed]').value = composed;
      // Shopify comments need an email; the phone goes there so it stays private (only visible in admin).
      form.querySelector('[data-review-email]').value = email;
      if (form.hasAttribute('data-review-fallback')) {
        if (!data.action) { stop(event); return; }
        form.action = data.action;
        if (!form.querySelector('input[name="form_type"]')) form.insertAdjacentHTML('afterbegin', '<input type="hidden" name="form_type" value="new_comment"><input type="hidden" name="utf8" value="✓">');
      }
      // Shopify then shows the reviews blog post; the code at the top of this
      // block sends the shopper straight back here with a thank-you message.
      const back = JSON.stringify({ path: location.pathname, t: Date.now() });
      try { sessionStorage.setItem(RETURN_KEY, back); } catch (e) { /* ignore */ }
      try { localStorage.setItem(RETURN_KEY, back); } catch (e) { /* ignore */ }
      sending = true;
      status.hidden = true;
      setTimeout(() => { submit.textContent = text('textSending', 'Sending…'); submit.setAttribute('aria-disabled', 'true'); }, 0);
      // Let the browser (and Shopify's CAPTCHA listener) carry on with the submit.
    }, true);
  };

  const bootReviews = () => {
    const needs = document.querySelector('[data-reviews], [data-rating-chip], [data-rating-inline]');
    if (!needs) return;
    loadReviews().then((data) => {
      paintRatings(data);
      document.querySelectorAll('[data-reviews]').forEach((r) => initReviews(r, data));
    }).catch((err) => {
      console.warn('[DecorIn reviews] could not load', err);
      document.querySelectorAll('[data-reviews]').forEach((r) => initReviews(r, { ok: false, reason: String(err) }));
    });
  };
  window.DecorInPaintRatings = () => { if (reviewStore) reviewStore.then(paintRatings).catch(() => {}); else bootReviews(); };
  bootReviews();
  document.addEventListener('shopify:section:load', bootReviews);
  // Cards added later (filters, live search) get their stars too.
  let paintTimer;
  new MutationObserver((muts) => {
    if (!muts.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && (n.matches?.('[data-rating-chip]') || n.querySelector?.('[data-rating-chip]'))))) return;
    clearTimeout(paintTimer); paintTimer = setTimeout(window.DecorInPaintRatings, 50);
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-reviews-jump]');
    const target = jump && document.getElementById('reviews');
    if (!target || target.hidden) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const initAll = () => document.querySelectorAll('.highlights').forEach(initCarousel);
  initAll();
  // Re-init when sections are edited in the Shopify theme editor
  document.addEventListener('shopify:section:load', initAll);
})();
