import { indexCorpus } from './search-index.mjs';
try {
  const result = await indexCorpus(process.cwd());
  console.log(`Search index: ${result.articles} articles, ${result.passages} passages. Updated: ${result.updated}; unchanged: ${result.unchanged}; removed: ${result.removed}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
