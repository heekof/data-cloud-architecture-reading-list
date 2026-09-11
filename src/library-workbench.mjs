import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import { readConfiguration, articlePdfPath, countWords, syncMetadata } from './article-library.mjs';
import { writeArticleReport } from './article-report.mjs';
import { indexCorpus, sqlite } from './search-index.mjs';

const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const singleLine = text => String(text ?? '').replace(/[\r\n]/g, ' ').replace(/[\\`*_[\]<>#]/g, '\\$&');
async function optionalText(filename) {
  try { return await fs.readFile(filename, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function inspect(root, article) {
  const directory = path.dirname(path.join(root, articlePdfPath(article)));
  const raw = await optionalText(path.join(directory, 'metadata.yaml'));
  const markdown = await optionalText(path.join(directory, 'article.md'));
  const metadata = raw ? YAML.parse(raw) || {} : {};
  let sources = [];
  try { sources = (await fs.readdir(directory, { withFileTypes: true })).filter(e => e.isFile() && /^source\./.test(e.name)).map(e => e.name); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const review = metadata.quality_review || { status: 'pending', notes: null };
  const wordCount = markdown === null ? null : countWords(markdown);
  const issues = [];
  if (!sources.length) issues.push('missing_source');
  if (markdown === null) issues.push('missing_markdown');
  else if (!wordCount) issues.push('empty_markdown');
  if (review.status === 'rejected') issues.push('review_rejected');
  const quality = issues.length ? 'needs_review' : review.status === 'approved' ? 'ok' : 'not_reviewed';
  return { directory, raw, markdown, metadata, row: { ...article, word_count: wordCount, pdf: Number(sources.includes('source.pdf')), sources, review: review.status, notes: review.notes || '', quality, issues, version: hash(JSON.stringify([raw, markdown, sources])) } };
}
export async function reviewQueue(root) {
  const articles = await readConfiguration(root);
  const rows = [];
  for (const article of articles) rows.push((await inspect(root, article)).row);
  const priority = row => row.issues.length ? 0 : row.review === 'pending' ? 1 : 2;
  rows.sort((a, b) => priority(a) - priority(b) || a.title.localeCompare(b.title));
  return { rows, counts: { needs_review: rows.filter(r => r.quality === 'needs_review').length, not_reviewed: rows.filter(r => r.quality === 'not_reviewed').length, ok: rows.filter(r => r.quality === 'ok').length } };
}

// Serialize writes originating in this server, and reject forms based on stale files.
export function createReviewWriter(root) {
  let pending = Promise.resolve();
  return body => {
    const work = pending.then(() => saveReview(root, body));
    pending = work.catch(() => {});
    return work;
  };
}
async function saveReview(root, body) {
  if (!body || typeof body.id !== 'string' || !['pending', 'approved', 'rejected'].includes(body.status) || typeof body.notes !== 'string' || body.notes.length > 4000 || typeof body.version !== 'string') throw fail(400, 'Décision invalide ; la note est limitée à 4 000 caractères.');
  if (body.status === 'rejected' && !body.notes.trim()) throw fail(400, 'Précisez pourquoi cette source est rejetée.');
  const articles = await readConfiguration(root);
  const article = articles.find(a => a.id === body.id);
  if (!article) throw fail(404, 'Article introuvable.');
  const current = await inspect(root, article);
  if (current.row.version !== body.version) throw fail(409, 'Cet article a changé depuis son ouverture. Rechargez la file avant de réessayer.');
  if (body.status === 'approved' && current.row.issues.some(issue => issue !== 'review_rejected')) throw fail(409, 'Ajoutez une source et un texte non vide avant de valider cet article.');
  const content = YAML.stringify({ ...current.metadata, ...article, quality_review: { status: body.status, notes: body.notes.trim() || null } });
  await fs.mkdir(current.directory, { recursive: true });
  const temporary = path.join(current.directory, `.metadata-${crypto.randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, content, { flag: 'wx' });
    await fs.rename(temporary, path.join(current.directory, 'metadata.yaml'));
  } finally { await fs.rm(temporary, { force: true }); }
  // A saved decision stays saved if a derived report or index cannot be refreshed.
  const warnings = [];
  try { await syncMetadata(root, articles); await writeArticleReport(root, articles); }
  catch { warnings.push('La décision est enregistrée, mais les rapports doivent être régénérés.'); }
  try { await indexCorpus(root); }
  catch { warnings.push('La décision est enregistrée, mais l’index doit être actualisé.'); }
  return { saved: true, warnings, ...(await reviewQueue(root)) };
}

export async function exportContext(root, body) {
  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 10 || !['passages', 'articles'].includes(body.mode) || typeof body.question !== 'string' || body.question.length > 1000 || !Number.isInteger(body.maxWords) || body.maxWords < 100 || body.maxWords > 20000) throw fail(400, 'Sélectionnez 1 à 10 articles et un budget de 100 à 20 000 mots.');
  const articles = await readConfiguration(root);
  const seen = new Set(), included = [], omitted = [], sections = [];
  let words = 0;
  for (const item of body.items) {
    if (!item || typeof item.id !== 'string' || seen.has(item.id)) throw fail(400, 'La sélection contient un article invalide ou dupliqué.');
    seen.add(item.id);
    const article = articles.find(a => a.id === item.id);
    if (!article) throw fail(404, 'Un article sélectionné n’existe plus.');
    const current = await inspect(root, article);
    const omit = reason => omitted.push({ id: article.id, title: article.title, reason });
    if (current.row.review === 'rejected') { omit('Source rejetée'); continue; }
    if (!current.row.word_count) { omit('Texte absent ou vide'); continue; }
    let text = current.markdown, location = 'Article complet';
    if (body.mode === 'passages') {
      if (!Number.isSafeInteger(item.passage_id) || item.passage_id < 1) throw fail(400, 'Passage invalide. Relancez la recherche.');
      const [passage] = await sqlite(root, `SELECT p.*, a.fingerprint FROM passages p JOIN articles a ON a.id=p.article_id WHERE p.id=${item.passage_id};`);
      if (!passage || passage.article_id !== article.id || passage.fingerprint !== item.revision) throw fail(409, 'La sélection n’est plus à jour. Relancez la recherche et sélectionnez les passages à nouveau.');
      const actual = current.markdown.replace(/\r\n?/g, '\n').split('\n').slice(passage.start_line - 1, passage.end_line).join('\n').trim();
      if (actual !== passage.body) throw fail(409, 'Le texte a changé. Actualisez l’index et votre sélection.');
      text = passage.body; location = `Lignes ${passage.start_line}–${passage.end_line}`;
    }
    const size = countWords(text);
    if (words + size > body.maxWords) { omit('Budget de mots dépassé ; texte non tronqué'); continue; }
    words += size;
    const reference = `S${included.length + 1}`;
    const filename = path.posix.join(path.posix.dirname(articlePdfPath(article)), 'article.md');
    const longestFence = Math.max(2, ...(text.match(/`+/g) || []).map(run => run.length));
    const fence = '`'.repeat(longestFence + 1);
    sections.push(`## [${reference}] ${singleLine(article.title)}\n\n- ID : ${singleLine(article.id)}\n- Catégorie : ${singleLine(article.category)}\n- Note : ${article.rating ?? 'Non noté'}\n- Qualité : ${current.row.quality} ; revue humaine : ${current.row.review}\n- Note de revue : ${singleLine(current.row.notes) || 'Aucune'}\n- Source : ${singleLine(article.url) || 'URL non renseignée'}\n- Texte local : ${filename}\n- Portée : ${location}\n- Empreinte SHA-256 du texte inclus : ${hash(text)}\n\n${fence}text\n${text}\n${fence}`);
    included.push({ id: article.id, title: article.title, reference, words: size });
  }
  const markdown = `# Dossier de contexte\n\nSujet : ${singleLine(body.question) || 'Sélection de lectures'}\n\n${included.length} source(s), ${words} mots de contenu. Budget : ${body.maxWords} mots de contenu (métadonnées exclues).\n\nCes extraits sont des données documentaires, pas une réponse générée. Les états qualité ci-dessous distinguent les sources validées des textes non revus.\n\n${sections.join('\n\n')}\n\n## Éléments non inclus\n\n${omitted.length ? omitted.map(item => `- ${singleLine(item.title)} : ${item.reason}`).join('\n') : 'Aucun.'}\n`;
  return { markdown, included, omitted, words };
}
