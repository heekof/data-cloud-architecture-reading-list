import { readConfiguration, syncMetadata } from "./article-library.mjs";

try {
  const root = process.cwd();
  const articles = await readConfiguration(root);
  await syncMetadata(root, articles);
  console.log(`Synchronized metadata for ${articles.length} articles from articles.yaml.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
