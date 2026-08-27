/**
 * archifyX Viewer — SPA shell.
 * Header chrome proxies Archify toolbar; left tree navigates right iframe.
 */
(function () {
  var html = document.documentElement;
  if (html.getAttribute('data-platform') !== 'true') return;

  var isShell = html.getAttribute('data-platform-shell') === 'true';
  var rail = document.getElementById('platform-rail');
  var frame = document.getElementById('platform-frame');
  var stage = document.getElementById('platform-stage');
  var presentWatch = null;

  function shellBaseUrl() {
    // Resolve relative diagram hrefs against the shell document directory,
    // never against ?view=… (that used to break nested navigation).
    try {
      var href = window.location.href.split('#')[0].split('?')[0];
      if (/\/$/i.test(href)) return href;
      return href.replace(/[^/]+$/, '');
    } catch (_) {
      return window.location.origin + '/';
    }
  }

  function resolveHref(href) {
    if (!href || href === '#') return href;
    try {
      return new URL(href, shellBaseUrl()).href;
    } catch (_) {
      return href;
    }
  }

  function viewKey(href) {
    try {
      var url = new URL(resolveHref(href), shellBaseUrl());
      var path = url.pathname.replace(/\\/g, '/');
      var basePath = new URL(shellBaseUrl()).pathname.replace(/\\/g, '/');
      if (basePath && path.indexOf(basePath) === 0) {
        path = path.slice(basePath.length);
      }
      // serve often redirects *.html → extensionless; normalize so tree active matches.
      return path.replace(/^\//, '').replace(/\.html?$/i, '');
    } catch (_) {
      return String(href || '')
        .replace(/^\.\//, '')
        .replace(/[?#].*$/, '')
        .replace(/\.html?$/i, '');
    }
  }

  function isPresent() {
    return html.getAttribute('data-present') === 'true' || html.getAttribute('data-embed') === 'true';
  }

  function setPresent(hide) {
    if (hide) html.setAttribute('data-present', 'true');
    else html.removeAttribute('data-present');
    if (!rail) return;
    rail.hidden = hide;
    rail.setAttribute('aria-hidden', hide ? 'true' : 'false');
    html.setAttribute('data-platform-rail', hide ? 'collapsed' : 'open');
  }

  function sameView(a, b) {
    if (!a || !b) return false;
    return viewKey(a) === viewKey(b);
  }

  function markActive(href) {
    var links = document.querySelectorAll(
      '#platform-rail a.platform-rail-module, #platform-rail a.platform-type-icon'
    );
    var key = viewKey(href);
    var exactNodes = [];
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      var linkKey = viewKey(link.getAttribute('href'));
      var exact = linkKey === key;
      link.classList.toggle('is-active', exact);
      if (exact) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      if (exact) {
        var node = link.closest('.platform-tree-node');
        if (node) exactNodes.push(node);
        while (node) {
          node.setAttribute('data-expanded', 'true');
          var btn = node.querySelector(':scope > .platform-tree-row > .platform-tree-toggle');
          if (btn) btn.setAttribute('aria-expanded', 'true');
          node = node.parentElement ? node.parentElement.closest('.platform-tree-node') : null;
        }
      }
    }
    // Keep the module title row lit when a type icon (A/S/…) under it is current.
    for (var n = 0; n < exactNodes.length; n += 1) {
      var mod = exactNodes[n].querySelector(':scope > .platform-tree-row a.platform-rail-module');
      if (!mod) continue;
      mod.classList.add('is-active');
    }
  }

  function fitPane(doc) {
    if (!doc) return;
    try {
      var win = doc.defaultView;
      if (!win || !win.Archify) return;
      var A = win.Archify;
      if (A.readerLayout) {
        if (typeof A.readerLayout.measure === 'function') A.readerLayout.measure();
        if (typeof A.readerLayout.schedule === 'function') A.readerLayout.schedule();
      }
      if (A.viewerChromeLayout && typeof A.viewerChromeLayout.schedule === 'function') {
        A.viewerChromeLayout.schedule();
      }
      if (A.view && typeof A.view.reset === 'function') A.view.reset();
    } catch (_) {}
  }

  function sanitizePane(doc) {
    if (!doc || !doc.documentElement) return;
    try {
      // Keep at most one subtitle (rebuild stacking left multiples historically).
      var subs = doc.querySelectorAll('.header .subtitle, .header p.subtitle, p.subtitle');
      for (var i = 1; i < subs.length; i += 1) {
        if (subs[i] && subs[i].parentNode) subs[i].parentNode.removeChild(subs[i]);
      }
      doc.documentElement.setAttribute('data-platform-pane', 'true');
      doc.documentElement.style.setProperty('height', '100%', 'important');
      doc.documentElement.style.setProperty('max-height', '100%', 'important');
      doc.documentElement.style.setProperty('overflow', 'hidden', 'important');
      if (doc.body) {
        doc.body.style.setProperty('height', '100%', 'important');
        doc.body.style.setProperty('max-height', '100%', 'important');
        doc.body.style.setProperty('min-height', '0', 'important');
        doc.body.style.setProperty('padding', '0.65rem', 'important');
        doc.body.style.setProperty('overflow', 'hidden', 'important');
        doc.body.style.setProperty('overscroll-behavior', 'none');
      }
      fitPane(doc);
      window.setTimeout(function () { fitPane(doc); }, 80);
      window.setTimeout(function () { fitPane(doc); }, 320);
    } catch (_) {}
  }

  function navigate(href, push) {
    if (!frame || !href || href === '#') return;
    var next = resolveHref(href);
    try {
      var u = new URL(next);
      // Bust stale pane HTML that still had stacked subtitles.
      u.searchParams.set('_pt', String(Date.now()));
      next = u.href;
    } catch (_) {}
    frame.src = next;
    markActive(href);
    if (push !== false) {
      try {
        var rel = viewKey(href);
        var url = new URL(window.location.href);
        url.searchParams.set('view', rel);
        history.pushState({ view: rel }, '', url);
      } catch (_) {}
    }
  }

  function iframeDoc() {
    try { return frame && frame.contentDocument; } catch (_) { return null; }
  }

  function syncPresentFromFrame() {
    var doc = iframeDoc();
    if (!doc || !doc.documentElement) return;
    var present =
      doc.documentElement.getAttribute('data-present') === 'true' ||
      doc.documentElement.getAttribute('data-embed') === 'true';
    setPresent(present);
    syncChromeLabels();
  }

  function watchFramePresent() {
    if (presentWatch) {
      try { presentWatch.disconnect(); } catch (_) {}
      presentWatch = null;
    }
    var doc = iframeDoc();
    if (!doc || !doc.documentElement || typeof MutationObserver === 'undefined') return;
    presentWatch = new MutationObserver(function (mutations) {
      var presetChanged = false;
      for (var i = 0; i < mutations.length; i += 1) {
        if (mutations[i].attributeName === 'data-preset') presetChanged = true;
      }
      syncPresentFromFrame();
      syncChromeLabels();
      if (presetChanged) rememberPresetFromPane(doc);
    });
    presentWatch.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ['data-present', 'data-embed', 'data-theme', 'data-preset', 'data-motion', 'style']
    });
    var motionBtn = doc.getElementById('btn-motion');
    if (motionBtn) {
      presentWatch.observe(motionBtn, {
        attributes: true,
        attributeFilter: ['hidden', 'aria-pressed', 'title', 'disabled']
      });
    }
    syncPresentFromFrame();
    syncChromeLabels();
  }

  var PRESET_KEY = 'archify-preset';
  var restoringPreset = false;

  function readStoredPreset() {
    try {
      return localStorage.getItem(PRESET_KEY);
    } catch (_) {
      return null;
    }
  }

  function writeStoredPreset(preset) {
    if (!preset) return;
    try {
      localStorage.setItem(PRESET_KEY, preset);
    } catch (_) {}
  }

  function syncThemeFromPane(doc) {
    if (!doc || !doc.documentElement || !doc.defaultView) return;
    try {
      var src = doc.documentElement;
      var theme = src.getAttribute('data-theme');
      var preset = src.getAttribute('data-preset');
      if (theme) html.setAttribute('data-theme', theme);
      else html.removeAttribute('data-theme');
      if (preset) html.setAttribute('data-preset', preset);
      else {
        // Keep shell on the last chosen preset if the pane briefly clears it
        // (node focus / remount can flash "classic" otherwise).
        var kept = readStoredPreset();
        if (kept) html.setAttribute('data-preset', kept);
        else html.removeAttribute('data-preset');
      }

      // Mirror Archify CSS variables onto the shell so header/rail match the diagram.
      var cs = doc.defaultView.getComputedStyle(src);
      for (var i = 0; i < cs.length; i += 1) {
        var name = cs[i];
        if (name && name.indexOf('--') === 0) {
          var value = cs.getPropertyValue(name).trim();
          if (value) html.style.setProperty(name, value);
        }
      }
      if (document.body) {
        document.body.style.background = 'var(--bg)';
        document.body.style.color = 'var(--text)';
      }
    } catch (_) {}
  }

  function applyStoredPreset(doc) {
    if (!doc || !doc.defaultView) return;
    if (!readStoredPreset()) return;
    restoringPreset = true;
    var deadline = Date.now() + 2000;
    var stableSince = 0;
    function tick() {
      var wanted = readStoredPreset();
      if (!wanted) {
        restoringPreset = false;
        return;
      }
      try {
        var A = doc.defaultView.Archify;
        if (A && A.preset && typeof A.preset.apply === 'function') {
          var current = doc.documentElement.getAttribute('data-preset');
          if (current !== wanted) {
            A.preset.apply(wanted);
            stableSince = 0;
            syncChromeLabels();
          } else if (!stableSince) {
            stableSince = Date.now();
            syncChromeLabels();
          } else if (Date.now() - stableSince >= 400) {
            restoringPreset = false;
            syncChromeLabels();
            return;
          }
        } else {
          doc.documentElement.setAttribute('data-preset', wanted);
          var svg = doc.querySelector('.diagram-container > svg, svg');
          if (svg) svg.setAttribute('data-preset', wanted);
        }
      } catch (_) {}
      if (Date.now() < deadline) window.setTimeout(tick, 80);
      else {
        restoringPreset = false;
        syncChromeLabels();
      }
    }
    tick();
  }

  var rememberTimer = null;

  function rememberPresetFromPane(doc) {
    // While restoring, ignore authored "classic" flashes so they don't wipe storage.
    // Debounce so brief focus/remount attribute flickers don't stick.
    if (restoringPreset || !doc || !doc.documentElement) return;
    var preset = doc.documentElement.getAttribute('data-preset');
    if (!preset) return;
    if (rememberTimer) window.clearTimeout(rememberTimer);
    rememberTimer = window.setTimeout(function () {
      rememberTimer = null;
      if (restoringPreset) return;
      var now = doc.documentElement.getAttribute('data-preset');
      if (now) writeStoredPreset(now);
    }, 280);
  }

  function syncMotionButton(doc) {
    var proxy = document.getElementById('platform-btn-motion');
    if (!proxy) return;
    var src = doc && doc.getElementById('btn-motion');
    if (!src) {
      proxy.hidden = true;
      return;
    }
    var visible = !src.hidden && getComputedStyle(src).display !== 'none';
    proxy.hidden = !visible;
    if (!visible) return;
    var srcLabel = doc.getElementById('motion-label');
    var dstLabel = proxy.querySelector('[data-label]');
    if (srcLabel && dstLabel) dstLabel.textContent = srcLabel.textContent;
    var pressed = src.getAttribute('aria-pressed');
    if (pressed != null) proxy.setAttribute('aria-pressed', pressed);
    if (src.title) proxy.title = src.title;
  }

  function syncChromeLabels() {
    var doc = iframeDoc();
    if (!doc) return;
    var map = [
      ['platform-btn-theme', 'theme-label', 'btn-theme'],
      ['platform-btn-preset', 'preset-label', 'btn-preset'],
      ['platform-btn-motion', 'motion-label', 'btn-motion'],
      ['platform-btn-present', 'present-label', 'btn-present'],
      ['platform-btn-export', null, 'btn-export']
    ];
    for (var i = 0; i < map.length; i += 1) {
      var proxyId = map[i][0];
      var labelId = map[i][1];
      var srcId = map[i][2];
      var proxy = document.getElementById(proxyId);
      var src = doc.getElementById(srcId);
      if (!proxy || !src) continue;
      if (labelId) {
        var srcLabel = doc.getElementById(labelId);
        var dstLabel = proxy.querySelector('[data-label]');
        if (srcLabel && dstLabel) dstLabel.textContent = srcLabel.textContent;
      }
      var pressed = src.getAttribute('aria-pressed');
      if (pressed != null) proxy.setAttribute('aria-pressed', pressed);
      if (src.title) proxy.title = src.title;
    }
    syncMotionButton(doc);
    syncThemeFromPane(doc);
  }

  function proxyArchify(id) {
    var doc = iframeDoc();
    if (!doc) return;
    var btn = doc.getElementById(id);
    if (btn) btn.click();
    window.setTimeout(function () {
      syncChromeLabels();
      if (id === 'btn-preset') rememberPresetFromPane(iframeDoc());
    }, 50);
    window.setTimeout(function () {
      syncChromeLabels();
      if (id === 'btn-preset') rememberPresetFromPane(iframeDoc());
    }, 220);
    window.setTimeout(syncPresentFromFrame, 80);
  }

  function wireChromeToolbar() {
    var host = document.getElementById('platform-chrome-toolbar');
    if (!host) return;
    host.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-archify-proxy]');
      if (!btn || !host.contains(btn)) return;
      event.preventDefault();
      proxyArchify(btn.getAttribute('data-archify-proxy'));
    });
  }

  function unlockReaderWidth(doc) {
    if (!doc || !doc.documentElement) return;
    doc.documentElement.style.setProperty('--archify-reader-width', '100%');
    doc.documentElement.setAttribute('data-reader-layout', 'adaptive');
    doc.documentElement.removeAttribute('data-reader-overflow');
    try {
      if (doc.defaultView && doc.defaultView.Archify && doc.defaultView.Archify.readerLayout) {
        var layout = doc.defaultView.Archify.readerLayout;
        if (!layout.__platformFullWidth) {
          layout.measure = function () {
            return { width: Math.max(480, doc.documentElement.clientWidth || 1200), platform: true };
          };
          layout.schedule = function () {
            doc.documentElement.style.setProperty('--archify-reader-width', '100%');
          };
          layout.__platformFullWidth = true;
        }
      }
    } catch (_) {}
  }

  function onFrameLoad() {
    var doc = iframeDoc();
    watchFramePresent();
    unlockReaderWidth(doc);
    sanitizePane(doc);
    // Restore visual style across SPA navigations (Archify only persists theme).
    applyStoredPreset(doc);
    syncChromeLabels();
    try {
      var path = frame.contentWindow && frame.contentWindow.location
        ? frame.contentWindow.location.href
        : frame.src;
      markActive(path);
    } catch (_) {
      markActive(frame.getAttribute('src'));
    }
  }

  var tree = document.getElementById('platform-tree');
  if (tree) {
    tree.addEventListener('click', function (event) {
      var btn = event.target.closest('.platform-tree-toggle');
      if (!btn || !tree.contains(btn)) return;
      event.preventDefault();
      var node = btn.closest('.platform-tree-node');
      if (!node) return;
      var open = node.getAttribute('data-expanded') === 'true';
      node.setAttribute('data-expanded', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  if (isShell && rail && frame) {
    wireChromeToolbar();
    rail.addEventListener('click', function (event) {
      var link = event.target.closest('a.platform-rail-module, a.platform-type-icon');
      if (!link || !rail.contains(link)) return;
      var href = link.getAttribute('href');
      if (!href || href === '#' || href.indexOf('javascript:') === 0) return;
      event.preventDefault();
      event.stopPropagation();
      navigate(href, true);
    });
    frame.addEventListener('load', onFrameLoad);
    window.addEventListener('popstate', function () {
      var params = new URLSearchParams(window.location.search);
      var view = params.get('view');
      if (view) navigate(view, false);
    });
    var start = null;
    try { start = new URLSearchParams(window.location.search).get('view'); } catch (_) {}
    if (!start) start = frame.getAttribute('data-default-src') || frame.getAttribute('src');
    if (start) {
      var cur = frame.getAttribute('src') || '';
      if (viewKey(cur) !== viewKey(start)) navigate(start, false);
      else markActive(start);
    }
  }

  if (!isShell && stage && rail) {
    function syncPresent() {
      var hide = isPresent();
      rail.hidden = hide;
      rail.setAttribute('aria-hidden', hide ? 'true' : 'false');
      html.setAttribute('data-platform-rail', hide ? 'collapsed' : 'open');
    }
    syncPresent();
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i += 1) {
          if (records[i].attributeName === 'data-present' || records[i].attributeName === 'data-embed') {
            syncPresent();
            break;
          }
        }
      }).observe(html, { attributes: true, attributeFilter: ['data-present', 'data-embed'] });
    }
    html.style.setProperty('--archify-reader-width', '100%');
  }
})();
