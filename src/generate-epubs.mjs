import { generateEpubs } from './epub.mjs';
try {
  const args = process.argv.slice(2);
  if (args.some(arg => !arg.startsWith('--id='))) throw new Error('Usage: npm run epub -- [--id=<article-id>]');
  const result = await generateEpubs(process.cwd(), { ids: args.map(arg => arg.slice(5)) });
  if (result.failed) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
