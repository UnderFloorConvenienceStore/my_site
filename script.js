(function () {
  var root = document.documentElement;
  var KEY = 'screen-off';

  // remember if the screen was switched off on a previous page
  try {
    if (localStorage.getItem(KEY) === '1') root.classList.add('off');
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {
    var power = document.getElementById('power');
    var page = document.getElementById('page');

    function sync() {
      power.setAttribute('aria-pressed', root.classList.contains('off') ? 'false' : 'true');
    }
    sync();

    // power button: screen off / on (replays the boot-up when switched on)
    power.addEventListener('click', function () {
      var off = root.classList.toggle('off');
      try { localStorage.setItem(KEY, off ? '1' : '0'); } catch (e) {}
      if (!off) {
        page.style.animation = 'none';
        void page.offsetWidth;
        page.style.animation = '';
      }
      sync();
    });

    // nav keys: show the press for a moment before the next page loads
    var keys = document.querySelectorAll('#panel a');
    for (var i = 0; i < keys.length; i++) {
      keys[i].addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var link = this;
        link.classList.add('pressed');
        setTimeout(function () { window.location.href = link.href; }, 100);
      });
    }
  });
})();
