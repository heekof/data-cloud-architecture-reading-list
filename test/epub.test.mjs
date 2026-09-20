import { reviewQueue, createReviewWriter } from '../src/library-workbench.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { buildEpub, generateEpubs, epubEdition } from '../src/epub.mjs';
import { createSearchServer } from '../src/search-server.mjs';
const article = { id: 'sample', title: 'A & B', category: 'test', url: 'https://example.org/article?a=1&b=2' };
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'epub-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [article, { ...article, id: 'missing' }] }));
  const directory = path.join(root, 'articles/sample'); await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'article.md'), '# Heading\n\nOriginal **text**.\n');
  await fs.writeFile(path.join(directory, 'source.pdf'), 'Original PDF bytes');
  return { root, directory };
}

test('EPUB package has uncompressed first mimetype, XHTML, navigation and literal untrusted HTML', async t => {
  const { directory } = await fixture(t);
  const markdown = '# Heading\n\n- A list\n\n```js\nif (a < b) return;\n```\n\n<script>alert(1)</script>\n\n![Remote](https://example.org/x.png)';
  const built = await buildEpub(article, markdown, directory);
  const bytes = Buffer.from(built.bytes), files = unzipSync(built.bytes);
  assert.equal(bytes.readUInt16LE(8), 0);
  assert.equal(bytes.subarray(30, 38).toString(), 'mimetype');
  assert.equal(strFromU8(files.mimetype), 'application/epub+zip');
  assert.match(strFromU8(files['EPUB/content.opf']), /properties="nav"/);
  assert.match(strFromU8(files['EPUB/nav.xhtml']), /article.xhtml#section-1/);
  const html = strFromU8(files['EPUB/article.xhtml']);
  assert.match(html, /<ul>/); assert.match(html, /<pre><code/);
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Image non embarquée/); assert.equal(built.warnings.length, 1);
});

test('local images are embedded and images outside the article folder are excluded', async t => {
  const { root, directory } = await fixture(t);
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9l8AAAAASUVORK5CYII=', 'base64');
  await fs.writeFile(path.join(directory, 'image.png'), pixel);
  await fs.writeFile(path.join(root, 'outside.png'), pixel);
  const built = await buildEpub(article, '![Local](image.png)\n\n![Outside](../../outside.png)', directory);
  const files = unzipSync(built.bytes);
  assert.deepEqual(Buffer.from(files['EPUB/images/image-1.png']), pixel);
  assert.equal(built.warnings.length, 1);
  assert.match(strFromU8(files['EPUB/content.opf']), /image\/png/);
});

test('generation skips missing text, updates changed Markdown, preserves unchanged and manually edited EPUBs', async t => {
  const { root, directory } = await fixture(t);
  const options = { log: () => {} };
  const first = await generateEpubs(root, options);
  assert.equal(first.created, 1); assert.equal(first.missing, 1);
  const file = path.join(directory, 'article.epub');
  const before = await fs.readFile(file);
  assert.equal((await generateEpubs(root, options)).unchanged, 1);
  assert.deepEqual(await fs.readFile(file), before);
  await fs.writeFile(path.join(directory, 'article.md'), '# Corrected\n\nA corrected text.');
  assert.equal((await generateEpubs(root, options)).updated, 1);
  await fs.writeFile(file, 'Manually supplied EPUB');
  assert.equal((await generateEpubs(root, options)).failed, 1);
  assert.equal(await fs.readFile(file, 'utf8'), 'Manually supplied EPUB');
  assert.equal(await fs.readFile(path.join(directory, 'source.pdf'), 'utf8'), 'Original PDF bytes');
  assert.equal(await fs.readFile(path.join(directory, 'article.md'), 'utf8'), '# Corrected\n\nA corrected text.');
});

test('article reader advertises EPUB and download route serves only known article files', async t => {
  const { root } = await fixture(t);
  await generateEpubs(root, { log: () => {} });
  const server = createSearchServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(base + '/api/article?id=sample')).json()).epub, false);
  assert.equal((await fetch(base + '/epub?id=sample')).status, 409);
  const file = await fetch(base + '/epub?id=sample&preview=1');
  assert.equal(file.headers.get('content-type'), 'application/epub+zip');
  assert.match(file.headers.get('content-disposition'), /attachment/);
  assert.equal((await fetch(base + '/epub?id=missing')).status, 409);
  assert.equal((await fetch(base + '/epub?id=../../articles.yaml')).status, 404);
});


test('EPUB downloads require current reviewed bytes; previews warn, rejected and missing text block', async t => {
  const { root, directory } = await fixture(t);
  const save = createReviewWriter(root);
  let row = (await reviewQueue(root)).rows.find(r => r.id === 'sample');
  await save({ id: 'sample', version: row.version, status: 'approved', notes: 'Checked.' });
  await generateEpubs(root, { log: () => {} });
  assert.equal((await epubEdition(root, article)).verified, true);
  const original = await fs.readFile(path.join(directory, 'article.epub'));
  await fs.appendFile(path.join(directory, 'source.pdf'), 'changed');
  await assert.rejects(epubEdition(root, article, { download: true }), e => e.status === 409);
  const preview = await epubEdition(root, article, { preview: true, download: true });
  assert.match(strFromU8(unzipSync(preview.bytes)['EPUB/article.xhtml']), /Unverified preview/);
  await fs.writeFile(path.join(directory, 'article.md'), '');
  await generateEpubs(root, { log: () => {} });
  assert.deepEqual(await fs.readFile(path.join(directory, 'article.epub')), original);
  await assert.rejects(epubEdition(root, article, { preview: true, download: true }), e => e.status === 409);
  await fs.writeFile(path.join(directory, 'article.md'), 'Restored text.');
  row = (await reviewQueue(root)).rows.find(r => r.id === 'sample');
  await save({ id: 'sample', version: row.version, status: 'rejected', notes: 'Incomplete.' });
  await assert.rejects(epubEdition(root, article, { preview: true, download: true }), e => e.status === 409);
  assert.deepEqual(await fs.readFile(path.join(directory, 'article.epub')), original);
});
