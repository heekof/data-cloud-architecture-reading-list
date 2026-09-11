import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import { articlePdfPath, readConfiguration, syncMetadata, countWords } from '../src/article-library.mjs';

test('metadata mirrors all index fields and preserves sources and real extractions on refresh', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'metadata-test-'));
  const article = {
    id: 'parallel-change', title: 'Parallel Change', url: 'https://example.com/article',
    category: 'distributed-systems', rating: 9.5, personal_description: null,
    note: 'Une note\nsur deux lignes', ai_summary: 'Résumé', source: 'manual',
    future_field: { tags: ['evolution', 'architecture'] },
  };
  try {
    const raw = YAML.stringify({ articles: [article] });
    await fs.writeFile(path.join(root, 'articles.yaml'), raw);
    const articles = await readConfiguration(root);
    await syncMetadata(root, articles);
    const directory = path.join(root, 'articles', article.id);
    const metadataPath = path.join(directory, 'metadata.yaml');
    assert.deepEqual(YAML.parse(await fs.readFile(metadataPath, 'utf8')), { ...article, word_count: null, quality: { status: 'needs_review', issues: ['missing_source', 'missing_markdown'] }, quality_review: { status: 'pending', notes: null } });
    assert.deepEqual(await fs.readdir(directory), ['metadata.yaml'], 'no placeholder sources or Markdown');
    const contents = { 'source.pdf': '%PDF-1.4\n%%EOF\n', 'source.html': '<h1>Original</h1>', 'article.md': '# Real extraction\n' };
    for (const [name, content] of Object.entries(contents)) await fs.writeFile(path.join(directory, name), content);
    await syncMetadata(root, articles);
    assert.equal(YAML.parse(await fs.readFile(metadataPath, 'utf8')).word_count, 2);
    const before = await fs.stat(metadataPath);
    await syncMetadata(root, articles);
    assert.equal((await fs.stat(metadataPath)).mtimeMs, before.mtimeMs, 'unchanged metadata is not rewritten');
    assert.equal(await fs.readFile(path.join(root, 'articles.yaml'), 'utf8'), raw);
    const updated = { ...article, category: 'foundations', rating: null, url: null };
    delete updated.note;
    await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles: [updated] }));
    await syncMetadata(root, await readConfiguration(root));
    assert.deepEqual(YAML.parse(await fs.readFile(metadataPath, 'utf8')), { ...updated, word_count: 2, quality: { status: 'not_reviewed', issues: [] }, quality_review: { status: 'pending', notes: null } });
    assert.equal(articlePdfPath(updated), articlePdfPath(article), 'category changes preserve the source path');
    for (const [name, content] of Object.entries(contents)) assert.equal(await fs.readFile(path.join(directory, name), 'utf8'), content);
    await fs.writeFile(path.join(directory, 'article.md'), '');
    await syncMetadata(root, [updated]);
    assert.equal(YAML.parse(await fs.readFile(metadataPath, 'utf8')).word_count, 0);
    await fs.unlink(path.join(directory, 'article.md'));
    await syncMetadata(root, [updated]);
    assert.equal(YAML.parse(await fs.readFile(metadataPath, 'utf8')).word_count, null);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});


test('word counts include Unicode text and numbers but exclude standalone Markdown punctuation', () => {
  assert.equal(countWords("# L’architecture cloud-native\n\nÉté 2026 — café\n***"), 5);
  assert.equal(countWords(''), 0);
  assert.equal(countWords('  \n---\n# * '), 0);
  assert.equal(countWords('cafe\u0301 déjà'), 2);
});


test('quality decisions survive synchronization and approval never masks a missing extraction', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-test-'));
  const article = { id: 'example', title: 'Example', category: 'test', url: null };
  const directory = path.join(root, 'articles/example');
  const metadataPath = path.join(directory, 'metadata.yaml');
  try {
    await syncMetadata(root, [article]);
    let metadata = YAML.parse(await fs.readFile(metadataPath, 'utf8'));
    metadata.quality_review = { status: 'rejected', notes: 'Source ends mid-sentence.' };
    await fs.writeFile(metadataPath, YAML.stringify(metadata));
    await fs.writeFile(path.join(directory, 'source.pdf'), '%PDF-1.4\n%%EOF');
    await fs.writeFile(path.join(directory, 'article.md'), 'Opening text');
    await syncMetadata(root, [article]);
    metadata = YAML.parse(await fs.readFile(metadataPath, 'utf8'));
    assert.deepEqual(metadata.quality, { status: 'needs_review', issues: ['review_rejected'] });
    assert.equal(metadata.quality_review.notes, 'Source ends mid-sentence.');
    assert.match(await fs.readFile(path.join(root, 'article-quality.md'), 'utf8'), /Source ends mid-sentence/);
    metadata.quality_review = { status: 'approved', notes: 'Compared with complete source.' };
    await fs.writeFile(metadataPath, YAML.stringify(metadata));
    await syncMetadata(root, [article]);
    assert.equal(YAML.parse(await fs.readFile(metadataPath, 'utf8')).quality.status, 'ok');
    await fs.unlink(path.join(directory, 'article.md'));
    await syncMetadata(root, [article]);
    metadata = YAML.parse(await fs.readFile(metadataPath, 'utf8'));
    assert.equal(metadata.quality.status, 'needs_review');
    assert.deepEqual(metadata.quality.issues, ['missing_markdown']);
    assert.equal(metadata.quality_review.status, 'approved');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
