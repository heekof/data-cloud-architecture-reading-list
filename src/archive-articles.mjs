import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import YAML from "yaml";
import { inspectPdf, logIssue, writeManualTasks } from "./archive-support.mjs";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "articles.yaml");
const OUTPUT_ROOT = path.join(ROOT, "pdfs");
const REPORT_PATH = path.join(ROOT, "archive-report.json");

function sanitizeSegment(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

async function readConfiguration() {
  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  const configuration = YAML.parse(raw);

  if (!configuration?.articles || !Array.isArray(configuration.articles)) {
    throw new Error(
      "articles.yaml must contain an 'articles' array.",
    );
  }

  return configuration.articles;
}

async function waitForPage(page) {
  await page.waitForLoadState("domcontentloaded");

  try {
    await page.waitForLoadState("networkidle", {
      timeout: 10000,
    });
  } catch {
    console.warn(
      "  Network did not become idle after 10 seconds. Continuing.",
    );
  }

  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ]);
      }

      const images = Array.from(document.images);

      const imageLoading = Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            image.addEventListener("load", resolve, {
              once: true,
            });

            image.addEventListener("error", resolve, {
              once: true,
            });
          });
        }),
      );

      await Promise.race([
        imageLoading,
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]);
    });
  } catch (error) {
    console.warn(
      `  Page resources did not fully load: ${error.message}`,
    );
  }

  await page.waitForTimeout(1000);
}

async function preparePageForPrinting(page) {
  await page.emulateMedia({
    media: "screen",
  });

  await page.addStyleTag({
    content: `
      @page {
        size: A4;
        margin: 18mm 14mm 20mm 14mm;
      }

      html {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }

      body {
        overflow: visible !important;
      }

      img,
      svg,
      video,
      pre,
      blockquote,
      table {
        max-width: 100% !important;
        break-inside: avoid;
      }

      pre {
        white-space: pre-wrap !important;
        overflow-wrap: anywhere !important;
      }

      a {
        overflow-wrap: anywhere;
      }

      nav,
      aside,
      [role="navigation"],
      [aria-label*="cookie" i],
      [class*="cookie" i],
      [id*="cookie" i],
      [class*="consent" i],
      [id*="consent" i] {
        display: none !important;
      }
    `,
  });
}

async function getHttpErrorDetails(page, response) {
  const pageTitle = await page
    .title()
    .catch(() => "");

  const bodyText = await page
    .locator("body")
    .innerText({
      timeout: 5000,
    })
    .catch(() => "");

  const details = [
    `HTTP ${response.status()} ${response.statusText()}`,
  ];

  if (pageTitle) {
    details.push(`Title: ${cleanText(pageTitle)}`);
  }

  if (bodyText) {
    details.push(
      `Body preview: ${cleanText(bodyText).slice(0, 300)}`,
    );
  }

  return details.join(" | ");
}

async function downloadDirectPdf(article) {
  const id = sanitizeSegment(
    article.id || article.title,
  );

  const category = sanitizeSegment(
    article.category || "uncategorized",
  );

  const outputDirectory = path.join(
    OUTPUT_ROOT,
    category,
  );

  const outputPath = path.join(
    outputDirectory,
    `${id}.pdf`,
  );

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  console.log(`Downloading PDF: ${article.title || id}`);
  console.log(`  URL: ${article.url}`);

  const response = await fetch(article.url);

  if (!response.ok) {
    const error = new Error(
      `HTTP ${response.status} ${response.statusText}`,
    );

    error.httpStatus = response.status;
    throw error;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error(
      `Expected a PDF but received: ${contentType || "unknown content type"}`,
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer(),
  );

  if (buffer.length < 10000) {
    throw new Error(
      `Downloaded PDF is suspiciously small: ${buffer.length} bytes.`,
    );
  }

  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(
      "Downloaded content does not have a valid PDF signature.",
    );
  }

  await fs.writeFile(outputPath, buffer);

  console.log(
    `  Created: ${path.relative(ROOT, outputPath)}`,
  );

  console.log(
    `  Size: ${(buffer.length / 1024).toFixed(1)} KB`,
  );

  return {
    id,
    title: article.title || id,
    url: article.url,
    category,
    output: path.relative(ROOT, outputPath),
    bytes: buffer.length,
    archivedAt: new Date().toISOString(),
    status: "success",
    captureMethod: "direct-download",
  };
}

async function archiveArticle(browser, article) {
  const id = sanitizeSegment(
    article.id || article.title,
  );

  const category = sanitizeSegment(
    article.category || "uncategorized",
  );

  if (!id || !article.url) {
    throw new Error(
      "Each article requires an id or title, and a URL.",
    );
  }

  const outputDirectory = path.join(
    OUTPUT_ROOT,
    category,
  );

  const outputPath = path.join(
    outputDirectory,
    `${id}.pdf`,
  );

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: {
      width: 1440,
      height: 1000,
    },
    locale: "en-US",
    colorScheme: "light",
  });

  const page = await context.newPage();

  console.log(
    `Archiving: ${article.title || id}`,
  );

  console.log(
    `  URL: ${article.url}`,
  );

  try {
    const response = await page.goto(article.url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    if (!response) {
      throw new Error(
        "No HTTP response was received.",
      );
    }

    if (!response.ok()) {
      const errorDetails = await getHttpErrorDetails(
        page,
        response,
      );

      const error = new Error(errorDetails);
      error.httpStatus = response.status();
      throw error;
    }

    await waitForPage(page);
    await preparePageForPrinting(page);

    const detectedTitle = await page
      .title()
      .catch(() => "");

    const title =
      article.title ||
      detectedTitle ||
      id;

    const sourceUrl = article.url;

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="
          width: 100%;
          padding: 0 14mm;
          color: #666;
          font-family: Arial, sans-serif;
          font-size: 8px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        ">
          ${escapeHtml(title)}
        </div>
      `,
      footerTemplate: `
        <div style="
          width: 100%;
          padding: 0 14mm;
          color: #777;
          font-family: Arial, sans-serif;
          font-size: 7px;
          display: flex;
          justify-content: space-between;
        ">
          <span>${escapeHtml(sourceUrl)}</span>
          <span>
            <span class="pageNumber"></span>
            /
            <span class="totalPages"></span>
          </span>
        </div>
      `,
      margin: {
        top: "22mm",
        right: "14mm",
        bottom: "24mm",
        left: "14mm",
      },
      tagged: true,
      outline: true,
    });

    const stats = await fs.stat(outputPath);

    if (stats.size < 10000) {
      await fs.rm(outputPath, {
        force: true,
      });

      throw new Error(
        `Generated PDF is suspiciously small: ${stats.size} bytes.`,
      );
    }

    console.log(
      `  Created: ${path.relative(ROOT, outputPath)}`,
    );

    console.log(
      `  Size: ${(stats.size / 1024).toFixed(1)} KB`,
    );

    return {
      id,
      title,
      url: article.url,
      category,
      output: path.relative(ROOT, outputPath),
      bytes: stats.size,
      archivedAt: new Date().toISOString(),
      status: "success",
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const articles = await readConfiguration();

  if (articles.length === 0) {
    console.log(
      "No articles found in articles.yaml.",
    );

    return;
  }

  await fs.mkdir(OUTPUT_ROOT, {
    recursive: true,
  });

  if (process.argv.includes("--refresh-manual-tasks")) {
    const previous = JSON.parse(await fs.readFile(REPORT_PATH, "utf8"));
    for (const issue of previous.filter(item => ["blocked", "failed"].includes(item.status))) {
      await logIssue(ROOT, issue);
    }
    await writeManualTasks(ROOT, articles, previous);
    console.log("Manual tasks refreshed from the last report and local PDFs (no downloads).");
    return;
  }

  let browser;

  const report = [];

  try {
    for (const article of articles) {
      try {
        const id = sanitizeSegment(
          article.id || article.title,
        );

        const category = sanitizeSegment(
          article.category || "uncategorized",
        );

        const outputPath = path.join(
          OUTPUT_ROOT,
          category,
          `${id}.pdf`,
        );

        const existingPdf = await inspectPdf(outputPath);
        if (existingPdf.exists && !existingPdf.valid) {
          throw new Error(`Existing file is not a complete PDF; inspect or replace it manually: ${path.relative(ROOT, outputPath)}. It was not overwritten.`);
        }
        const existingStats = existingPdf.stats;

        if (existingPdf.valid) {
          console.log(
            `Skipping (already archived): ${article.title || id}`,
          );

          console.log(
            `  File: ${path.relative(ROOT, outputPath)}`,
          );

          report.push({
            id,
            title: article.title || id,
            url: article.url,
            category,
            output: path.relative(ROOT, outputPath),
            bytes: existingStats.size,
            archivedAt: existingStats.mtime.toISOString(),
            status: "skipped",
          });

          continue;
        }

        const isDirectPdf = new URL(
          article.url,
        ).pathname.toLowerCase().endsWith(".pdf");

        if (!isDirectPdf && !browser) {
          browser = await chromium.launch({ headless: true });
        }
        const result = isDirectPdf
          ? await downloadDirectPdf(article)
          : await archiveArticle(browser, article);

        report.push(result);
      } catch (error) {
        const status =
          error.httpStatus === 401 ||
          error.httpStatus === 403
            ? "blocked"
            : "failed";

        console.error(
          `  ${status === "blocked" ? "Blocked" : "Failed"}: ${error.message}`,
        );

        const issue = {
          id: article.id || null,
          title: article.title || null,
          url: article.url || null,
          category: article.category || null,
          archivedAt: new Date().toISOString(),
          status,
          httpStatus: error.httpStatus || null,
          requiresManualCapture: true,
          error: error.message,
        };
        report.push(issue);
        await logIssue(ROOT, issue);
      }
    }
  } finally {
    await browser?.close();
  }

  await fs.writeFile(
    REPORT_PATH,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  await writeManualTasks(ROOT, articles, report);

  const successes = report.filter(
    (item) => item.status === "success",
  ).length;

  const blocked = report.filter(
    (item) => item.status === "blocked",
  ).length;

  const failures = report.filter(
    (item) => item.status === "failed",
  ).length;

  const skipped = report.filter(
    (item) => item.status === "skipped",
  ).length;

  console.log("");
  console.log(`Succeeded: ${successes}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Blocked: ${blocked}`);
  console.log(`Failed: ${failures}`);

  console.log(
    `Report: ${path.relative(ROOT, REPORT_PATH)}`,
  );

  if (blocked > 0 || failures > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await logIssue(ROOT, { status: "failed", scope: "run", archivedAt: new Date().toISOString(), error: error.message });
    await fs.appendFile(path.join(ROOT, "manual-tasks-todo-for-me.md"), `\n- [ ] Archive run could not finish: ${cleanText(error.message)}. Fix this issue and rerun npm run archive.\n`);
  } catch (logError) {
    console.error(`Could not save the issue: ${logError.message}`);
  }
  process.exitCode = 1;
});