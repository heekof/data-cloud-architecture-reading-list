import { readConfiguration, syncMetadata } from './article-library.mjs';
import { writeArticleReport } from './article-report.mjs';

try {
  const root = process.cwd();
  const articles = await readConfiguration(root);
  await syncMetadata(root, articles);
  const rows = await writeArticleReport(root, articles);
  console.log(`Generated articles-overview.md and articles-overview.csv for ${rows.length} articles.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
