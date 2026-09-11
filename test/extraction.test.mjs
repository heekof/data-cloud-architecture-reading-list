import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
const execute = promisify(execFile);
const script = fileURLToPath(new URL('../src/extract-articles.mjs', import.meta.url));
function pdfFixture(text) {
  const stream = text ? `BT /F1 12 Tf 20 100 Td (${text}) Tj ET` : '';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let result = '%PDF-1.4\n';
  const offsets = [0];
  for (const [i, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(result));
    result += `${i + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(result);
  result += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('')}`;
  return result + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

test('PDF extraction preserves sources, skips existing Markdown, and flags missing or non-text sources', async t => {
  try { await execute(process.env.PDFTOTEXT || 'pdftotext', ['-v']); }
  catch (error) { if (error.code === 'ENOENT') return t.skip('Install Poppler to test PDF extraction'); throw error; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'extraction-test-'));
  try {
    const articles = ['text', 'missing', 'blank'].map(id => ({ id, title: id, category: 'test', url: null }));
    await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles }));
    const pdf = pdfFixture('A real PDF extraction.');
    for (const [id, content] of [['text', pdf], ['blank', pdfFixture('')]]) {
      await fs.mkdir(path.join(root, 'articles', id), { recursive: true });
      await fs.writeFile(path.join(root, 'articles', id, 'source.pdf'), content);
    }
    await assert.rejects(execute(process.execPath, [script], { cwd: root }), error => {
      assert.match(error.stderr, /No extractable text/);
      return error.code === 1;
    });
    const markdown = await fs.readFile(path.join(root, 'articles/text/article.md'), 'utf8');
    assert.equal(markdown.trim(), 'A real PDF extraction.');
    assert.equal(await fs.readFile(path.join(root, 'articles/text/source.pdf'), 'utf8'), pdf);
    const metadata = YAML.parse(await fs.readFile(path.join(root, 'articles/text/metadata.yaml'), 'utf8'));
    assert.equal(metadata.word_count, 4);
    assert.equal(metadata.quality.status, 'not_reviewed');
    for (const id of ['missing', 'blank']) await assert.rejects(fs.access(path.join(root, 'articles', id, 'article.md')), { code: 'ENOENT' });
    await fs.writeFile(path.join(root, 'articles/text/article.md'), '# Human corrected extraction\n');
    await execute(process.execPath, [script, '--id=text'], { cwd: root });
    assert.equal(await fs.readFile(path.join(root, 'articles/text/article.md'), 'utf8'), '# Human corrected extraction\n');
    assert.equal(YAML.parse(await fs.readFile(path.join(root, 'articles/text/metadata.yaml'), 'utf8')).word_count, 3);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
