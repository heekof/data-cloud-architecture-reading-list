import { openSync, writeFileSync, closeSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readConfiguration } from './article-library.mjs';

const steps = [
  { name: 'Archive missing PDFs', script: './archive-articles.mjs' },
  { name: 'Extract missing Markdown', script: './extract-articles.mjs' },
  { name: 'Refresh metadata and reports', script: './generate-article-report.mjs' },
];

let logFile;
let activeChild;
let interruptedSignal;
let killTimer;
function appendLog(chunk) {
  // Small synchronous writes keep the current log on disk before an interruption.
  if (logFile !== undefined) writeFileSync(logFile, chunk);
}
function log(message) {
  appendLog(message + '\n');
  console.log(message);
}
function interrupt(signal) {
  if (interruptedSignal) return;
  interruptedSignal = signal;
  process.exitCode = signal === 'SIGINT' ? 130 : 143;
  log(`Interrupted by ${signal}; stopping the current step. Remaining steps will not start.`);
  if (activeChild) {
    const child = activeChild;
    child.kill(signal);
    killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
    killTimer.unref();
  }
}
const onSigint = () => interrupt('SIGINT');
const onSigterm = () => interrupt('SIGTERM');

function runStep(step) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(step.script, import.meta.url))], {
      cwd: process.cwd(), stdio: ['inherit', 'pipe', 'pipe'],
    });
    activeChild = child;
    for (const [input, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      input.on('data', chunk => {
        appendLog(chunk);
        output.write(chunk);
      });
    }
    child.on('error', error => {
      log(`${step.name}: ${error.message}`);
      resolve({ code: 1, signal: null });
    });
    child.on('close', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      clearTimeout(killTimer);
      resolve({ code: code ?? 1, signal });
    });
  });
}

try {
  await readConfiguration(process.cwd());
  logFile = openSync(path.join(process.cwd(), 'pipeline.log'), 'w');
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  const results = [];
  for (const step of steps) {
    if (interruptedSignal) break;
    log(`\n${step.name}`);
    const result = await runStep(step);
    results.push({ ...step, ...result });
    if (interruptedSignal || result.signal) {
      log(`Interrupted during: ${step.name}. Remaining steps were not started.`);
      process.exitCode ||= result.signal === 'SIGINT' ? 130 : 1;
      break;
    }
    // A blocked download must not prevent processing other successful captures.
  }
  log('\nLibrary update summary');
  for (const result of results) {
    log(`${result.code === 0 ? 'OK' : 'INCOMPLETE'}: ${result.name}`);
  }
  if (results.some(result => result.code !== 0)) process.exitCode ||= 1;
  if (!interruptedSignal && results.length === steps.length && results.at(-1).code === 0) {
    log('Reports: articles-overview.md, articles-overview.csv, article-quality.md');
    if (process.exitCode) log('See manual-tasks-todo-for-me.md and archive-issues.log for download problems; extraction errors are printed above.');
  }
  log('Combined run log: pipeline.log');
} catch (error) {
  appendLog(error.message + '\n');
  console.error(error.message);
  process.exitCode ||= 1;
} finally {
  process.off('SIGINT', onSigint);
  process.off('SIGTERM', onSigterm);
  clearTimeout(killTimer);
  if (logFile !== undefined) closeSync(logFile);
}
