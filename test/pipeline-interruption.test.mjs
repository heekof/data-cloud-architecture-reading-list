import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../src/update-library.mjs', import.meta.url));

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} preserves the current log and does not start later steps`, { timeout: 15000 }, async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-signal-test-'));
    let receivedRequest;
    const requested = new Promise(resolve => { receivedRequest = resolve; });
    const server = http.createServer(() => receivedRequest());
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let child;
    let timer;
    try {
      await fs.writeFile(path.join(root, 'articles.yaml'), JSON.stringify({ articles: [
        { id: 'waiting', title: 'Synthetic waiting request', category: 'test', url: `http://127.0.0.1:${server.address().port}/waiting.pdf` },
      ] }));
      await fs.writeFile(path.join(root, 'pipeline.log'), 'PREVIOUS RUN\n');
      child = spawn(process.execPath, [script], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', data => output += data);
      child.stderr.on('data', data => output += data);
      const finished = new Promise(resolve => child.on('close', (code, stoppedBy) => resolve({ code, stoppedBy })));
      await Promise.race([requested, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Request did not start')), 8000); })]);
      clearTimeout(timer);
      const currentLog = await fs.readFile(path.join(root, 'pipeline.log'), 'utf8');
      assert.match(currentLog, /Archive missing PDFs/, 'log is already on disk while the request is in progress');
      assert.doesNotMatch(currentLog, /PREVIOUS RUN/);
      child.kill(signal);
      const result = await finished;
      assert.equal(result.code, signal === 'SIGINT' ? 130 : 143);
      assert.equal(result.stoppedBy, null);
      const log = await fs.readFile(path.join(root, 'pipeline.log'), 'utf8');
      assert.match(log, new RegExp(`Interrupted by ${signal}`));
      assert.match(log, /Remaining steps were not started/);
      assert.doesNotMatch(output, /\nExtract missing Markdown/);
      await assert.rejects(fs.access(path.join(root, 'articles-overview.md')), { code: 'ENOENT' });
    } finally {
      clearTimeout(timer);
      if (child?.exitCode === null) child.kill('SIGKILL');
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      await fs.rm(root, { recursive: true, force: true });
    }
  });
}
