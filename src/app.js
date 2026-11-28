/* Progressive enhancement only: the page is complete without this file. */
(function () {
  var ui = window.SLURP_UI || { copy: 'Copy', copied: 'Copied' };

  // Copy buttons for the install command and the code blocks.
  document.querySelectorAll('[data-copy], [data-copy-pre]').forEach(function (box) {
    if (!navigator.clipboard) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = ui.copy;
    btn.addEventListener('click', function () {
      var text = box.hasAttribute('data-copy-pre')
        ? box.querySelector('pre').textContent
        : box.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = ui.copied;
        setTimeout(function () { btn.textContent = ui.copy; }, 2000);
      });
    });
    box.appendChild(btn);
    box.classList.add('has-copy');
  });

  // The 508 KB visualizer loads only when asked for. Without JS the link opens it.
  var stage = document.getElementById('demo-stage');
  if (stage) {
    stage.addEventListener('click', function (e) {
      e.preventDefault();
      var frame = document.createElement('iframe');
      frame.src = stage.getAttribute('href');
      frame.title = 'slurp — player stats';
      var holder = document.createElement('div');
      holder.className = 'stage';
      holder.appendChild(frame);
      stage.replaceWith(holder);
      frame.focus();
    });
  }

  // GitHub stars, decorative.
  var stars = document.getElementById('gh-stars');
  if (stars && window.fetch) {
    fetch('https://api.github.com/repos/CarlosVallejoRuiz/slurp')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var n = d.stargazers_count;
        if (typeof n === 'number') stars.textContent = '★ ' + (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n);
      })
      .catch(function () {});
  }
})();
