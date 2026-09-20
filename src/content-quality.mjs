import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import { countWords } from './article-library.mjs';

export const contentHash = value => crypto.createHash('sha256').update(value).digest('hex');
export async function optionalFile(filename) {
  try { return await fs.readFile(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
// One live evaluation for synchronization, search, review and exports.
export async function inspectContent(directory) {
  const raw = await optionalFile(path.join(directory, 'metadata.yaml'));
  const input = await optionalFile(path.join(directory, 'article.md'));
  const markdown = input === null ? null : input.toString('utf8');
  const metadata = raw ? YAML.parse(raw.toString('utf8')) || {} : {};
  let entries = [];
  try { entries = await fs.readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const sources = entries.filter(e => e.isFile() && /^source\./.test(e.name)).map(e => e.name).sort();
  const sourceHashes = [];
  for (const name of sources) sourceHashes.push([name, contentHash(await fs.readFile(path.join(directory, name)))]);
  const source_hash = sources.length ? contentHash(JSON.stringify(sourceHashes)) : null;
  const markdown_hash = input === null ? null : contentHash(input);
  const original = metadata.quality_review || { status: 'pending', notes: null };
  if (!['pending', 'approved', 'rejected'].includes(original.status) || (original.notes != null && typeof original.notes !== 'string')) throw new Error(`Invalid quality_review in ${directory}`);
  let review = structuredClone(original);
  const changed = review.reviewed_source_hash !== source_hash || review.reviewed_markdown_hash !== markdown_hash || !review.reviewed_at;
  if (review.status === 'approved' && changed) {
    const { history = [], ...decision } = review;
    review = { status: 'pending', notes: review.notes, invalidated_reason: 'content_changed_or_unbound', history: [...history, decision] };
  }
  const wordCount = markdown === null ? null : countWords(markdown);
  const issues = [];
  if (!sources.length) issues.push('missing_source');
  if (markdown === null) issues.push('missing_markdown');
  else if (!wordCount) issues.push('empty_markdown');
  if (review.status === 'rejected') issues.push('review_rejected');
  if (review.invalidated_reason) issues.push('review_stale');
  const quality = { status: issues.length ? 'needs_review' : review.status === 'approved' ? 'ok' : 'not_reviewed', issues };
  return { directory, raw: raw?.toString('utf8'), metadata, markdown, sources, source_hash, markdown_hash, wordCount, review, quality,
    version: contentHash(JSON.stringify([source_hash, markdown_hash, original])) };
}
