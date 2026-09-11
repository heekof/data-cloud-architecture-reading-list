import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import YAML from 'yaml';
import { readConfiguration, articlePdfPath, countWords } from './article-library.mjs';

const indexPath = root => path.join(root, '.search', 'corpus.sqlite');
const sql = value => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''").replaceAll('\0', '')}'`;
const passageWords = 50;
// Include the chunking configuration so existing indexes rebuild after a change.
const indexVersion = `line-passages-v2:${passageWords}`;
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const schema = `
CREATE TABLE IF NOT EXISTS articles (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, rating REAL,
 quality TEXT NOT NULL, review TEXT NOT NULL, notes TEXT, word_count INTEGER,
 pdf INTEGER NOT NULL, url TEXT, fingerprint TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS passages (
 id INTEGER PRIMARY KEY, article_id TEXT NOT NULL, start_line INTEGER NOT NULL,
 end_line INTEGER NOT NULL, heading TEXT NOT NULL, body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS passages_article ON passages(article_id);
CREATE VIRTUAL TABLE IF NOT EXISTS passage_fts USING fts5(
 title, body, tokenize='unicode61 remove_diacritics 2'
);
`;

export function sqlite(root, statement) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.SQLITE3 || 'sqlite3', ['-batch', '-bail', '-json', indexPath(root)], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', errors = '';
    let settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
    const timer = setTimeout(() => { child.kill(); finish(new Error('Search database operation timed out.')); }, 20000);
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', error => finish(new Error(error.code === 'ENOENT' ? 'SQLite is required. Install sqlite3 with FTS5 support or set SQLITE3.' : error.message)));
    child.stdin.on('error', error => { if (error.code !== 'EPIPE') finish(error); });
    child.on('close', code => {
      if (code !== 0) return finish(new Error(errors.trim() || 'Search database operation failed.'));
      try { finish(null, output.trim() ? JSON.parse(output) : []); }
      catch { finish(new Error('Unexpected response from SQLite.')); }
    });
    child.stdin.end(`.timeout 10000\n${statement}\n`);
  });
}

// Keep exact line ranges into the original Markdown; never rewrite article text.
export function chunkMarkdown(markdown, targetWords = passageWords) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const chunks = [];
  let start = null, words = 0, heading = '', currentHeading = '';
  const flush = end => {
    if (start === null) return;
    const body = lines.slice(start, end + 1).join('\n').trim();
    if (countWords(body)) chunks.push({ start_line: start + 1, end_line: end + 1, heading: currentHeading, body });
    start = null; words = 0;
  };
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#{1,6}\s+(.+)/);
    if (match) { flush(i - 1); heading = match[1]; }
    if (start === null && lines[i].trim()) { start = i; currentHeading = heading; }
    if (start !== null) words += countWords(lines[i]);
    if (start !== null && words >= targetWords) flush(i);
  }
  flush(lines.length - 1);
  return chunks;
}

export async function indexCorpus(root) {
  const articles = await readConfiguration(root);
  await fs.mkdir(path.dirname(indexPath(root)), { recursive: true });
  await sqlite(root, schema);
  const existing = new Map((await sqlite(root, 'SELECT id, fingerprint FROM articles;')).map(row => [row.id, row.fingerprint]));
  const statements = ['BEGIN IMMEDIATE;'];
  let updated = 0, removed = 0, unchanged = 0;
  const drop = id => {
    statements.push(`DELETE FROM passage_fts WHERE rowid IN (SELECT id FROM passages WHERE article_id=${sql(id)});`, `DELETE FROM passages WHERE article_id=${sql(id)};`, `DELETE FROM articles WHERE id=${sql(id)};`);
  };
  for (const article of articles) {
    const directory = path.join(root, path.dirname(articlePdfPath(article)));
    let markdown;
    try { markdown = await fs.readFile(path.join(directory, 'article.md'), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (markdown === undefined) { if (existing.has(article.id)) { drop(article.id); removed++; } existing.delete(article.id); continue; }
    let metadata = {};
    try { metadata = YAML.parse(await fs.readFile(path.join(directory, 'metadata.yaml'), 'utf8')) || {}; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    let pdf = false;
    try { pdf = (await fs.stat(path.join(directory, 'source.pdf'))).isFile(); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const review = metadata.quality_review?.status || 'pending';
    const quality = metadata.quality?.status || 'not_reviewed';
    const fields = { id: article.id, title: article.title, category: article.category, rating: typeof article.rating === 'number' ? article.rating : null, quality, review, notes: metadata.quality_review?.notes || null, word_count: countWords(markdown), pdf: Number(pdf), url: article.url };
    const fingerprint = digest(indexVersion + '\n' + JSON.stringify(fields) + '\n' + markdown);
    if (existing.get(article.id) === fingerprint) { unchanged++; existing.delete(article.id); continue; }
    drop(article.id);
    statements.push(`INSERT INTO articles (id,title,category,rating,quality,review,notes,word_count,pdf,url,fingerprint) VALUES (${Object.values(fields).map(sql).join(',')},${sql(fingerprint)});`);
    for (const chunk of chunkMarkdown(markdown)) {
      statements.push(`INSERT INTO passages (article_id,start_line,end_line,heading,body) VALUES (${sql(article.id)},${chunk.start_line},${chunk.end_line},${sql(chunk.heading)},${sql(chunk.body)});`);
      statements.push(`INSERT INTO passage_fts (rowid,title,body) VALUES (last_insert_rowid(),${sql(article.title)},${sql(chunk.body)});`);
    }
    existing.delete(article.id); updated++;
  }
  for (const id of existing.keys()) { drop(id); removed++; }
  statements.push('COMMIT;');
  await sqlite(root, statements.join('\n'));
  return { updated, unchanged, removed, ...await corpusStats(root) };
}

export async function corpusStats(root) {
  const [totals] = await sqlite(root, `SELECT count(*) AS articles, coalesce(sum(word_count),0) AS words, coalesce(sum(review='rejected'),0) AS rejected, (SELECT count(*) FROM passages) AS passages FROM articles;`);
  const categories = await sqlite(root, 'SELECT category, count(*) AS count FROM articles GROUP BY category ORDER BY category;');
  return { ...totals, categories };
}

export function matchExpression(query) {
  const tokens = query.match(/"[^"]+"|[^\s"]+/g) || [];
  return tokens.map(token => token.replace(/^"|"$/g, '').trim()).filter(token => /[\p{L}\p{N}]/u.test(token))
    .slice(0, 16).map(token => `"${token.replaceAll('"', '""')}"`).join(' AND ');
}

export async function searchCorpus(root, { query = '', category = '', minRating = '', quality = '', includeRejected = false, page = 1 } = {}) {
  if (query.length > 300) throw new Error('La recherche est limitée à 300 caractères.');
  const clauses = [];
  if (!includeRejected) clauses.push("a.review != 'rejected'");
  if (category) clauses.push(`a.category=${sql(category)}`);
  if (minRating !== '') {
    const number = Number(minRating);
    if (!Number.isFinite(number) || number < 0 || number > 10) throw new Error('La note doit être comprise entre 0 et 10.');
    clauses.push(`a.rating >= ${number}`);
  }
  if (quality) clauses.push(`a.quality=${sql(quality)}`);
  const expression = matchExpression(query);
  const filtered = clauses.length ? clauses.join(' AND ') : '1';
  const currentPage = Math.max(1, Math.min(10000, Math.trunc(Number(page)) || 1));
  const size = 12, offset = (currentPage - 1) * size;
  if (query.trim() && !expression) return { total: 0, results: [], page: currentPage, pages: 0 };
  const cte = expression ? `WITH hits AS MATERIALIZED (
    SELECT p.*, bm25(passage_fts,4.0,1.0) AS score,
    snippet(passage_fts,1,char(1),char(2),' … ',44) AS excerpt
    FROM passage_fts JOIN passages p ON p.id=passage_fts.rowid
    WHERE passage_fts MATCH ${sql(expression)}
  ), selected AS (
    SELECT h.*, row_number() OVER(PARTITION BY h.article_id ORDER BY h.score,h.id) AS position,
    count(*) OVER(PARTITION BY h.article_id) AS matches FROM hits h
  )` : `WITH selected AS (
    SELECT p.*, 0 AS score, substr(p.body,1,350) AS excerpt,
    row_number() OVER(PARTITION BY article_id ORDER BY p.id) AS position,
    1 AS matches FROM passages p
  )`;
  const from = `FROM selected s JOIN articles a ON a.id=s.article_id WHERE s.position=1 AND ${filtered}`;
  const [{ total }] = await sqlite(root, `${cte} SELECT count(*) AS total ${from};`);
  const results = await sqlite(root, `${cte} SELECT a.*,s.id AS passage_id,s.start_line,s.end_line,s.heading,s.excerpt,s.matches ${from}
    ORDER BY ${expression ? 's.score ASC,' : ''} a.rating DESC,a.title ASC LIMIT ${size} OFFSET ${offset};`);
  return { total, results: results.map(({ fingerprint, ...result }) => result), page: currentPage, pages: Math.ceil(total / size) };
}
