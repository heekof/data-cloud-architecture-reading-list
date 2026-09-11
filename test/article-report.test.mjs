import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import { syncMetadata } from '../src/article-library.mjs';
import { writeArticleReport, renderCsv, renderMarkdown } from '../src/article-report.mjs';

test('overview lists every ID, respects missing vs zero, refreshes counts, and preserves sources and reviews', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'article-report-test-'));
  const articles = [
    { id: 'missing', title: 'Governance', category: 'governance', rating: null, url: null },
    { id: 'empty', title: 'Empty', category: 'test', rating: 0, url: null },
    { id: 'text', title: 'Idempotency | "Retries"', category: 'distributed-systems', rating: 9.5, url: 'https://example.com/a' },
  ];
  try {
    await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles }));
    const index = await fs.readFile(path.join(root, 'articles.yaml'), 'utf8');
    await syncMetadata(root, articles);
    for (const [id, text] of [['empty', ''], ['text', 'Idempotency retries idempotency retries. The and with.']]) {
      await fs.writeFile(path.join(root, 'articles', id, 'article.md'), text);
    }
    const pdf = '%PDF-1.4\n%%EOF';
    await fs.writeFile(path.join(root, 'articles/text/source.pdf'), pdf);
    const metadataPath = path.join(root, 'articles/text/metadata.yaml');
    const metadata = YAML.parse(await fs.readFile(metadataPath, 'utf8'));
    metadata.quality_review = { status: 'rejected', notes: 'Incomplete capture' };
    await fs.writeFile(metadataPath, YAML.stringify(metadata));
    await syncMetadata(root, articles);
    const rows = await writeArticleReport(root, articles);
    assert.deepEqual(rows.map(row => row.id), ['empty', 'text', 'missing']);
    assert.equal(rows[0].word_count, 0);
    assert.equal(rows[0].rating, 0);
    assert.equal(rows[1].word_count, 7);
    assert.equal(rows[2].word_count, null);
    assert.equal(rows[2].keyword_source, 'metadata only');
    assert.ok(rows[1].keywords.includes('idempotency'));
    assert.ok(!rows[1].keywords.includes('the'));
    assert.equal(rows[1].quality_status, 'needs_review');
    assert.match(renderMarkdown(rows), /Idempotency \\\| "Retries"/);
    assert.match(renderCsv(rows), /"Idempotency \| ""Retries"""/);
    const before = await fs.stat(path.join(root, 'articles-overview.md'));
    await writeArticleReport(root, articles);
    assert.equal((await fs.stat(path.join(root, 'articles-overview.md'))).mtimeMs, before.mtimeMs);
    assert.equal(await fs.readFile(path.join(root, 'articles/text/source.pdf'), 'utf8'), pdf);
    assert.equal(await fs.readFile(path.join(root, 'articles.yaml'), 'utf8'), index);
    assert.equal(YAML.parse(await fs.readFile(metadataPath, 'utf8')).quality_review.notes, 'Incomplete capture');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
