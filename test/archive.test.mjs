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
    assert.match(tasks, /pdfs\/test\/missing.pdf/);
    assert.match(tasks, /find the article/);
    assert.equal((await run(root, ['--refresh-manual-tasks'])).code, 0);
    assert.equal(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), log);
    // A tiny PDF fixture exercises removal of the old 10 KB skip threshold.
    const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
    for (const id of ['blocked', 'missing']) await fs.writeFile(path.join(root, `pdfs/test/${id}.pdf`), pdf);
    assert.equal((await run(root)).code, 0);
    assert.equal(requests, 2, 'manual files must prevent new requests');
    const report = JSON.parse(await fs.readFile(path.join(root, 'archive-report.json'), 'utf8'));
    assert.ok(report.every(item => item.status === 'skipped'));
    assert.equal(await fs.readFile(path.join(root, 'pdfs/test/blocked.pdf'), 'utf8'), pdf);
    assert.match(await fs.readFile(path.join(root, 'manual-tasks-todo-for-me.md'), 'utf8'), /No manual downloads pending/);
    assert.equal(await fs.readFile(path.join(root, 'archive-issues.log'), 'utf8'), log);
    await fs.writeFile(path.join(root, 'pdfs/test/blocked.pdf'), '<html>Error</html>');
    assert.equal((await run(root)).code, 1);
    assert.equal(requests, 2);
    assert.equal(await fs.readFile(path.join(root, 'pdfs/test/blocked.pdf'), 'utf8'), '<html>Error</html>');
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
