(function () {
  var root = document.documentElement;

  /* ---------- Light / dark theme toggle ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
  }
  function paintThemeButton() {
    var dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-pressed', dark);
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('shtm-theme', next); } catch (e) {}
    paintThemeButton();
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', paintThemeButton);
  paintThemeButton();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var list = document.getElementById('nav-list');

  function closeMenu() {
    list.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = list.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  list.addEventListener('click', function (e) { if (e.target.matches('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && list.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
  });

  /* ---------- Highlight the nav link of the section on screen ---------- */
  var links = [].slice.call(document.querySelectorAll('.nav__link'));
  var linkFor = {};
  links.forEach(function (l) { linkFor[l.getAttribute('href').slice(1)] = l; });

  /* ---------- Scroll reveal ---------- */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
        var active = linkFor[entry.target.id];
        if (active) { active.classList.add('is-active'); active.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealer.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';   /* small stagger inside each group */
      revealer.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Student life: filter photos by program ---------- */
  var filterBtns = [].slice.call(document.querySelectorAll('.filter'));
  var shots = [].slice.call(document.querySelectorAll('.shot'));
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
      document.querySelector('.gallery').classList.toggle('is-filtered', f !== 'all');
      shots.forEach(function (shot) {
        shot.hidden = !(f === 'all' || shot.getAttribute('data-cat') === f);
        shot.classList.add('is-visible');
      });
    });
  });

  /* ---------- Student life: open a photo larger ---------- */
  var box = document.querySelector('.lightbox');
  if (box && typeof box.showModal === 'function') {
    var boxImg = box.querySelector('.lightbox__img');
    var boxTitle = box.querySelector('.lightbox__title');
    var boxCap = box.querySelector('.lightbox__caption');
    shots.forEach(function (shot) {
      shot.querySelector('.shot__open').addEventListener('click', function () {
        var img = shot.querySelector('img');
        boxImg.src = img.src;
        boxImg.alt = img.alt;
        boxTitle.textContent = shot.querySelector('h3').textContent;
        boxCap.textContent = shot.querySelector('.shot__text p').textContent;
        box.showModal();
      });
    });
    /* click outside the photo to close */
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  }

  /* ---------- Back-to-top button ---------- */
  var toTop = document.querySelector('.to-top');
  function onScroll() { toTop.classList.toggle('is-shown', window.scrollY > 600); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Inquiry form ---------- */
  var form = document.getElementById('inquiry-form');
  var status = document.getElementById('form-status');

  function check(id, msg, test) {
    var el = document.getElementById(id), err = document.getElementById(id + '-error'), ok = test(el.value.trim());
    el.setAttribute('aria-invalid', !ok);
    err.textContent = ok ? '' : msg;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = check('name', 'Enter your full name.', function (v) { return v.length > 1; });
    var b = check('email', 'Enter a valid email address.', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); });
    var c = check('message', 'Write a message of at least 10 characters.', function (v) { return v.length >= 10; });

    if (!(a && b && c)) {
      status.textContent = '';
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    function val(id) { return document.getElementById(id).value.trim(); }
    var name = val('name');
    var email = val('email');
    var topic = val('topic');
    var message = val('message');

    var subject = 'SHTM inquiry: ' + topic + ' (' + name + ')';
    var body = 'Name: ' + name + '\nEmail: ' + email + '\nTopic: ' + topic + '\n\n' + message;

    window.location.href = 'mailto:shtm@southland.edu.ph?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Your email app should open with the inquiry ready. Press send there to reach the department office.';
  });

  /* "Inquire about..." links pre-fill the form */
  document.querySelectorAll('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      document.getElementById('topic').value = a.getAttribute('data-topic');
      var m = document.getElementById('message');
      if (!m.value.trim()) m.value = a.getAttribute('data-msg') || '';
    });
  });
})();