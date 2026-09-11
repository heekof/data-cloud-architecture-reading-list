import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
const execute = promisify(execFile);
const script = fileURLToPath(new URL('../src/update-library.mjs', import.meta.url));

test('one command continues after download failures, extracts successes, updates reports, and can be rerun', async t => {
  try { await execute(process.env.PDFTOTEXT || 'pdftotext', ['-v']); }
  catch (error) { if (error.code === 'ENOENT') return t.skip('Install Poppler to test the complete workflow'); throw error; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'library-update-test-'));
  const pdf = await fs.readFile(new URL('../articles/parallel-change/source.pdf', import.meta.url));
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end(pdf);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles: [
      { id: 'missing', title: 'Missing URL', category: 'test', url: null },
      { id: 'downloaded', title: 'Downloaded PDF', category: 'test', url: `http://127.0.0.1:${server.address().port}/article.pdf` },
    ] }));
    await assert.rejects(execute(process.execPath, [script], { cwd: root }), error => {
      assert.equal(error.code, 1);
      assert.match(error.stdout, /INCOMPLETE: Archive missing PDFs/);
      assert.match(error.stdout, /OK: Extract missing Markdown/);
      assert.match(error.stdout, /OK: Refresh metadata and reports/);
      return true;
    });
    assert.match(await fs.readFile(path.join(root, 'pipeline.log'), 'utf8'), /Source URL is missing/);
    assert.equal(requests, 1);
    assert.deepEqual(await fs.readFile(path.join(root, 'articles/downloaded/source.pdf')), pdf);
    const markdownPath = path.join(root, 'articles/downloaded/article.md');
    const markdown = await fs.readFile(markdownPath, 'utf8');
    assert.ok(markdown.includes('Parallel Change'));
    const metadata = YAML.parse(await fs.readFile(path.join(root, 'articles/downloaded/metadata.yaml'), 'utf8'));
    assert.ok(metadata.word_count > 0);
    for (const filename of ['articles-overview.md', 'articles-overview.csv', 'article-quality.md', 'manual-tasks-todo-for-me.md']) {
      assert.match(await fs.readFile(path.join(root, filename), 'utf8'), /Missing URL/);
    }
    // Supplying the remaining local source makes the same command succeed.
    await fs.writeFile(path.join(root, 'articles/missing/source.pdf'), pdf);
    const result = await execute(process.execPath, [script], { cwd: root });
    assert.doesNotMatch(result.stdout, /INCOMPLETE:/);
    assert.equal(requests, 1, 'existing complete sources prevent further downloads');
    assert.equal(await fs.readFile(markdownPath, 'utf8'), markdown);
    assert.ok((await fs.readFile(path.join(root, 'articles/missing/article.md'), 'utf8')).length > 0);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('invalid configuration stops the combined command before generating files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'library-update-test-'));
  try {
    await fs.writeFile(path.join(root, 'articles.yaml'), 'articles: [null]\n');
    await assert.rejects(execute(process.execPath, [script], { cwd: root }), error => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Article 1 must be an object/);
      return true;
    });
    assert.deepEqual(await fs.readdir(root), ['articles.yaml']);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
