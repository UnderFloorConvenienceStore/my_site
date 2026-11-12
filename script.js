(function () {
  var root = document.documentElement;
  var OFF_KEY = 'screen-off';
  var DARK_KEY = 'dark-mode';

  // restore previous states (before DOM ready so no flash)
  try {
    if (localStorage.getItem(OFF_KEY) === '1') root.classList.add('off');
    if (localStorage.getItem(DARK_KEY) === '1') root.classList.add('dark');
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {
    var power = document.getElementById('power');
    var knob = document.querySelector('.knob');
    var page = document.getElementById('page');

    function syncPower() {
      power.setAttribute('aria-pressed', root.classList.contains('off') ? 'false' : 'true');
    }
    syncPower();

    // power button: screen off / on (replays the fast boot-up)
    power.addEventListener('click', function () {
      var off = root.classList.toggle('off');
      try { localStorage.setItem(OFF_KEY, off ? '1' : '0'); } catch (e) {}
      if (!off) {
        page.style.animation = 'none';
        void page.offsetWidth;
        page.style.animation = '';
      }
      syncPower();
    });

    // knob: dark mode toggle (depress look while held / clicked)
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

    // nav keys: show the press for a moment before the next page loads
    var keys = document.querySelectorAll('#panel a');
    for (var i = 0; i < keys.length; i++) {
      keys[i].addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var link = this;
        link.classList.add('pressed');
        setTimeout(function () { window.location.href = link.href; }, 150);
      });
    }
  });
})();