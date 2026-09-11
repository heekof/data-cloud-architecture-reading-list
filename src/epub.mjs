import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import MarkdownIt from 'markdown-it';
import { zipSync, strToU8 } from 'fflate';
import { readConfiguration, articlePdfPath, countWords } from './article-library.mjs';

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '');
const xml = value => clean(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const imageTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };
const stylesheet = 'body{font-family:serif;line-height:1.5;margin:5%;}h1,h2,h3{line-height:1.2;}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85em;}code{font-family:monospace;}img{max-width:100%;height:auto;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid;padding:.3em;}blockquote{margin-left:1em;padding-left:1em;border-left:2px solid;}a{overflow-wrap:anywhere;}.source{font-size:.85em;}.notice{font-style:italic;}';
const xhtml = (title, language, body) => `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${xml(language)}" xml:lang="${xml(language)}"><head><title>${xml(title)}</title><link rel="stylesheet" type="text/css" href="style.css" /></head><body>${body}</body></html>`;
async function readOptional(filename) { try { return await fs.readFile(filename); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }

export async function buildEpub(article, markdown, directory) {
  const warnings = [];
  const language = typeof article.language === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(article.language) ? article.language : 'en';
  const md = new MarkdownIt({ html: false, xhtmlOut: true, linkify: false, typographer: false });
  const tokens = md.parse(clean(markdown), {});
  const headings = [], images = new Map();
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open') {
      const id = `section-${headings.length + 1}`;
      tokens[i].attrSet('id', id);
      headings.push({ id, title: tokens[i + 1]?.content || article.title });
    }
    for (const token of tokens[i].children || []) {
      if (token.type !== 'image') continue;
      const source = token.attrGet('src');
      if (images.has(source)) continue;
      try {
        if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(source)) throw new Error('image distante non téléchargée');
        const filename = await fs.realpath(path.resolve(directory, decodeURIComponent(source)));
        const base = await fs.realpath(directory);
        if (!filename.startsWith(base + path.sep)) throw new Error('image hors du dossier article');
        const type = imageTypes[path.extname(filename).toLowerCase()];
        if (!type) throw new Error('format d’image non pris en charge');
        const data = await fs.readFile(filename);
        if (data.length > 10 * 1024 * 1024) throw new Error('image supérieure à 10 Mo');
        const name = `images/image-${images.size + 1}${path.extname(filename).toLowerCase()}`;
        images.set(source, { name, type, data });
      } catch (error) { images.set(source, null); warnings.push(`Image non embarquée (${source}) : ${error.message}`); }
    }
  }
  md.renderer.rules.image = (items, index) => {
    const token = items[index], resource = images.get(token.attrGet('src'));
    const alt = md.renderer.renderInlineAsText(token.children || [], md.options, {});
    return resource ? `<img src="${xml(resource.name)}" alt="${xml(alt)}" />` : `<span class="notice">[Image non embarquée : ${xml(alt || token.attrGet('src'))}]</span>`;
  };
  const links = [];
  md.renderer.rules.link_open = (items, index) => {
    const href = items[index].attrGet('href') || '';
    const allowed = /^(https?:|mailto:)/i.test(href);
    links.push(allowed);
    if (!allowed) warnings.push(`Lien local conservé comme texte : ${href}`);
    return allowed ? `<a href="${xml(href)}">` : '<span>';
  };
  md.renderer.rules.link_close = () => links.pop() ? '</a>' : '</span>';
  const body = md.renderer.render(tokens, md.options, {});
  const title = article.title;
  const identifier = `urn:sha256:${hash(article.id)}`;
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const resources = [...images.values()].filter(Boolean);
  const fingerprint = hash(JSON.stringify({ version: 1, id: article.id, title, url: article.url, language, author: article.author || null, markdown, resources: resources.map(r => [r.name, hash(r.data)]) }));
  const source = article.url ? `<p class="source">Source : <a href="${xml(article.url)}">${xml(article.url)}</a></p>` : '';
  const nav = `<nav epub:type="toc" id="toc"><h1>Sommaire</h1><ol><li><a href="article.xhtml">${xml(title)}</a>${headings.length ? `<ol>${headings.map(h => `<li><a href="article.xhtml#${h.id}">${xml(h.title)}</a></li>`).join('')}</ol>` : ''}</li></ol></nav>`;
  const opf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(title)}</dc:title><dc:language>${xml(language)}</dc:language>${typeof article.author === 'string' ? `<dc:creator>${xml(article.author)}</dc:creator>` : ''}${article.url ? `<dc:source>${xml(article.url)}</dc:source>` : ''}<meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="article" href="article.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/>${resources.map((r, i) => `<item id="image-${i}" href="${xml(r.name)}" media-type="${r.type}"/>`).join('')}</manifest><spine><itemref idref="article"/></spine></package>`;
  const files = {
    mimetype: [strToU8('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': strToU8('<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="EPUB/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),
    'EPUB/content.opf': strToU8(opf),
    'EPUB/nav.xhtml': strToU8(xhtml('Sommaire', language, nav)),
    'EPUB/article.xhtml': strToU8(xhtml(title, language, `<header><h1>${xml(title)}</h1>${source}</header>${body}`)),
    'EPUB/style.css': strToU8(stylesheet),
  };
  for (const resource of resources) files[`EPUB/${resource.name}`] = resource.data;
  return { bytes: zipSync(files, { level: 6 }), fingerprint, warnings: [...new Set(warnings)] };
}

export async function generateEpubs(root, { ids = [], log = console.log } = {}) {
  const articles = await readConfiguration(root);
  for (const id of ids) if (!articles.some(a => a.id === id)) throw new Error(`Unknown article ID: ${id}`);
  const reportPath = path.join(root, 'epub-report.json');
  const previousBytes = await readOptional(reportPath);
  const previous = previousBytes ? JSON.parse(previousBytes.toString('utf8')) : { version: 1, articles: [] };
  if (previous.version !== 1 || !Array.isArray(previous.articles)) throw new Error('Invalid epub-report.json; preserve it and repair its format before generating EPUBs.');
  const rows = new Map(previous.articles.map(row => [row.id, row]));
  const totals = { created: 0, updated: 0, unchanged: 0, missing: 0, failed: 0 };
  const writeReport = async () => {
    const temporary = `${reportPath}.${crypto.randomUUID()}.tmp`;
    try { await fs.writeFile(temporary, JSON.stringify({ version: 1, articles: [...rows.values()] }, null, 2) + '\n', { flag: 'wx' }); await fs.rename(temporary, reportPath); }
    finally { await fs.rm(temporary, { force: true }); }
  };
  for (const article of articles.filter(a => !ids.length || ids.includes(a.id))) {
    const directory = path.dirname(path.join(root, articlePdfPath(article)));
    const destination = path.join(directory, 'article.epub');
    const old = rows.get(article.id) || {};
    try {
      const input = await readOptional(path.join(directory, 'article.md'));
      if (!input || !countWords(input.toString('utf8'))) {
        totals.missing++; rows.set(article.id, { ...old, id: article.id, status: 'missing_markdown', warnings: ['Texte Markdown absent ou vide ; EPUB non généré.'] });
        log(`EPUB skipped (missing text): ${article.id}`); await writeReport(); continue;
      }
      const built = await buildEpub(article, input.toString('utf8'), directory);
      const existing = await readOptional(destination);
      if (existing && hash(existing) !== old.output_hash) throw new Error('Existing EPUB is unmanaged or manually modified; preserved. Move it aside before regenerating.');
      if (existing && built.fingerprint === old.fingerprint) {
        totals.unchanged++; rows.set(article.id, { ...old, status: 'ready', warnings: built.warnings });
      } else {
        const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
        try {
          await fs.writeFile(temporary, built.bytes, { flag: 'wx' });
          if (existing) {
            const latest = await readOptional(destination);
            if (!latest || hash(latest) !== old.output_hash) throw new Error('EPUB changed during generation; preserved.');
            await fs.rename(temporary, destination);
          } else await fs.link(temporary, destination);
        } finally { await fs.rm(temporary, { force: true }); }
        totals[existing ? 'updated' : 'created']++;
        rows.set(article.id, { id: article.id, status: 'ready', fingerprint: built.fingerprint, output_hash: hash(built.bytes), warnings: built.warnings });
        log(`EPUB ${existing ? 'updated' : 'created'}: ${article.id}`);
      }
    } catch (error) {
      totals.failed++; rows.set(article.id, { ...old, id: article.id, status: 'error', warnings: [error.message] }); log(`EPUB failed: ${article.id}: ${error.message}`);
    }
    await writeReport();
  }
  log(`EPUBs: ${totals.created} created, ${totals.updated} updated, ${totals.unchanged} unchanged, ${totals.missing} without Markdown, ${totals.failed} failed. Report: epub-report.json`);
  return totals;
}
