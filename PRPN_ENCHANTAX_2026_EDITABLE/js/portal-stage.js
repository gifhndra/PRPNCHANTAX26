/* ============================================================================
 * TAHAP 2: PERJALANAN HUTAN (#pg-portal) INTERACTIVE CONTROLLER
 * Tidak mengubah logika BEKU di app.js / cms.js; hanya mempercantik & mengupgrade
 * DOM di dalam #pg-portal serta menghubungkan interaksi baru (gerbang, kitab, cermin).
 * ============================================================================ */
(function () {
  'use strict';

  var ICON_BASE = 'assets/icons/icons.svg#';

  var EMOJI_TO_ICON = {
    '🧠': 'icon-lcc',
    '🎨': 'icon-creative',
    '📝': 'icon-cfp',
    '📤': 'icon-send',
    '⚖️': 'icon-judge',
    '⚖': 'icon-judge',
    '🏆': 'icon-trophy',
    '🔥': 'icon-active',
    '⏳': 'icon-hourglass',
    '⏱️': 'icon-clock',
    '⏱': 'icon-clock',
    '📖': 'icon-book',
    '📘': 'icon-book',
    '🖼️': 'icon-twibbon',
    '🖼': 'icon-twibbon',
    '📜': 'icon-cfp',
    '🎯': 'icon-lcc',
    '📢': 'icon-poster',
    '🔒': 'icon-enter',
    '✨': 'icon-lcc',
    '✧': 'icon-lcc',
    '✦': 'icon-lcc',
    '✓': 'icon-done'
  };

  var EMOJI_REGEX = /(?:🧠|🎨|📝|📤|⚖️|⚖|🏆|🔥|⏳|⏱️|⏱|📖|📘|🖼️|🖼|📜|🎯|📢|🔒|✨|✧|✦)/g;

  function makeSvgIcon(symbolId, extraClass) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', extraClass ? 'portal-svg-icon ' + extraClass : 'portal-svg-icon');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', ICON_BASE + symbolId);
    svg.appendChild(use);
    return svg;
  }

  /* Ganti seluruh teks emoji tersisa di dalam root #pg-portal dengan SVG monokrom */
  function replaceEmojisInElement(el) {
    if (!el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && n.parentElement.closest('svg, script, style')) continue;
      if (EMOJI_REGEX.test(n.nodeValue)) {
        textNodes.push(n);
      }
      EMOJI_REGEX.lastIndex = 0;
    }

    textNodes.forEach(function (node) {
      var val = node.nodeValue;
      var frag = document.createDocumentFragment();
      var lastIdx = 0;
      EMOJI_REGEX.lastIndex = 0;
      var m;
      while ((m = EMOJI_REGEX.exec(val)) !== null) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(val.slice(lastIdx, m.index)));
        }
        var iconId = EMOJI_TO_ICON[m[0]] || 'icon-cfp';
        frag.appendChild(makeSvgIcon(iconId));
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < val.length) {
        frag.appendChild(document.createTextNode(val.slice(lastIdx)));
      }
      if (node.parentNode) {
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  /* Upgrade ikon status .c dan detail #det/#cdTxt agar bebas emoji */
  function upgradeTimelineDom() {
    var pathEl = document.querySelector('#pg-portal #jadwal .path');
    var nodesEl = document.getElementById('nodes');
    var detEl = document.getElementById('det');
    var cdTxtEl = document.getElementById('cdTxt');

    if (nodesEl && pathEl) {
      var nodeList = nodesEl.querySelectorAll('.node');
      pathEl.style.setProperty('--tl-count', String(Math.max(nodeList.length, 3)));
      nodeList.forEach(function (btn) {
        var cEl = btn.querySelector('.c');
        if (cEl) {
          var iconId = btn.classList.contains('done')
            ? 'icon-done'
            : (btn.classList.contains('now') ? 'icon-active' : 'icon-hourglass');
          cEl.textContent = '';
          cEl.appendChild(makeSvgIcon(iconId));
        }
      });
    }

    if (detEl) {
      replaceEmojisInElement(detEl);
    }
    if (cdTxtEl) {
      replaceEmojisInElement(cdTxtEl);
    }
  }

  /* Bagian B: Animasi Pintu Gerbang + 20 Partikel Kembang Api saat memilih cabang */
  function setupKingdomPaths() {
    var container = document.getElementById('timelineBranches');
    if (!container) return;

    var buttons = container.querySelectorAll('button[data-tl]');
    buttons.forEach(function (btn) {
      // Pastikan partikel kembang api berjumlah 20 (maksimal 24) per gerbang
      var fw = btn.querySelector('.branch-fireworks');
      if (fw && fw.children.length === 0) {
        for (var p = 0; p < 20; p++) {
          var spark = document.createElement('span');
          spark.className = 'fw-spark';
          var angle = (Math.PI * 2 * p) / 20;
          var dist = 28 + (p % 3) * 18;
          spark.style.setProperty('--fx', Math.round(Math.cos(angle) * dist) + 'px');
          spark.style.setProperty('--fy', Math.round(Math.sin(angle) * dist - 14) + 'px');
          spark.style.animationDelay = ((p % 4) * 45) + 'ms';
          fw.appendChild(spark);
        }
      }

      btn.addEventListener('click', function () {
        // Trigger gerbang terbuka & kembang api 1.2 detik lalu berhenti sendiri
        btn.classList.remove('fw-firing', 'gate-opening');
        void btn.offsetWidth;
        btn.classList.add('fw-firing', 'gate-opening');
        window.clearTimeout(btn._fwTimer);
        btn._fwTimer = window.setTimeout(function () {
          btn.classList.remove('fw-firing', 'gate-opening');
        }, 1220);

        // Jalankan ulang pembaruan cue & upgrade DOM setelah app.js menyelesaikan klik
        window.setTimeout(function () {
          updateBranchCues();
          upgradeTimelineDom();
        }, 0);
      });
    });

    updateBranchCues();
  }

  function updateBranchCues() {
    var buttons = document.querySelectorAll('#pg-portal #timelineBranches button[data-tl]');
    buttons.forEach(function (btn) {
      var cue = btn.querySelector('.gate-cue');
      if (!cue) return;
      cue.textContent = btn.classList.contains('on') ? 'Jalan Terpilih' : 'Masuki Gerbang';
    });
  }

  /* Bagian D: Kitab Kuno — Animasi Jatuh Sekali + Buka/Tutup + Sinkronisasi Handbook */
  function setupBookTome() {
    var book = document.getElementById('timelineBook');
    var cover = document.getElementById('bookCoverOverlay');
    var closeBtn = document.getElementById('btnCloseBook');
    var nodesEl = document.getElementById('nodes');
    var shell = document.getElementById('bookShell');
    if (!book || !shell) return;

    function openBook(withTurn) {
      if (book.classList.contains('is-open')) return;
      book.classList.remove('is-closed');
      book.classList.add('is-open');
      if (cover) cover.setAttribute('aria-expanded', 'true');
      if (withTurn !== false) {
        shell.classList.remove('book-turn-next');
        void shell.offsetWidth;
        shell.classList.add('book-turn-next');
        window.setTimeout(function () {
          shell.classList.remove('book-turn-next');
        }, 620);
      }
    }

    function closeBook() {
      book.classList.remove('is-open');
      book.classList.add('is-closed');
      if (cover) cover.setAttribute('aria-expanded', 'false');
    }

    if (cover) {
      cover.addEventListener('click', function () {
        openBook(true);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeBook();
      });
    }

    // Ketuk tahap timeline otomatis membuka kitab & memicu animasi balik halaman
    if (nodesEl) {
      nodesEl.addEventListener('click', function (e) {
        if (e.target && e.target.closest('.node')) {
          if (!book.classList.contains('is-open')) {
            openBook(true);
          } else {
            shell.classList.remove('book-turn-next');
            void shell.offsetWidth;
            shell.classList.add('book-turn-next');
            window.setTimeout(function () {
              shell.classList.remove('book-turn-next');
            }, 620);
          }
          window.setTimeout(upgradeTimelineDom, 0);
        }
      });
    }

    // Animasi jatuh SEKALI saat bagian ini masuk layar
    if ('IntersectionObserver' in window) {
      book.classList.add('book-await-drop');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            book.classList.remove('book-await-drop');
            book.classList.add('book-dropped');
            io.disconnect();
          }
        });
      }, { threshold: 0.14 });
      io.observe(book);
    }

    // Sinkronkan judul acara dari CMS (#hero .ttl) ke sampul kitab
    syncBookTitle();
  }

  function syncBookTitle() {
    var evEl = document.getElementById('bookCoverEvent');
    var ttlEl = document.querySelector('#hero .ttl');
    if (evEl && ttlEl && ttlEl.textContent.trim()) {
      evEl.textContent = ttlEl.textContent.trim();
    }
  }

  /* Render ulang Akses Cepat (Handbook, Twibbon, Poster) di dalam Kitab dari data CMS kitList() */
  function renderBookKitItems() {
    var mount = document.getElementById('portalBookKit');
    if (!mount) return;

    var items = [];
    try {
      if (typeof kitList === 'function' && typeof CT !== 'undefined' && CT.gen) {
        items = kitList(CT.gen).filter(function (it) { return it && it.on !== false; });
      }
    } catch (e) {
      items = [];
    }

    // Fallback pembacaan DOM dari #kcs jika fungsi lokal tidak terekspos
    if (!items.length) {
      var kcsCards = document.querySelectorAll('#kcs .kc');
      kcsCards.forEach(function (kc) {
        var h3 = kc.querySelector('h3');
        var p = kc.querySelector('.kcb p');
        var a = kc.querySelector('a');
        var im = kc.querySelector('.kcb img');
        items.push({
          t: h3 ? h3.textContent.trim() : 'Dokumen',
          d: p ? p.textContent.trim() : '',
          b: a ? a.textContent.trim() : 'Buka Tautan',
          u: a ? a.getAttribute('href') : '#',
          p: im ? im.getAttribute('src') : ''
        });
      });
    }

    if (!items.length) {
      mount.innerHTML = '<h4 class="kit-ledger-title"><span>Akses Cepat &amp; Kitab</span></h4><p class="sub" style="font-size:13px;color:#5c282c">Data panduan belum dimuat.</p>';
      return;
    }

    mount.innerHTML = '';
    var heading = document.createElement('h4');
    heading.className = 'kit-ledger-title';
    heading.appendChild(makeSvgIcon('icon-book'));
    var headingText = document.createElement('span');
    headingText.textContent = 'Akses Cepat: Handbook, Twibbon & Poster';
    heading.appendChild(headingText);
    mount.appendChild(heading);

    var list = document.createElement('div');
    list.className = 'kit-ledger-list';

    items.forEach(function (it, idx) {
      var card = document.createElement('div');
      card.className = 'kit-ledger-card';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kit-ledger-btn';
      btn.setAttribute('aria-expanded', 'false');

      var left = document.createElement('span');
      left.className = 'kit-ledger-left';
      var lower = (it.t || '').toLowerCase();
      var icoId = lower.indexOf('twib') !== -1
        ? 'icon-twibbon'
        : (lower.indexOf('post') !== -1 ? 'icon-poster' : 'icon-book');
      left.appendChild(makeSvgIcon(icoId));

      var nameEl = document.createElement('span');
      nameEl.className = 'kit-ledger-name';
      nameEl.textContent = it.t || ('Akses ' + (idx + 1));
      left.appendChild(nameEl);

      var toggle = document.createElement('span');
      toggle.className = 'kit-ledger-toggle';
      toggle.textContent = 'Buka';

      btn.appendChild(left);
      btn.appendChild(toggle);

      var body = document.createElement('div');
      body.className = 'kit-ledger-body';
      body.hidden = true;

      if (it.d) {
        var desc = document.createElement('p');
        desc.style.margin = '8px 0 0';
        desc.textContent = it.d;
        body.appendChild(desc);
      }
      if (it.p) {
        var thumb = document.createElement('div');
        thumb.className = 'kit-ledger-thumb';
        var img = document.createElement('img');
        img.src = it.p;
        img.alt = it.t || 'Pratinjau dokumen';
        img.loading = 'lazy';
        thumb.appendChild(img);
        body.appendChild(thumb);
      }
      var hasUrl = it.u && it.u !== '#' && it.u.trim() !== '';
      var link = document.createElement('a');
      link.className = 'kit-ledger-link';
      link.textContent = it.b || 'Buka Tautan';
      if (hasUrl) {
        link.href = it.u;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.href = '#pg-portal';
        link.setAttribute('aria-disabled', 'true');
        link.addEventListener('click', function (ev) { ev.preventDefault(); });
      }
      body.appendChild(link);

      btn.addEventListener('click', function () {
        var isOpen = !body.hidden;
        body.hidden = isOpen;
        btn.setAttribute('aria-expanded', String(!isOpen));
        toggle.textContent = isOpen ? 'Buka' : 'Tutup';
      });

      card.appendChild(btn);
      card.appendChild(body);
      list.appendChild(card);
    });

    mount.appendChild(list);
  }

  /* Bagian E: Cermin Penambah Pesona */
  function setupCharmMirror() {
    var mirrorBtn = document.getElementById('mirrorFrameBtn');
    var sticky = document.getElementById('mirrorStickyNote');
    var reveal = document.getElementById('mirrorRevealBox');
    var skipBtn = document.getElementById('btnMirrorSkip');

    if (mirrorBtn && reveal) {
      mirrorBtn.addEventListener('click', function () {
        mirrorBtn.classList.remove('is-charmed');
        void mirrorBtn.offsetWidth;
        mirrorBtn.classList.add('is-charmed');
        reveal.hidden = false;
        mirrorBtn.setAttribute('aria-expanded', 'true');
        if (sticky) {
          sticky.textContent = 'Pesona aktif';
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        var target = document.getElementById('berita') || document.getElementById('tim');
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  /* Observer ringan untuk mendeteksi pembaruan CMS live di #pg-portal dan #kcs */
  function setupObservers() {
    var portal = document.getElementById('pg-portal');
    var nodesEl = document.getElementById('nodes');
    var detEl = document.getElementById('det');
    var cdTxtEl = document.getElementById('cdTxt');
    var branchesEl = document.getElementById('timelineBranches');
    var abxEl = document.getElementById('abx');
    var kcsEl = document.getElementById('kcs');
    var heroTtl = document.querySelector('#hero .ttl');

    var obsCfg = { childList: true, subtree: true };

    if (nodesEl || detEl || cdTxtEl) {
      var tlObs = new MutationObserver(function () {
        tlObs.disconnect();
        upgradeTimelineDom();
        if (nodesEl) tlObs.observe(nodesEl, { childList: true });
        if (detEl) tlObs.observe(detEl, { childList: true });
        if (cdTxtEl) tlObs.observe(cdTxtEl, { childList: true, characterData: true, subtree: true });
      });
      if (nodesEl) tlObs.observe(nodesEl, { childList: true });
      if (detEl) tlObs.observe(detEl, { childList: true });
      if (cdTxtEl) tlObs.observe(cdTxtEl, { childList: true, characterData: true, subtree: true });
    }

    if (branchesEl) {
      var brObs = new MutationObserver(updateBranchCues);
      brObs.observe(branchesEl, { attributes: true, attributeFilter: ['class'], subtree: true });
    }

    if (abxEl) {
      var abObs = new MutationObserver(function () {
        abObs.disconnect();
        replaceEmojisInElement(abxEl);
        abObs.observe(abxEl, obsCfg);
      });
      abObs.observe(abxEl, obsCfg);
    }

    if (kcsEl) {
      var kcsObs = new MutationObserver(function () {
        renderBookKitItems();
      });
      kcsObs.observe(kcsEl, { childList: true });
    }

    if (heroTtl) {
      var ttlObs = new MutationObserver(syncBookTitle);
      ttlObs.observe(heroTtl, { childList: true, characterData: true, subtree: true });
    }

    if (portal) {
      var portalNews = document.getElementById('nlist');
      if (portalNews) {
        var newsObs = new MutationObserver(function () {
          newsObs.disconnect();
          replaceEmojisInElement(portal);
          newsObs.observe(portalNews, obsCfg);
        });
        newsObs.observe(portalNews, obsCfg);
      }
    }
  }

  function initPortalStage() {
    setupKingdomPaths();
    setupBookTome();
    setupCharmMirror();
    upgradeTimelineDom();
    renderBookKitItems();
    replaceEmojisInElement(document.getElementById('pg-portal'));
    setupObservers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalStage);
  } else {
    initPortalStage();
  }
})();
