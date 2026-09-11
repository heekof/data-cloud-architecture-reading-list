import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { publishPdf, fetchPdfBuffer } from '../src/archive-support.mjs';
const execute = promisify(execFile);
const script = fileURLToPath(new URL('../src/archive-articles.mjs', import.meta.url));
const pdf = '%PDF-1.4\n% synthetic fixture\n%%EOF\n';
const manual = '%PDF-1.4\n% manually supplied fixture\n%%EOF\n';

async function closeServer(server) {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

test('atomic publication has exactly one winner and never replaces an existing file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'publication-test-'));
  try {
    const filename = path.join(root, 'source.pdf');
    const results = await Promise.allSettled([publishPdf(filename, Buffer.from(pdf)), publishPdf(filename, Buffer.from(manual))]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const winner = await fs.readFile(filename, 'utf8');
    assert.ok([pdf, manual].includes(winner));
    assert.match(results.find(result => result.status === 'rejected').reason.message, /preserved/);
    await assert.rejects(publishPdf(filename, Buffer.from(pdf)), /preserved/);
    assert.equal(await fs.readFile(filename, 'utf8'), winner);
    assert.deepEqual(await fs.readdir(root), ['source.pdf'], 'temporary captures are cleaned up');
    await assert.rejects(publishPdf(path.join(root, 'bad.pdf'), Buffer.from('%PDF-1.4\nincomplete')), /completeness/);
    await assert.rejects(fs.access(path.join(root, 'bad.pdf')), { code: 'ENOENT' });
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('PDF signatures are checked for generic MIME types and PDF attachments', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/missing-type') { res.end(pdf); return; }
    if (req.url === '/attachment') {
      res.writeHead(200, { 'content-type': 'text/plain', 'content-disposition': 'attachment; filename="example.pdf"' }); res.end(pdf); return;
    }
    if (req.url === '/extended-attachment') {
      res.writeHead(200, { 'content-type': 'text/plain', 'content-disposition': "attachment; filename*=UTF-8''example.pdf" }); res.end(pdf); return;
    }
    if (req.url === '/html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<h1>HTML</h1>'); return; }
    res.writeHead(200, { 'content-type': req.url === '/legacy' ? 'application/x-pdf' : 'application/octet-stream' });
    res.end(req.url === '/truncated' ? '%PDF-1.4\n' : req.url === '/not-pdf' ? 'plain data' : pdf);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/binary', '/attachment', '/extended-attachment', '/missing-type', '/legacy']) {
      assert.equal((await fetchPdfBuffer(base + route)).toString(), pdf, route);
    }
    assert.equal((await fetchPdfBuffer(base + '/file.pdf', { required: true })).toString(), pdf);
    assert.equal(await fetchPdfBuffer(base + '/not-pdf'), null);
    assert.equal(await fetchPdfBuffer(base + '/html'), null);
    await assert.rejects(fetchPdfBuffer(base + '/truncated'), /completeness/);
    await assert.rejects(fetchPdfBuffer(base + '/not-pdf', { required: true }), /completeness/);
  } finally { await closeServer(server); }
});

for (const browserCapture of [false, true]) {
  test(`${browserCapture ? 'browser capture' : 'direct download'} preserves a file supplied during the request`, async t => {
    if (browserCapture) {
      try { await fs.access(chromium.executablePath()); }
      catch { return t.skip('Install Chromium to test browser publication'); }
    }
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-race-test-'));
    let requests = 0;
    const filename = path.join(root, 'articles/example/source.pdf');
    const server = http.createServer(async (req, res) => {
      if (req.url !== '/source') { res.writeHead(404); res.end(); return; }
      requests++;
      if (!browserCapture || requests >= 2) await fs.writeFile(filename, manual);
      res.writeHead(200, { 'content-type': browserCapture ? 'text/html' : 'application/octet-stream' });
      res.end(browserCapture ? '<html><body><h1>Synthetic capture</h1><p>Short example.</p></body></html>' : pdf);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [
        { id: 'example', title: 'Synthetic example', category: 'test', url: `http://127.0.0.1:${server.address().port}/source` },
      ] }));
      await assert.rejects(execute(process.execPath, [script], { cwd: root, timeout: 20000 }), error => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /appeared during capture and was preserved/);
        return true;
      });
      assert.equal(await fs.readFile(filename, 'utf8'), manual);
      assert.deepEqual((await fs.readdir(path.dirname(filename))).sort(), ['metadata.yaml', 'source.pdf']);
    } finally { await closeServer(server); await fs.rm(root, { recursive: true, force: true }); }
  });
}
