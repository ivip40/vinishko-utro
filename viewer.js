// In-page PDF reader for „Прочети“ links (a.read). Uses PDF.js so it works the same on phones and desktops.
// Without JavaScript (or if PDF.js fails to load) the link simply opens the PDF in a new tab.
(function () {
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var lib = null, doc = null, task = null, zoom = 1, ov, pagesEl, infoEl, obs, pageW = 0, pageH = 0, rendered = {};
  var ZOOMS = [1, 1.5, 2, 3];

  function loadLib() {
    if (lib) return Promise.resolve(lib);
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = PDFJS + 'pdf.min.js';
      s.onload = function () { lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(lib); };
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function build() {
    ov = document.createElement('div');
    ov.className = 'pv';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML =
      '<div class="pv-bar"><b class="pv-title"></b><span class="pv-info"></span>' +
      '<span class="pv-tools"><button type="button" class="pv-out" aria-label="Намали">−</button>' +
      '<button type="button" class="pv-in" aria-label="Увеличи">+</button>' +
      '<a class="pv-dl" download aria-label="Изтегли"><span>Изтегли </span>↓</a>' +
      '<button type="button" class="pv-x" aria-label="Затвори">✕</button></span></div>' +
      '<div class="pv-pages" tabindex="-1"></div>';
    document.body.appendChild(ov);
    pagesEl = ov.querySelector('.pv-pages');
    infoEl = ov.querySelector('.pv-info');
    ov.querySelector('.pv-x').onclick = function () { if (history.state && history.state.pv) history.back(); else close(); };
    ov.querySelector('.pv-in').onclick = function () { setZoom(1); };
    ov.querySelector('.pv-out').onclick = function () { setZoom(-1); };
    pagesEl.addEventListener('scroll', updateInfo, { passive: true });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) ov.querySelector('.pv-x').click(); });
    window.addEventListener('popstate', function () { if (ov.classList.contains('open')) close(); });   // phone „back“ closes the reader
    window.addEventListener('resize', function () { if (doc) layout(); });
  }

  function msg(html) { pagesEl.innerHTML = '<p class="pv-msg">' + html + '</p>'; }

  function open(href, title) {
    if (!ov) build();
    zoom = 1;
    ov.querySelector('.pv-title').textContent = title || '';
    ov.querySelector('.pv-dl').href = href;
    infoEl.textContent = '';
    ov.classList.add('open');
    document.documentElement.classList.add('pv-lock');
    history.pushState({ pv: 1 }, '');
    msg('Зарежда се…');
    pagesEl.focus();
    loadLib().then(function () {
      task = lib.getDocument({ url: href });
      task.onProgress = function (p) { if (p.total && !doc) msg('Зарежда се… ' + Math.min(99, Math.round(p.loaded / p.total * 100)) + '%'); };
      return task.promise;
    }).then(function (d) {
      doc = d;
      return d.getPage(1);
    }).then(function (p) {
      var v = p.getViewport({ scale: 1 });
      pageW = v.width; pageH = v.height;
      layout();
    }).catch(function () {
      if (!ov.classList.contains('open')) return;   // closed while loading
      msg('PDF-ът не се отвори тук. <a href="' + href + '" target="_blank" rel="noopener">Отворете го в нов таб</a>.');
    });
  }

  function close() {
    ov.classList.remove('open');
    document.documentElement.classList.remove('pv-lock');
    if (obs) obs.disconnect();
    if (task) task.destroy();
    doc = null; task = null; rendered = {};
    pagesEl.innerHTML = '';
  }

  function cssWidth() { return Math.min(pagesEl.clientWidth - 16, 900) * zoom; }

  function layout() {
    if (obs) obs.disconnect();
    rendered = {};
    pagesEl.innerHTML = '';
    var w = cssWidth(), h = w * pageH / pageW;
    for (var i = 1; i <= doc.numPages; i++) {
      var d = document.createElement('div');
      d.className = 'pv-page';
      d.style.width = w + 'px'; d.style.height = h + 'px';
      d.dataset.n = i;
      pagesEl.appendChild(d);
    }
    obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) render(e.target); });
    }, { root: pagesEl, rootMargin: '100% 0px' });
    pagesEl.querySelectorAll('.pv-page').forEach(function (d) { obs.observe(d); });
    ov.querySelector('.pv-out').disabled = zoom === ZOOMS[0];
    ov.querySelector('.pv-in').disabled = zoom === ZOOMS[ZOOMS.length - 1];
    updateInfo();
  }

  function render(box) {
    var n = +box.dataset.n, d = doc;
    if (rendered[n] || !d) return;
    rendered[n] = true;
    d.getPage(n).then(function (p) {
      if (d !== doc) return;
      var w = parseFloat(box.style.width);
      var s = w / pageW * Math.min(window.devicePixelRatio || 1, 2);
      var max = 16e6;                                  // stay within phone canvas limits at big zooms
      if (pageW * s * pageH * s > max) s = Math.sqrt(max / (pageW * pageH));
      var v = p.getViewport({ scale: s });
      var c = document.createElement('canvas');
      c.width = Math.floor(v.width); c.height = Math.floor(v.height);
      return p.render({ canvasContext: c.getContext('2d'), viewport: v }).promise.then(function () {
        if (d === doc) { box.innerHTML = ''; box.appendChild(c); }
      });
    }).catch(function () { rendered[n] = false; });
  }

  function setZoom(dir) {
    var i = ZOOMS.indexOf(zoom) + dir;
    if (!doc || i < 0 || i >= ZOOMS.length) return;
    var keep = pagesEl.scrollTop / (pagesEl.scrollHeight || 1);
    zoom = ZOOMS[i];
    layout();
    pagesEl.scrollTop = keep * pagesEl.scrollHeight;
  }

  function updateInfo() {
    if (!doc) return;
    var boxes = pagesEl.querySelectorAll('.pv-page'), top = pagesEl.getBoundingClientRect().top, cur = 1;
    for (var i = 0; i < boxes.length; i++) if (boxes[i].getBoundingClientRect().top - top < pagesEl.clientHeight / 2) cur = i + 1;
    infoEl.textContent = 'стр. ' + cur + ' / ' + doc.numPages;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.read');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;   // modified clicks still open a tab
    if (!window.IntersectionObserver || !window.Promise) return;
    e.preventDefault();
    var row = a.closest('.issue'), b = row && row.querySelector('b');
    open(a.getAttribute('href'), b ? b.textContent : '');
  });
})();
