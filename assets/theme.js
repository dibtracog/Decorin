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

  /* ---------- Live search: results update as you type ---------- */
  const initSearch = () => {
    const form = document.querySelector('[data-facets-search]');
    if (!form || form.dataset.ready) return;
    form.dataset.ready = 'true';
    const input = form.querySelector('[data-search-input]');
    const clear = form.querySelector('[data-search-clear]');
    const searchUrl = form.getAttribute('action');
    const catalogue = form.dataset.catalogueUrl;
    const live = form.hasAttribute('data-live-search') && document.querySelector('[data-results]');
    // Where an empty search returns to: this collection if we started on one, otherwise the full catalogue
    const onSearchPage = window.location.pathname.startsWith(searchUrl);
    const restoreUrl = onSearchPage ? catalogue : window.location.pathname;
    let lastQuery = onSearchPage ? (input.value.trim() || null) : input.value.trim();
    let controller; let timer;

    const run = async (q) => {
      if (!live) { window.location.href = q ? `${searchUrl}?q=${encodeURIComponent(q)}&type=product&options%5Bprefix%5D=last` : catalogue; return; }
      if (q === lastQuery) return;
      lastQuery = q;
      if (controller) controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      const url = q ? `${searchUrl}?q=${encodeURIComponent(q)}&type=product&options%5Bprefix%5D=last` : restoreUrl;
      const section = q ? 'main-search' : 'main-collection';
      form.classList.add('is-searching');
      setLoading(true);
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=${section}`, { signal });
        if (!res.ok) throw new Error(res.status);
        swapResults(await res.text(), url);
        form.toggleAttribute('data-has-results', !!q);
      } catch (err) {
        if (err.name === 'AbortError') return;
        window.location.href = url;
      } finally {
        if (!signal.aborted) { form.classList.remove('is-searching'); setLoading(false); }
      }
    };

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => run(input.value.trim()), 300);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      if (!window.matchMedia('(min-width: 990px)').matches) input.blur(); // hide the phone keyboard to reveal results
      run(input.value.trim());
    });
    clear && clear.addEventListener('click', () => {
      input.value = '';
      input.focus();
      clearTimeout(timer);
      run('');
    });
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

  const initAll = () => document.querySelectorAll('.highlights').forEach(initCarousel);
  initAll();
  // Re-init when sections are edited in the Shopify theme editor
  document.addEventListener('shopify:section:load', initAll);
})();
