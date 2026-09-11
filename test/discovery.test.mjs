import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { discoveryPrompt, discoveryInbox, createDiscoveryWriter, canonicalUrl } from '../src/discovery.mjs';
import { createSearchServer } from '../src/search-server.mjs';

const proposed = overrides => ({ title: 'A new technical article', url: 'https://example.org/new', category: 'Data Engineering', reason: 'Concrete examples', contribution: 'A new operational perspective', caveats: 'No independent replication', access: 'full_text', evidence: 'A short observed passage.', ...overrides });
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'discovery-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'articles.yaml'), '# Keep this comment\n' + YAML.stringify({ articles: [{ id: 'known', title: 'Known article', url: 'https://example.org/known', category: 'data', rating: 9, personal_description: 'Private reflection not to share' }] }));
  await fs.mkdir(path.join(root, 'articles/known'), { recursive: true });
  await fs.writeFile(path.join(root, 'articles/known/article.md'), 'Original corpus content.');
  await fs.writeFile(path.join(root, 'articles/known/source.pdf'), 'Original bytes.');
  return root;
}
const response = articles => JSON.stringify({ version: 1, topic: 'Data systems', articles });

test('prompt contains a strict JSON contract and known readings without article text or personal reflections', async t => {
  const root = await fixture(t);
  const result = await discoveryPrompt(root, { topic: 'Data systems', criteria: 'Practical tradeoffs' });
  assert.match(result.prompt, /"version": 1/);
  assert.match(result.prompt, /"access": "full_text"/);
  assert.match(result.prompt, /https:\/\/example.org\/known/);
  assert.match(result.prompt, /Practical tradeoffs/);
  assert.doesNotMatch(result.prompt, /Private reflection|Original corpus content/);
  assert.equal(result.known, 1);
  await assert.rejects(discoveryPrompt(root, { topic: '', criteria: '' }), error => error.status === 400);
});

test('imports are validated, deduplicated and idempotent without changing library files', async t => {
  const root = await fixture(t), write = createDiscoveryWriter(root);
  const initialIndex = await fs.readFile(path.join(root, 'articles.yaml'), 'utf8');
  const initial = await discoveryInbox(root);
  await assert.rejects(write('import', { revision: initial.revision, response: 'bad JSON' }), error => error.status === 400);
  for (const invalid of [proposed({ url: 'javascript:alert(1)' }), proposed({ access: 'imagined' }), proposed({ evidence: null }), proposed({ unknown: 'x' })]) {
    await assert.rejects(write('import', { revision: initial.revision, response: response([proposed(), invalid]) }), error => error.status === 400);
    assert.equal((await discoveryInbox(root)).candidates.length, 0);
  }
  const result = await write('import', { revision: initial.revision, response: '```json\n' + response([proposed(), proposed({ url: 'https://example.org/new/?utm_source=mail#intro' }), proposed({ url: 'https://example.org/known' })]) + '\n```' });
  assert.equal(result.added, 1); assert.equal(result.duplicates, 2);
  assert.equal(await fs.readFile(path.join(root, 'articles.yaml'), 'utf8'), initialIndex);
  const repeated = await write('import', { revision: result.revision, response: response([proposed()]) });
  assert.equal(repeated.added, 0); assert.equal(repeated.candidates.length, 1);
  const dismissed = await write('decision', { revision: repeated.revision, id: repeated.candidates[0].id, status: 'dismissed' });
  assert.equal(dismissed.candidates[0].status, 'dismissed');
  const again = await write('import', { revision: dismissed.revision, response: response([proposed()]) });
  assert.equal(again.candidates[0].status, 'dismissed');
  await assert.rejects(write('decision', { revision: initial.revision, id: again.candidates[0].id, status: 'pending' }), error => error.status === 409);
  assert.equal(canonicalUrl('http://EXAMPLE.org/a/?utm_medium=x#b'), canonicalUrl('https://example.org/a'));
});

test('acceptance appends one article, keeps source bytes, creates missing-content metadata and survives retries', async t => {
  const root = await fixture(t), write = createDiscoveryWriter(root);
  const initial = await discoveryInbox(root);
  const imported = await write('import', { revision: initial.revision, response: response([proposed()]) });
  const candidate = imported.candidates[0];
  const accepted = await write('accept', { revision: imported.revision, id: candidate.id });
  assert.deepEqual(accepted.warnings, []);
  const raw = await fs.readFile(path.join(root, 'articles.yaml'), 'utf8');
  assert.match(raw, /Keep this comment/);
  const articles = YAML.parse(raw).articles;
  assert.equal(articles.length, 2);
  assert.equal(articles[0].personal_description, 'Private reflection not to share');
  assert.equal(articles[1].rating, null);
  assert.equal(articles[1].category, 'data-engineering');
  const directory = path.join(root, 'articles', accepted.article_id);
  const metadata = YAML.parse(await fs.readFile(path.join(directory, 'metadata.yaml'), 'utf8'));
  assert.ok(metadata.quality.issues.includes('missing_source'));
  assert.ok(metadata.quality.issues.includes('missing_markdown'));
  assert.deepEqual(await fs.readdir(directory), ['metadata.yaml']);
  assert.equal(await fs.readFile(path.join(root, 'articles/known/source.pdf'), 'utf8'), 'Original bytes.');
  assert.equal(await fs.readFile(path.join(root, 'articles/known/article.md'), 'utf8'), 'Original corpus content.');
  const retry = await write('accept', { revision: accepted.revision, id: candidate.id });
  assert.equal(retry.already_present, true);
  assert.equal(YAML.parse(await fs.readFile(path.join(root, 'articles.yaml'), 'utf8')).articles.length, 2);
});

test('discovery HTTP endpoints enforce same-origin actions and return helpful format errors', async t => {
  const root = await fixture(t), server = createSearchServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const current = await (await fetch(base + '/api/discovery')).json();
  const headers = { origin: base, 'content-type': 'application/json', 'x-library-action': '1' };
  const body = { revision: current.revision, response: response([proposed()]) };
  assert.equal((await fetch(base + '/api/discovery/import', { method: 'POST', headers: { ...headers, origin: 'https://other.example' }, body: JSON.stringify(body) })).status, 403);
  const good = await fetch(base + '/api/discovery/import', { method: 'POST', headers, body: JSON.stringify(body) });
  assert.equal(good.status, 200);
  const imported = await good.json();
  const bad = await fetch(base + '/api/discovery/import', { method: 'POST', headers, body: JSON.stringify({ revision: imported.revision, response: '{' }) });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /JSON invalide/);
});
