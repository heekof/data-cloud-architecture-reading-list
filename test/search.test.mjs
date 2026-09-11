import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import YAML from 'yaml';
import { indexCorpus, searchCorpus, chunkMarkdown } from '../src/search-index.mjs';
import { createSearchServer } from '../src/search-server.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'corpus-search-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const articles = [
    { id: 'alpha', title: 'Reliable systems', category: 'engineering', rating: 9, url: 'https://example.com/alpha' },
    { id: 'beta', title: 'Rejected study', category: 'engineering', rating: 10, url: null },
    { id: 'gamma', title: 'Data guide', category: 'data', rating: 7, url: null },
    { id: 'missing', title: 'Unavailable', category: 'data', url: null },
  ];
  await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles }));
  for (const article of articles.slice(0, 3)) {
    const directory = path.join(root, 'articles', article.id);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'metadata.yaml'), YAML.stringify({
      quality: { status: article.id === 'beta' ? 'needs_review' : 'not_reviewed' },
      quality_review: { status: article.id === 'beta' ? 'rejected' : 'pending', notes: null },
    }));
  }
  await fs.writeFile(path.join(root, 'articles/alpha/article.md'), '# Reliability\n\nIdempotency and data contracts.\n\n## Retries\n\nIdempotency protects retries.\n');
  await fs.writeFile(path.join(root, 'articles/beta/article.md'), '# Rejected\n\nIdempotency is discussed here.');
  await fs.writeFile(path.join(root, 'articles/gamma/article.md'), '# Data\n\nCafé governance and contracts for data. <script>alert(1)</script>');
  await indexCorpus(root);
  return root;
}

test('search groups passages, matches phrases and accents, filters metadata and hides rejected sources', async t => {
  const root = await fixture(t);
  const result = await searchCorpus(root, { query: 'idempotency' });
  assert.equal(result.total, 1);
  assert.equal(result.results[0].id, 'alpha');
  assert.equal(result.results[0].matches, 2);
  assert.match(result.results[0].excerpt, /\x01Idempotency\x02/);
  assert.equal((await searchCorpus(root, { query: 'idempotency', includeRejected: true })).total, 2);
  assert.equal((await searchCorpus(root, { query: '"data contracts"' })).total, 1);
  assert.equal((await searchCorpus(root, { query: 'cafe' })).results[0].id, 'gamma');
  assert.equal((await searchCorpus(root, { category: 'data' })).total, 1);
  assert.equal((await searchCorpus(root, { minRating: '8' })).results[0].id, 'alpha');
  assert.equal((await searchCorpus(root, { quality: 'needs_review', includeRejected: true })).results[0].id, 'beta');
  assert.equal((await searchCorpus(root, { query: "' OR 1=1; DROP TABLE articles; --" })).total, 0);
  assert.equal((await searchCorpus(root, { query: '***' })).total, 0);
  assert.equal((await searchCorpus(root)).total, 2);
  await assert.rejects(searchCorpus(root, { minRating: 'NaN' }), /note/);
  await assert.rejects(searchCorpus(root, { query: 'a'.repeat(301) }), /limitée/);
});

test('index updates changed text and metadata, removes unavailable articles, preserves source files', async t => {
  const root = await fixture(t);
  const source = path.join(root, 'articles/alpha/article.md');
  const original = await fs.readFile(source, 'utf8');
  const repeated = await indexCorpus(root);
  assert.equal(repeated.updated, 0); assert.equal(repeated.unchanged, 3);
  assert.equal(await fs.readFile(source, 'utf8'), original);
  await fs.writeFile(source, '# A revision\n\nUnique revised content.');
  assert.equal((await indexCorpus(root)).updated, 1);
  assert.equal((await searchCorpus(root, { query: 'idempotency' })).total, 0);
  assert.equal((await searchCorpus(root, { query: 'revised' })).total, 1);
  await fs.writeFile(path.join(root, 'articles/alpha/metadata.yaml'), YAML.stringify({ quality: { status: 'ok' }, quality_review: { status: 'approved' } }));
  assert.equal((await indexCorpus(root)).updated, 1);
  assert.equal((await searchCorpus(root, { quality: 'ok' })).total, 1);
  await fs.unlink(source);
  assert.equal((await indexCorpus(root)).removed, 1);
  assert.equal((await searchCorpus(root, { query: 'revised' })).total, 0);
  const config = path.join(root, 'articles.yaml');
  const data = YAML.parse(await fs.readFile(config, 'utf8'));
  data.articles = data.articles.filter(a => a.id !== 'gamma');
  await fs.writeFile(config, YAML.stringify(data));
  assert.equal((await indexCorpus(root)).removed, 1);
  assert.equal((await searchCorpus(root)).total, 0);
});

test('passage offsets select the original text without rewriting it', () => {
  const markdown = '# First\r\n\r\nSome words in this paragraph.\r\n\r\n## Next\r\n\r\nAnother paragraph.';
  const chunks = chunkMarkdown(markdown);
  assert.equal(chunks.length, 2);
  for (const chunk of chunks) assert.equal(markdown.replaceAll('\r\n', '\n').split('\n').slice(chunk.start_line - 1, chunk.end_line).join('\n').trim(), chunk.body);
  assert.equal(chunks[1].heading, 'Next');
});

test('local HTTP API serves the reader, validates inputs and restricts file access', async t => {
  const root = await fixture(t);
  const server = createSearchServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await home.text(), /Votre bibliothèque/);
  assert.equal((await (await fetch(base + '/api/search?q=idempotency')).json()).total, 1);
  assert.equal((await (await fetch(base + '/api/article?id=alpha')).json()).markdown.includes('Idempotency'), true);
  assert.equal((await fetch(base + '/api/search?rating=invalid')).status, 400);
  assert.equal((await fetch(base + '/api/article?id=../../articles.yaml')).status, 404);
  assert.equal((await fetch(base + '/articles.yaml')).status, 404);
  assert.equal((await fetch(base + '/source?id=alpha')).status, 404);
  const denied = await new Promise((resolve, reject) => {
    http.get(base, { headers: { host: 'untrusted.example' } }, response => {
      response.resume(); resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(denied, 403);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});


test('default passages stop around fifty words while retaining exact source lines', () => {
  const line = Array(10).fill('word').join(' ');
  const markdown = Array(20).fill(line).join('\n');
  const chunks = chunkMarkdown(markdown);
  assert.equal(chunks.length, 4);
  for (const chunk of chunks) assert.equal(chunk.body.split(/\s+/).length, 50);
  assert.deepEqual(chunks.map(c => [c.start_line, c.end_line]), [[1, 5], [6, 10], [11, 15], [16, 20]]);
});
