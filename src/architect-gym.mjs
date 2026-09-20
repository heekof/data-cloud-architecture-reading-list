import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { readConfiguration, articlePdfPath, countWords } from './article-library.mjs';
import { inspectContent } from './content-quality.mjs';
import { buildEpub } from './epub.mjs';

const fail = (status, message) => Object.assign(new Error(message), { status });
const scenario = {
  id: 'durable-ownership', title: 'Ownership that survives a departure',
  question: 'An engineer leaves and platform objects remain individually owned. Design an ownership model that preserves accountability without making the platform team approve every creation. State your assumptions, compare alternatives, describe failure modes and operational responsibilities.',
  readings: [
    { id: 'design-unity-catalog-architecture', anchor: 'In a centralized model, assign', lines: 11 },
    { id: 'governing-data-products-using-fitness-functions', anchor: 'The key idea behind data mesh', lines: 18 },
    { id: 'design-unity-catalog-architecture', anchor: 'Data curators: Manage all data assets', lines: 18 },
  ],
  recall: ['Who is accountable, who can act, and who can grant access?', 'What happens when the last member leaves a domain group?', 'How would you detect and repair ownership drift?', 'Which observation would make you change your decision?'],
};
const candidates = ['design-unity-catalog-architecture', 'governing-data-products-using-fitness-functions', 'making-retries-safe-with-idempotent-apis', 'static-stability-using-availability-zones', 'parallel-change'];
const rubric = [
  { dimension: 'Assumptions', question: 'Does your proposal distinguish durable group ownership from named business accountability? Who maintains group membership?', evidence: 'S1' },
  { dimension: 'Alternatives', question: 'Compare domain delegation with individual ownership and central platform ownership. Which trade-offs justify your choice?', evidence: 'S2' },
  { dimension: 'Failure modes', question: 'Test an empty owner group, a departed engineer, failed provisioning and an over-privileged service identity. What detects each failure and who repairs it?', evidence: 'S3' },
  { dimension: 'Operations', question: 'Specify creation defaults, reconciliation, exception expiry, audit evidence and an escalation path. Which checks could become automated fitness functions?', evidence: 'S2' },
];
async function evidence(root) {
  const articles = await readConfiguration(root), result = [];
  for (const [index, reading] of scenario.readings.entries()) {
    const article = articles.find(a => a.id === reading.id);
    if (!article) throw fail(409, `Missing reading: ${reading.id}`);
    const current = await inspectContent(path.dirname(path.join(root, articlePdfPath(article))));
    if (!current.wordCount || current.review.status === 'rejected') throw fail(409, `Reading unavailable or rejected: ${article.title}`);
    const lines = current.markdown.replace(/\r\n?/g, '\n').split('\n');
    const offset = lines.findIndex(line => line.startsWith(reading.anchor));
    if (offset < 0) throw fail(409, `The curated excerpt changed: ${article.title}. Update the challenge before continuing.`);
    const start = offset + 1, end = Math.min(lines.length, offset + reading.lines);
    const text = lines.slice(offset, end).join('\n');
    if (!countWords(text)) throw fail(409, `Reading excerpt unavailable: ${article.title}`);
    result.push({ reference: `S${index + 1}`, id: reading.id, start, end, title: article.title, url: article.url || null, text, source_hash: current.source_hash, markdown_hash: current.markdown_hash, quality: current.quality.status });
  }
  return result;
}
export async function gymOverview(root) {
  const articles = await readConfiguration(root), readings = [];
  for (const id of candidates) {
    const article = articles.find(a => a.id === id);
    if (!article) continue;
    const current = await inspectContent(path.dirname(path.join(root, articlePdfPath(article))));
    readings.push({ id, title: article.title, quality: current.quality.status });
  }
  let ids = [];
  try { ids = await fs.readdir(path.join(root, 'gym/sessions')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const sessions = [];
  for (const id of ids.filter(id => /^[0-9a-f-]{36}$/.test(id))) {
    const session = await gymSession(root, id);
    sessions.push({ id, revision: session.revision, stage: session.stage, updated_at: session.updated_at });
  }
  return { scenario: { ...scenario, readings: [...new Set(scenario.readings.map(r => r.id))] }, readings, sessions, milestone: { validated: readings.filter(r => r.quality === 'ok').length, target: 5, completed: sessions.filter(s => s.stage === 'complete').length } };
}
export async function gymSession(root, id) {
  if (!/^[0-9a-f-]{36}$/.test(id || '')) throw fail(400, 'Invalid session ID.');
  const directory = path.join(root, 'gym/sessions', id);
  let files;
  try { files = await fs.readdir(directory); } catch (error) { if (error.code === 'ENOENT') throw fail(404, 'Session not found.'); throw error; }
  const revisions = files.filter(f => /^\d{4}$/.test(f)).sort();
  if (!revisions.length) throw fail(404, 'Session not found.');
  return JSON.parse(await fs.readFile(path.join(directory, revisions.at(-1), 'decision.json'), 'utf8'));
}
export function decisionMarkdown(session) {
  return `# ${session.title}\n\nSession: ${session.id} · Revision: ${session.revision} · ${session.updated_at}\n\nStatus: ${session.stage}. Learning progress is separate from extraction quality.\n\n## Scenario\n\n${session.scenario}\n\n## Initial answer (retained unchanged)\n\n${session.initial_answer}\n\n## Evidence and coaching\n\n${session.critique.map(c => `### ${c.dimension}\n\n${c.question} [${c.evidence}]`).join('\n\n')}\n\nThis is a guided self-critique, not an automated assessment of the answer. The questions extend the readings; they are not claims that the sources prescribe every control.\n\n${session.evidence.map(e => `### [${e.reference}] ${e.title}\n\n${e.url || ''}\n\narticles/${e.id}/article.md, lines ${e.start}–${e.end}; quality: ${e.quality}\n\nSource SHA-256: ${e.source_hash}\nMarkdown SHA-256: ${e.markdown_hash}\n\n${e.text.split('\n').map(l => '> ' + l).join('\n')}`).join('\n\n')}\n\n## My critique\n\n${session.critique_notes || 'Not yet recorded.'}\n\n## Revised decision\n\n${session.revised_decision || 'Not yet recorded.'}\n\n## Reconsider when\n\n${session.reconsider_when || 'Not yet recorded.'}\n`;
}
export async function saveGym(root, body) {
  if (!body || !['answer', 'revise'].includes(body.action)) throw fail(400, 'Invalid session action.');
  const text = (key, min = 20) => {
    if (typeof body[key] !== 'string' || body[key].trim().length < min || body[key].length > 8000) throw fail(400, `${key}: enter ${min}–8000 characters.`);
    return body[key].trim();
  };
  let session;
  if (body.action === 'answer') {
    const answer = text('initial_answer');
    session = { version: 1, id: crypto.randomUUID(), revision: 1, stage: 'answered', title: scenario.title, scenario: scenario.question, initial_answer: answer, evidence: await evidence(root), critique: rubric };
  } else {
    const previous = await gymSession(root, body.id);
    if (body.revision !== previous.revision) throw fail(409, 'The session changed. Reload before saving.');
    session = { ...previous, revision: previous.revision + 1, stage: 'complete', critique_notes: text('critique_notes'), revised_decision: text('revised_decision'), reconsider_when: text('reconsider_when') };
  }
  if (session.revision > 9999) throw fail(409, 'Session revision limit reached.');
  session.updated_at = new Date().toISOString();
  const directory = path.join(root, 'gym/sessions', session.id);
  await fs.mkdir(directory, { recursive: true });
  const temporary = path.join(directory, `.pending-${crypto.randomUUID()}`);
  await fs.mkdir(temporary);
  try {
    await fs.writeFile(path.join(temporary, 'decision.json'), JSON.stringify(session, null, 2) + '\n');
    await fs.writeFile(path.join(temporary, 'decision.md'), decisionMarkdown(session));
    await fs.rename(temporary, path.join(directory, String(session.revision).padStart(4, '0')));
  } finally { await fs.rm(temporary, { recursive: true, force: true }); }
  return session;
}
export async function gymPack(root) {
  const articles = await readConfiguration(root), sections = [];
  for (const id of [...new Set(scenario.readings.map(r => r.id))]) {
    const article = articles.find(a => a.id === id);
    if (!article) throw fail(409, `Missing reading: ${id}`);
    const current = await inspectContent(path.dirname(path.join(root, articlePdfPath(article))));
    if (!current.wordCount || current.review.status === 'rejected') throw fail(409, `Reading unavailable or rejected: ${id}`);
    // Explicit excerpts, bounded by complete source lines; never pretend these are complete articles.
    const lines = current.markdown.replace(/\r\n?/g, '\n').split('\n');
    let words = 0, end = 0;
    for (const line of lines) { if (words + countWords(line) > 2000) break; words += countWords(line); end++; }
    sections.push(`## ${article.title}\n\nSelected opening excerpt, lines 1–${end}; ${words} words. Quality: ${current.quality.status}.\n\n${article.url || ''}\n\nMarkdown SHA-256: ${current.markdown_hash}\n\n${lines.slice(0, end).join('\n')}`);
  }
  const markdown = `# Architect Gym · 35-minute pack\n\nSuggested timebox: 5 minutes for your initial answer, 20 minutes reading, 10 minutes recall and revision. Reading speed varies; the excerpts are limited to 4,000 words.\n\n## Challenge — write before reading\n\n${scenario.question}\n\nWrite your answer on paper or save it in Architect Gym before continuing. This pack contains no suggested solution.\n\n${sections.join('\n\n')}\n\n## Recall without looking back\n\n${scenario.recall.map(q => '- ' + q).join('\n')}\n\nSave your revised decision and reconsideration triggers in Architect Gym.\n`;
  return buildEpub({ id: 'architect-gym-ownership', title: 'Architect Gym — ownership · 35 minutes', language: 'en' }, markdown, root, { trust: { quality: 'preview', issues: ['Learning preview. Each reading carries its current extraction-quality status.'] } });
}
