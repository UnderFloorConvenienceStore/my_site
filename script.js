(function () {
  var root = document.documentElement;
  var OFF_KEY = 'screen-off';
  var DARK_KEY = 'dark-mode';

  // true if the visitor's device asks for less motion
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // which "channel" each page is on (matches the order of the panel keys)
  var CHANNELS = {
    index: '01',
    about: '02',
    archives: '03', projects: '03', writings: '03', videos: '03', photos: '03', shelf: '03',
    guestbook: '04',
    links: '05'
  };

  // restore previous states (before DOM ready so no flash)
  try {
    var savedOff = localStorage.getItem(OFF_KEY);
    var savedDark = localStorage.getItem(DARK_KEY);
    if (savedOff === '1') root.classList.add('off');
    if (savedDark === '1') {
      root.classList.add('dark');
    } else if (savedDark === null && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
      // first visit, nothing saved yet: follow the device's light/dark setting
      root.classList.add('dark');
    }
  } catch (e) {}

  // if the browser restores a page from its back/forward cache, undo any half-finished animation
  window.addEventListener('pageshow', function () {
    root.classList.remove('leaving', 'shutting');
    document.querySelectorAll('a.pressed').forEach(function (a) { a.classList.remove('pressed'); });
  });

  document.addEventListener('DOMContentLoaded', function () {
    var power = document.getElementById('power');
    var knob = document.querySelector('.knob');
    var page = document.getElementById('page');
    var bezel = document.getElementById('bezel');

    function syncPower() {
      power.setAttribute('aria-pressed', root.classList.contains('off') ? 'false' : 'true');
    }
    syncPower();

    // ---- channel readout (the little "CH 03" in the corner after each page loads) ----
    var name = location.pathname.split('/').pop().replace('.html', '') || 'index';
    if (bezel && CHANNELS[name]) {
      var osd = document.createElement('div');
      osd.id = 'osd';
      osd.setAttribute('aria-hidden', 'true');
      osd.textContent = 'CH ' + CHANNELS[name];
      bezel.appendChild(osd);
    }

    // ---- power button: CRT shutdown / replay the fast boot-up ----
    function setOff(off) {
      root.classList.toggle('off', off);
      try { localStorage.setItem(OFF_KEY, off ? '1' : '0'); } catch (e) {}
      if (!off) {
        page.style.animation = 'none';
        void page.offsetWidth;
        page.style.animation = '';
      }
      syncPower();
    }

    var busy = false;   // stops double-clicks while the shutdown animation is playing
    power.addEventListener('click', function () {
      if (busy) return;
      if (root.classList.contains('off')) { setOff(false); return; }   // turning on: boot animation
      if (reduceMotion) { setOff(true); return; }                      // no animation wanted
      busy = true;
      root.classList.add('shutting');                                  // starts the CSS shutdown animation
      power.setAttribute('aria-pressed', 'false');
      setTimeout(function () {
        root.classList.remove('shutting');
        setOff(true);                                                  // then switch to the black "off" screen
        busy = false;
      }, 650);
    });

    // ---- knob: dark mode toggle (depress look while held / clicked) ----
    if (knob) {
      knob.setAttribute('role', 'button');
      knob.setAttribute('tabindex', '0');
      knob.setAttribute('aria-label', 'Toggle dark mode');
      knob.setAttribute('aria-pressed', root.classList.contains('dark') ? 'true' : 'false');

      function toggleDark() {
        var dark = root.classList.toggle('dark');
        try { localStorage.setItem(DARK_KEY, dark ? '1' : '0'); } catch (e) {}
        knob.setAttribute('aria-pressed', dark ? 'true' : 'false');
        // brief pressed flash
        knob.classList.add('pressed');
        setTimeout(function () { knob.classList.remove('pressed'); }, 150);
      }

      knob.addEventListener('click', toggleDark);
      knob.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDark();
        }
      });
    }

    // ---- links that change page: show the press, play the TV "channel change", then go ----
    var keys = document.querySelectorAll('#panel a, .drawers a, .back a');
    for (var i = 0; i < keys.length; i++) {
      keys[i].addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        var link = this;
        // leave external links and new-tab links alone (they just work normally)
        if (link.target === '_blank' || link.origin !== location.origin) return;
        e.preventDefault();
        link.classList.add('pressed');
        var tv = !root.classList.contains('off') && !reduceMotion;
        if (tv) root.classList.add('leaving');                         // starts the CSS screen-collapse
        setTimeout(function () { window.location.href = link.href; }, tv ? 320 : 150);
      });
    }
  });
})();