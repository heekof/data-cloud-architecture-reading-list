import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readConfiguration } from './article-library.mjs';

const steps = [
  { name: 'Archive missing PDFs', script: './archive-articles.mjs' },
  { name: 'Extract missing Markdown', script: './extract-articles.mjs' },
  { name: 'Refresh metadata and reports', script: './generate-article-report.mjs' },
];

const runLog = [];
function log(message) {
  console.log(message);
  runLog.push(message + '\n');
}
function runStep(step) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(step.script, import.meta.url))], {
      cwd: process.cwd(), stdio: ['inherit', 'pipe', 'pipe'],
    });
    for (const [input, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      input.on('data', chunk => {
        output.write(chunk);
        runLog.push(chunk.toString());
      });
    }
    child.on('error', error => {
      log(`${step.name}: ${error.message}`);
      resolve({ code: 1, signal: null });
    });
    child.on('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
}

try {
  // Validate once before starting network requests or changing generated files.
  await readConfiguration(process.cwd());
  const results = [];
  for (const step of steps) {
    log(`\n${step.name}`);
    const result = await runStep(step);
    results.push({ ...step, ...result });
    if (result.signal) {
      log(`Interrupted during: ${step.name}. Remaining steps were not started.`);
      process.exitCode = result.signal === 'SIGINT' ? 130 : 1;
      break;
    }
    // A blocked download must not prevent extraction of successful downloads
    // or generation of an up-to-date inventory of the remaining problems.
  }
  log('\nLibrary update summary');
  for (const result of results) {
    log(`${result.code === 0 ? 'OK' : 'INCOMPLETE'}: ${result.name}`);
  }
  if (results.some(result => result.code !== 0)) process.exitCode ||= 1;
  if (results.length === steps.length && results.at(-1).code === 0) {
    log('Reports: articles-overview.md, articles-overview.csv, article-quality.md');
    if (process.exitCode) log('See manual-tasks-todo-for-me.md and archive-issues.log for download problems; extraction errors are printed above.');
  }
  await fs.writeFile(path.join(process.cwd(), 'pipeline.log'), runLog.join(''), 'utf8');
  console.log('Combined run log: pipeline.log');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
