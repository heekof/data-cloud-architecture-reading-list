import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { gymOverview, saveGym, gymSession, gymPack } from '../src/architect-gym.mjs';

test('Gym gates coaching, versions decisions and retains initial answer and evidence snapshots', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gym-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const articles = ['design-unity-catalog-architecture', 'governing-data-products-using-fitness-functions'].map(id => ({ id, title: id, category: 'data' }));
  await fs.writeFile(path.join(root, 'articles.yaml'), YAML.stringify({ articles }));
  for (const article of articles) {
    const directory = path.join(root, 'articles', article.id);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'source.pdf'), 'Fixture source.');
    const lines = Array.from({ length: 600 }, (_, i) => `Line ${i + 1}: domain governance and group ownership.`);
    lines[337] = 'In a centralized model, assign a group.';
    lines[53] = 'The key idea behind data mesh is decentralization.';
    lines[567] = 'Data curators: Manage all data assets.';
    await fs.writeFile(path.join(directory, 'article.md'), lines.join('\n'));
  }
  const overview = await gymOverview(root);
  assert.equal(overview.critique, undefined);
  assert.equal(overview.milestone.completed, 0);
  assert.equal(overview.milestone.validated, 0);
  await assert.rejects(saveGym(root, { action: 'answer', initial_answer: '' }), e => e.status === 400);
  const first = await saveGym(root, { action: 'answer', initial_answer: 'I delegate ownership to a stable domain group with named accountability.' });
  assert.equal(first.evidence.length, 3);
  const revision = { action: 'revise', id: first.id, revision: 1, critique_notes: 'Test empty groups, stale membership and privilege escalation.', revised_decision: 'Use domain groups with audited creation defaults and an exception process.', reconsider_when: 'Reconsider when orphan detection fails or accountability becomes unclear.' };
  const second = await saveGym(root, revision);
  assert.equal(second.revision, 2);
  assert.equal(second.initial_answer, first.initial_answer);
  assert.deepEqual(second.evidence, first.evidence);
  await assert.rejects(saveGym(root, revision), e => e.status === 409);
  assert.equal((await gymSession(root, first.id)).stage, 'complete');
  const note = await fs.readFile(path.join(root, 'gym/sessions', first.id, '0002/decision.md'), 'utf8');
  assert.match(note, /Reconsider when/); assert.match(note, /SHA-256/);
  assert.equal((await gymOverview(root)).milestone.completed, 1);
  assert.equal((await gymOverview(root)).milestone.validated, 0);
  assert.ok((await gymPack(root)).bytes.length > 100);
  await fs.writeFile(path.join(root, 'articles', articles[0].id, 'metadata.yaml'), YAML.stringify({ quality_review: { status: 'rejected', notes: 'Bad source' } }));
  await assert.rejects(gymPack(root), e => e.status === 409);
  await assert.rejects(saveGym(root, { action: 'answer', initial_answer: first.initial_answer }), e => e.status === 409);
  await assert.rejects(gymSession(root, '../../escape'), e => e.status === 400);
});
