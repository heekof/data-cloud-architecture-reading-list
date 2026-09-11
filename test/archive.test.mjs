import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../src/archive-articles.mjs', import.meta.url));
function run(cwd, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd });
    let output = '';
    child.stdout.on('data', data => output += data);
    child.stderr.on('data', data => output += data);
    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}

test('failures are logged; manual PDFs are skipped and tasks resolve without losing history', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    res.writeHead(req.url === '/blocked.pdf' ? 403 : 404);
    res.end('Unavailable');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [
      { id: 'blocked', title: 'Blocked article', category: 'test', url: `${base}/blocked.pdf` },
      { id: 'missing', title: 'Missing article', category: 'test', url: `${base}/missing.pdf` },
    ] }));
    assert.equal((await run(root)).code, 1);
    const log = await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8');
    assert.deepEqual(log.trim().split('\n').map(line => JSON.parse(line).httpStatus), [403, 404]);
    let tasks = await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8');
    assert.equal((tasks.match(/- \[ \]/g) || []).length, 2);
    assert.match(tasks, /articles\/missing\/source\.pdf/);
    assert.match(tasks, /find the article/);
    assert.equal((await run(root, ['--refresh-manual-tasks'])).code, 0);
    assert.equal(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), log);
    // A tiny PDF fixture exercises removal of the old 10 KB skip threshold.
    const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
    for (const id of ['blocked', 'missing']) await fs.writeFile(path.join(root, `articles/${id}/source.pdf`), pdf);
    assert.equal((await run(root)).code, 0);
    assert.equal(requests, 2, 'manual files must prevent new requests');
    const report = JSON.parse(await fs.readFile(path.join(root, 'archive-report.json'), 'utf8'));
    assert.ok(report.every(item => item.status === 'skipped'));
    assert.equal(await fs.readFile(path.join(root, 'articles/blocked/source.pdf'), 'utf8'), pdf);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /No manual downloads pending/);
    assert.equal(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), log);
    await fs.writeFile(path.join(root, 'articles/blocked/source.pdf'), '<html>Error</html>');
    assert.equal((await run(root)).code, 1);
    assert.equal(requests, 2);
    assert.equal(await fs.readFile(path.join(root, 'articles/blocked/source.pdf'), 'utf8'), '<html>Error</html>');
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /Existing file failed/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('configuration failures create a persistent log and a manual task', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  try {
    assert.equal((await run(root)).code, 1);
    assert.match(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), /"scope":"run"/);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /Archive run could not finish/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('incomplete downloads fail and can be retried with a complete small PDF', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  let body = '%PDF-1.4\n' + 'x'.repeat(11000);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [
      { id: 'download', title: 'Download', category: 'test', url: `http://127.0.0.1:${server.address().port}/article.pdf` },
    ] }));
    assert.equal((await run(root)).code, 1);
    const report = JSON.parse(await fs.readFile(path.join(root, 'archive-report.json'), 'utf8'));
    assert.equal(report[0].status, 'failed');
    assert.match(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), /completeness check/);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /- \[ \] \*\*Download/);
    await assert.rejects(fs.access(path.join(root, 'articles/download/source.pdf')), { code: 'ENOENT' });
    body = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
    assert.equal((await run(root)).code, 0);
    assert.equal(await fs.readFile(path.join(root, 'articles/download/source.pdf'), 'utf8'), body);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /No manual downloads pending/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('invalid entries and colliding paths fail before archiving with actionable errors', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  const article = { id: 'same-id', title: 'Example', category: 'test', url: 'http://127.0.0.1:1/example.pdf' };
  const cases = [
    { articles: [null, article], message: /Article 1 must be an object/ },
    { articles: [article, { ...article, id: 'Same ID' }], message: /same PDF path/ },
    { articles: [article, { ...article }], message: /same PDF path/ },
    { articles: [article, { ...article, category: 'another' }], message: /same PDF path/ },
    { articles: [{ ...article, category: '..' }], message: /invalid id or category/ },
  ];
  try {
    for (const fixture of cases) {
      await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: fixture.articles }));
      const result = await run(root);
      assert.equal(result.code, 1);
      assert.match(result.output, fixture.message);
      assert.doesNotMatch(result.output, /Cannot read properties/);
      const log = (await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8')).trim().split('\n').map(JSON.parse);
      assert.match(log.at(-1).error, fixture.message);
      assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), fixture.message);
      await assert.rejects(fs.access(path.join(root, 'articles')), { code: 'ENOENT' });
    }
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('extensionless and redirected PDF downloads are archived directly', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { location: '/download?id=123' }); res.end(); return; }
    res.writeHead(200, { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="article.pdf"' });
    res.end(pdf);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles:
      ['/download?id=123', '/redirect'].map((url, i) => ({ id: `pdf-${i}`, title: 'PDF', category: 'test', url: base + url }))
    }));
    const result = await run(root);
    assert.equal(result.code, 0, result.output);
    const report = JSON.parse(await fs.readFile(path.join(root, 'archive-report.json'), 'utf8'));
    assert.ok(report.every(item => item.status === 'success' && item.captureMethod === 'direct-download'));
    for (const item of report) assert.equal(await fs.readFile(path.join(root, item.output), 'utf8'), pdf);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('download deadline covers stalled headers and a continuously streaming body', async () => {
  const { fetchPdfBuffer } = await import('../src/archive-support.mjs');
  const server = http.createServer((req, res) => {
    if (req.url === '/headers.pdf') return;
    if (req.url === '/page') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>Article</h1>'); return; }
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.write('%PDF-1.4\n');
    const timer = setInterval(() => res.write('still sending\n'), 20);
    res.on('close', () => clearInterval(timer));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const url of ['/headers.pdf', '/stream.pdf']) {
      await assert.rejects(fetchPdfBuffer(base + url, { required: true, timeoutMs: 150 }), /Download timed out after 150 ms/);
    }
    assert.equal(await fetchPdfBuffer(base + '/page'), null, 'HTML must still go to the browser');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});


test('entries without URLs retain metadata and do not block other articles or local captures', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-test-'));
  const pdf = '%PDF-1.4\n%%EOF\n';
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end(pdf);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/article.pdf`;
    await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [
      { id: 'book', title: 'Book', category: 'test', url: null, rating: null },
      { id: 'online', title: 'Online', category: 'test', url },
    ] }));
    assert.equal((await run(root)).code, 1);
    const report = JSON.parse(await fs.readFile(path.join(root, 'archive-report.json'), 'utf8'));
    assert.deepEqual(report.map(item => item.status), ['failed', 'success']);
    assert.match(report[0].error, /Source URL is missing/);
    assert.match(await fs.readFile(path.join(root, 'articles/book/metadata.yaml'), 'utf8'), /url: null/);
    assert.equal((await run(root, ['--refresh-manual-tasks'])).code, 0);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /URL missing/);
    await fs.writeFile(path.join(root, 'articles/book/source.pdf'), pdf);
    assert.equal((await run(root)).code, 0, 'a local PDF works without a URL');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
