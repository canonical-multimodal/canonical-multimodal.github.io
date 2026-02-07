// Head-only config (runs before async libraries).
// - MathJax: must be defined before MathJax script loads.
// - Google Analytics gtag: keeps index.html free of inline JS.

window.MathJax = {
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
};

// Google Analytics (note: gtag.js src is currently empty in index.html)
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-75863369-6');

