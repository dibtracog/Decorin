/* DecorIn theme scripts — no dependencies. */
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
     them. A trailing "s" is ignored (vases → vase). Order stays in catalogue order,
     with title matches first. */
  const normalizeText = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
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
    const money = (value) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          : `<div class="catalogue__empty"><span aria-hidden="true">✦</span><p>${escapeHtml(fill(form.dataset.textEmpty, { terms }))}</p></div>`}`;
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
  const RETURN_KEY = 'decorin:reviewReturn';
  // After a non-AJAX submit Shopify lands on the blog post; send the shopper back.
  try {
    const back = sessionStorage.getItem(RETURN_KEY);
    if (back && document.body.classList.contains('template-article')) {
      sessionStorage.removeItem(RETURN_KEY);
      const url = new URL(back, location.origin);
      url.searchParams.set('review', 'thanks');
      url.hash = 'reviews';
      location.replace(url.toString());
    }
  } catch (e) { /* storage blocked */ }

  const initReviews = (root) => {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    const panel = root.querySelector('[data-review-panel]');
    const openBtn = root.querySelector('[data-review-open]');
    const form = root.querySelector('[data-review-form]');
    const thanks = root.querySelector('[data-review-thanks]');
    const text = (k, d) => root.dataset[k] || d;
    const showThanks = () => {
      if (panel) panel.hidden = true;
      if (openBtn) { openBtn.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); }
      if (thanks) { thanks.querySelector('p').textContent = text('textThanks', 'Thank you!'); thanks.hidden = false; }
    };

    if (openBtn && panel) openBtn.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      openBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering');
        const first = panel.querySelector('[data-star-input] label:last-of-type');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (first) first.focus?.();
      }
    });

    const more = root.querySelector('[data-review-more]');
    if (more) more.addEventListener('click', () => {
      root.querySelectorAll('.review.is-collapsed').forEach((r) => r.classList.remove('is-collapsed'));
      more.remove();
    });

    // Star hint ("Loved it", ...)
    const hints = text('textHints', 'Poor|Fair|Good|Very good|Loved it').split('|');
    const hint = root.querySelector('[data-star-hint]');
    root.querySelectorAll('[data-review-rating]').forEach((r) => r.addEventListener('change', () => {
      if (hint) { hint.textContent = hints[Number(r.value) - 1] || ''; hint.classList.remove('is-error'); }
    }));

    if (new URLSearchParams(location.search).get('review') === 'thanks') {
      showThanks();
      const url = new URL(location.href); url.searchParams.delete('review');
      history.replaceState(null, '', url.toString());
    }

    if (!form) return;
    const status = form.querySelector('[data-review-status]');
    const submit = form.querySelector('[data-review-submit]');
    const clean = (v) => String(v || '').replace(/[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const picked = form.querySelector('[data-review-rating]:checked');
      if (!picked) {
        if (hint) { hint.textContent = text('textPick', 'Please choose a star rating.'); hint.classList.add('is-error'); }
        form.querySelector('[data-star-input]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const handle = form.dataset.reviewForm;
      const title = clean(form.querySelector('[data-review-title]')?.value).slice(0, 80);
      const body = String(form.querySelector('[data-review-body]')?.value || '').trim();
      form.querySelector('[data-review-composed]').value = `[[${handle}|${picked.value}|${title}]] ${body}`;

      const label = submit.textContent;
      submit.disabled = true; submit.textContent = text('textSending', 'Sending…');
      if (status) status.hidden = true;
      const nativeSubmit = () => {
        try { sessionStorage.setItem(RETURN_KEY, location.pathname); } catch (e) { /* ignore */ }
        HTMLFormElement.prototype.submit.call(form);
      };
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), credentials: 'same-origin' });
        // Shopify may ask for a spam check (hCaptcha); let the browser handle it normally.
        if (res.redirected && /\/challenge/.test(res.url)) { nativeSubmit(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        if (hint) hint.textContent = '';
        showThanks();
        thanks?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        console.warn('[DecorIn reviews]', err);
        if (status) { status.textContent = text('textError', 'Something went wrong.'); status.hidden = false; }
      } finally {
        submit.disabled = false; submit.textContent = label;
      }
    });
  };
  document.querySelectorAll('[data-reviews]').forEach(initReviews);
  document.addEventListener('shopify:section:load', (e) => initReviews(e.target.querySelector('[data-reviews]')));
  document.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-reviews-jump]');
    const target = jump && document.getElementById('reviews');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const initAll = () => document.querySelectorAll('.highlights').forEach(initCarousel);
  initAll();
  // Re-init when sections are edited in the Shopify theme editor
  document.addEventListener('shopify:section:load', initAll);
})();
