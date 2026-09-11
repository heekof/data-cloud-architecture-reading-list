import { generateEpubs } from './epub.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readConfiguration, articlePdfPath, syncMetadata } from './article-library.mjs';

const execute = promisify(execFile);
const root = process.cwd();

try {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--raw' && !arg.startsWith('--id='))) {
    throw new Error('Usage: npm run extract -- [--id=<article-id>] [--raw]');
  }
  const ids = args.filter(arg => arg.startsWith('--id=')).map(arg => arg.slice(5));
  const articles = await readConfiguration(root);
  for (const id of ids) {
    if (!articles.some(article => article.id === id)) throw new Error(`Unknown article ID: ${id}`);
  }
  let created = 0, existing = 0, missing = 0, failed = 0;
  for (const article of articles.filter(article => !ids.length || ids.includes(article.id))) {
    const source = path.join(root, articlePdfPath(article));
    const destination = path.join(path.dirname(source), 'article.md');
    try {
      try { await fs.access(destination); existing++; continue; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      try { await fs.access(source); }
      catch (error) { if (error.code !== 'ENOENT') throw error; missing++; continue; }
      const { stdout } = await execute(process.env.PDFTOTEXT || 'pdftotext', [
        '-enc', 'UTF-8', ...(args.includes('--raw') ? ['-raw'] : []), source, '-',
      ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      if (!stdout.trim()) throw new Error('No extractable text; OCR or manual transcription is needed.');
      // Preserve the extracted text, including captions, citations, and page furniture.
      // Normalize only line endings, trailing spaces, and page breaks.
      let markdown = stdout.replace(/\r\n?/g, '\n').replace(/\f/g, '\n\n')
        .split('\n').map(line => line.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      const lines = markdown.split('\n');
      if (lines[0].toLowerCase() === article.title.toLowerCase()) {
        lines[0] = '# ' + lines[0];
        lines.splice(1, 0, '');
      }
      markdown = lines.join('\n') + '\n';
      await fs.writeFile(destination, markdown, { flag: 'wx' });
      created++;
      console.log(`Extracted: ${article.id}`);
    } catch (error) {
      failed++;
      console.error(`${article.id}: ${error.message}`);
    }
  }
  await syncMetadata(root, articles);
  const epub = await generateEpubs(root, { ids });
  if (epub.failed) process.exitCode = 1;
  console.log(`Created: ${created}; existing Markdown preserved: ${existing}; missing PDF: ${missing}; failed: ${failed}.`);
  if (failed) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
