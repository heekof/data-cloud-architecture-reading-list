import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { articlePdfPath } from './article-library.mjs';

const stopwords = new Set(`a an and are as at be been being but by can could did do does for from had has have how i if in into is it its may more most not of on or our out over own should so some such than that the their them then there these they this those through to too under up use used using very was we were what when where which while who why will with would you your all also each even first get like make many much new now one only other same see two well us about across after before between both during every few further here just no off once per still take way whether within without yet
au aux avec ce ces cette dans de des du elle elles en est et eux il ils je la le les leur lui mais même ne nous on ou par pas pour qu que qui sa se ses son sont sur un une vos vous ça été être plus comme dont fait faire tout tous toute toutes c est d l n s t y
article articles blog share sign subscribe privacy policy copyright rights reserved terms page pages read published updated author authors home menu cookies cookie print content website com org https http www microsoft learn register theme contribute trademarks license click comments comment newsletter email follow login search contact skip next previous back figure table including example examples section paper work based data systems system`.split(/\s+/));

function tokens(text) {
  return (text.normalize('NFC').toLowerCase().replace(/https?:\/\/\S+/g, ' ').match(/\p{L}[\p{L}\p{M}]*(?:-\p{L}[\p{L}\p{M}]*)*/gu) || [])
    .filter(word => word.length >= 3 && !stopwords.has(word));
}

async function isFile(filename) {
  try { return (await fs.stat(filename)).isFile(); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export async function buildArticleRows(root, articles) {
  const rows = [];
  for (const article of articles) {
    const pdfPath = articlePdfPath(article);
    const directory = path.dirname(pdfPath);
    const markdownPath = path.join(directory, 'article.md');
    const metadata = YAML.parse(await fs.readFile(path.join(root, directory, 'metadata.yaml'), 'utf8'));
    const hasMarkdown = await isFile(path.join(root, markdownPath));
    const text = hasMarkdown ? await fs.readFile(path.join(root, markdownPath), 'utf8') : article.note || '';
    rows.push({
      id: article.id, title: article.title, category: article.category,
      word_count: metadata.word_count, rating: article.rating ?? null,
      reading_minutes: metadata.word_count === null ? null : Math.ceil(metadata.word_count / 200),
      keywords: [], keyword_source: hasMarkdown ? 'markdown + metadata' : 'metadata only',
      quality_status: metadata.quality.status, quality_issues: metadata.quality.issues,
      pdf_path: await isFile(path.join(root, pdfPath)) ? pdfPath : null,
      markdown_path: hasMarkdown ? markdownPath : null, source_url: article.url ?? null,
      _tokens: tokens(text), _titleTokens: tokens(`${article.title} ${article.category.replaceAll('-', ' ')}`),
    });
  }
  const frequencies = new Map();
  for (const row of rows) {
    for (const word of new Set([...row._tokens, ...row._titleTokens])) frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }
  for (const row of rows) {
    const counts = new Map();
    for (const word of row._tokens) counts.set(word, (counts.get(word) || 0) + 1);
    for (const word of row._titleTokens) counts.set(word, (counts.get(word) || 0) + 3);
    row.keywords = [...counts].map(([word, count]) => [word, (1 + Math.log(count)) * (1 + Math.log((rows.length + 1) / (frequencies.get(word) + 1)))])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en')).slice(0, 6).map(([word]) => word);
    delete row._tokens;
    delete row._titleTokens;
  }
  return rows.sort((a, b) => (a.word_count ?? Infinity) - (b.word_count ?? Infinity) || a.id.localeCompare(b.id, 'en'));
}

const cell = value => String(value ?? '—').replace(/\s+/g, ' ').replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('[', '\\[').replaceAll(']', '\\]');
export function renderMarkdown(rows) {
  const lines = [
    '# Article overview', '',
    'Generated with `npm run articles:report`. One row per article ID; sorted by word count ascending, missing counts last. This is a current snapshot, not a historical log.', '',
    'Reading time assumes 200 words/minute. Keywords are automatic lexical suggestions (up to six), not reviewed tags; entries without Markdown use metadata only. Counts include all retained PDF text, including headers and references.', '',
    `Articles: ${rows.length}. With Markdown: ${rows.filter(row => row.markdown_path).length}. With PDF: ${rows.filter(row => row.pdf_path).length}.`, '',
    '| ID | Title | Category | Words | Rating /10 | Read min | Keywords (automatic) | Quality | Issues | Files |',
    '|---|---|---|---:|---:|---:|---|---|---|---|',
  ];
  for (const row of rows) {
    const files = [row.pdf_path && `[PDF](${row.pdf_path})`, row.markdown_path && `[MD](${row.markdown_path})`].filter(Boolean).join(' · ') || '—';
    lines.push(`| ${cell(row.id)} | ${cell(row.title)} | ${cell(row.category)} | ${cell(row.word_count)} | ${cell(row.rating)} | ${cell(row.reading_minutes)} | ${cell(row.keywords.join(', ') || null)} | ${cell(row.quality_status)} | ${cell(row.quality_issues.join(', ') || null)} | ${files} |`);
  }
  return lines.join('\n') + '\n';
}

export function renderCsv(rows) {
  const fields = ['id', 'title', 'category', 'word_count', 'rating', 'reading_minutes', 'keywords', 'keyword_source', 'quality_status', 'quality_issues', 'pdf_path', 'markdown_path', 'source_url'];
  const quote = value => `"${String(Array.isArray(value) ? value.join('; ') : value ?? '').replaceAll('"', '""')}"`;
  return [fields.join(','), ...rows.map(row => fields.map(field => quote(row[field])).join(','))].join('\n') + '\n';
}

export async function writeArticleReport(root, articles) {
  const rows = await buildArticleRows(root, articles);
  for (const [name, content] of [['articles-overview.md', renderMarkdown(rows)], ['articles-overview.csv', renderCsv(rows)]]) {
    const filename = path.join(root, name);
    let previous;
    try { previous = await fs.readFile(filename, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (content !== previous) await fs.writeFile(filename, content, 'utf8');
  }
  return rows;
}
