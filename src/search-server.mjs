import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfiguration, articlePdfPath } from './article-library.mjs';
import { indexCorpus, searchCorpus, corpusStats } from './search-index.mjs';

const assets = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
const webRoot = fileURLToPath(new URL('../web/search/', import.meta.url));
export function createSearchServer(root) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) return json(403, { error: 'Hôte non autorisé.' });
    if (req.method !== 'GET') return json(405, { error: 'Méthode non autorisée.' });
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (assets.has(url.pathname)) {
        const [file, type] = assets.get(url.pathname);
        const content = await fs.readFile(path.join(webRoot, file));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
        res.end(content); return;
      }
      if (url.pathname === '/api/stats') return json(200, await corpusStats(root));
      if (url.pathname === '/api/search') {
        try {
          return json(200, await searchCorpus(root, {
            query: url.searchParams.get('q') || '', category: url.searchParams.get('category') || '',
            minRating: url.searchParams.get('rating') || '', quality: url.searchParams.get('quality') || '',
            includeRejected: url.searchParams.get('rejected') === '1', page: url.searchParams.get('page') || '1',
          }));
        } catch (error) {
          if (/limitée|note doit/.test(error.message)) return json(400, { error: error.message });
          throw error;
        }
      }
      if (['/api/article', '/source'].includes(url.pathname)) {
        const article = (await readConfiguration(root)).find(a => a.id === url.searchParams.get('id'));
        if (!article) return json(404, { error: 'Article introuvable.' });
        const directory = path.dirname(path.join(root, articlePdfPath(article)));
        if (url.pathname === '/source') {
          const filename = path.join(directory, 'source.pdf');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="source.pdf"');
          res.end(await fs.readFile(filename)); return;
        }
        return json(200, { ...article, markdown: await fs.readFile(path.join(directory, 'article.md'), 'utf8') });
      }
      json(404, { error: 'Page introuvable.' });
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      if (error.code === 'ENOENT') return json(404, { error: 'Ce fichier n’est pas disponible.' });
      console.error(error.message);
      json(500, { error: 'La recherche a rencontré un problème. Consultez le terminal.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = process.cwd();
    const port = Number(process.env.PORT || 4317);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT.');
    const indexed = await indexCorpus(root);
    const server = createSearchServer(root);
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Local corpus search: http://127.0.0.1:${server.address().port} (${indexed.articles} articles)`));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
