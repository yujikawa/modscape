import fs from 'fs';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { fileURLToPath } from 'url';

const __hlCss = fs.readFileSync(
  new URL('../node_modules/highlight.js/styles/atom-one-light.css', import.meta.url),
  'utf8'
);

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
}));

export function mdToHtml(mdContent) {
  const body = marked.parse(mdContent).replace(/<input(\s[^>]*)?\sdisabled(="")?([\s>])/g, '<input$1$3');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${__hlCss}
*, *::before, *::after { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; color: #334155; line-height: 1.7; padding: 2rem; max-width: 900px; margin: 0 auto; }
h1 { font-size: 1.6rem; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 0; }
h2 { font-size: 1.05rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; margin-top: 2rem; }
h3 { font-size: 1rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; }
h4 { font-size: 0.875rem; font-weight: 600; color: #3730a3; background: #f5f3ff; border: 1px solid #ddd6fe; border-left: 3px solid #6366f1; border-radius: 0.375rem; padding: 0.35rem 0.75rem; margin-top: 1.5rem; margin-bottom: 0.25rem; }
p { color: #475569; margin: 0.5rem 0 1rem; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
ul, ol { padding-left: 1.5rem; color: #475569; }
li { margin: 0.3rem 0; }
ul:has(li > input[type="checkbox"]) { list-style: none; padding-left: 0.25rem; }
li input[type="checkbox"] { accent-color: #94a3b8; width: 0.9rem; height: 0.9rem; margin-right: 0.4rem; cursor: default; vertical-align: -0.1rem; pointer-events: none; }
li input[type="checkbox"]:checked { accent-color: #16a34a; }
blockquote { border-left: 3px solid #cbd5e1; margin: 1rem 0; padding: 0.5rem 1rem; background: #f1f5f9; color: #64748b; border-radius: 0 0.25rem 0.25rem 0; }
blockquote p { margin: 0; }
code { font-family: 'SF Mono','Fira Code','Cascadia Code', monospace; font-size: 0.85em; background: #f1f5f9; color: #0550ae; padding: 0.15rem 0.4rem; border-radius: 0.25rem; border: 1px solid #e2e8f0; }
pre { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 0.5rem; padding: 1rem 1.25rem; overflow-x: auto; margin: 1rem 0; position: relative; }
pre code { background: none; color: inherit; padding: 0; border: none; font-size: 0.85rem; line-height: 1.7; }
.copy-btn { position: absolute; top: 0.5rem; right: 0.5rem; background: #fff; border: 1px solid #d0d7de; border-radius: 0.3rem; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-family: inherit; cursor: pointer; color: #64748b; opacity: 0; transition: opacity 0.15s, color 0.15s; line-height: 1.6; }
pre:hover .copy-btn { opacity: 1; }
.copy-btn:hover { color: #1e293b; border-color: #94a3b8; }
.copy-btn.copied { color: #16a34a; border-color: #86efac; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
thead tr { background: #f1f5f9; }
th { text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; }
td { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; color: #475569; }
tbody tr:hover { background: #f8fafc; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
#toc-toggle { position: fixed; top: 0.75rem; right: 0.75rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.3rem 0.7rem; font-size: 0.78rem; font-family: inherit; cursor: pointer; color: #64748b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); z-index: 100; }
#toc-toggle:hover { color: #1e293b; border-color: #cbd5e1; }
#toc-panel { position: fixed; top: 2.75rem; right: 0.75rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 0.5rem; min-width: 220px; max-width: 300px; max-height: 70vh; overflow-y: auto; z-index: 99; box-shadow: 0 4px 16px rgba(0,0,0,0.1); display: none; }
#toc-panel.open { display: block; }
#toc-panel a { display: block; font-size: 0.78rem; color: #64748b; padding: 0.2rem 0.5rem; text-decoration: none; border-radius: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#toc-panel a.h2 { font-weight: 600; color: #1e293b; margin-top: 0.25rem; }
#toc-panel a.h3 { padding-left: 1.25rem; }
#toc-panel a:hover { background: #f1f5f9; color: #2563eb; }
</style>
</head><body>
${body}
<script>
(function() {
  document.querySelectorAll('pre').forEach(function(pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', function() {
      var code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.innerText : pre.innerText).then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      });
    });
    pre.appendChild(btn);
  });

  var headings = document.querySelectorAll('h2, h3');
  if (headings.length > 2) {
    var btn = document.createElement('button');
    btn.id = 'toc-toggle';
    btn.textContent = '≡ 目次';
    var panel = document.createElement('nav');
    panel.id = 'toc-panel';
    var idx = 0;
    headings.forEach(function(h) {
      var id = 'h-' + (++idx);
      h.id = id;
      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.className = h.tagName.toLowerCase();
      a.addEventListener('click', function() { panel.classList.remove('open'); });
      panel.appendChild(a);
    });
    btn.addEventListener('click', function() { panel.classList.toggle('open'); });
    document.addEventListener('click', function(e) {
      if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
    });
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
})();
</script>
</body></html>`;
}
