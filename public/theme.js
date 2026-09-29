// Apply the saved choice before paint. All interactive theme logic lives in src/app/theme.ts.
(function () {
  var theme = 'light';
  try {
    if (localStorage.getItem('blog-theme') === 'dark') theme = 'dark';
  } catch (_) { /* The page still works when browser storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#080b0c' : '#f7f8f3');
})();
