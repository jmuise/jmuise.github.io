// Renders the résumé's "print" output format (a self-contained, ATS-plain
// HTML page — see layouts/_default/single.print.html) to a PDF using
// headless Chromium. Run after `hugo build`, before the Pages artifact is
// uploaded (see .github/workflows/hugo.yml).
//
// Usage: node scripts/render-resume-pdf.mjs <path-to-print-html> <output-pdf-path>

import { readFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const [, , printHtmlPath, outputPdfPath] = process.argv;

if (!printHtmlPath || !outputPdfPath) {
  console.error(
    "usage: node scripts/render-resume-pdf.mjs <print-html-path> <output-pdf-path>"
  );
  process.exit(1);
}

// Fail loudly if the input is missing rather than letting Chromium silently
// render a blank/error page into a "successful" PDF.
await readFile(printHtmlPath, "utf8");

// --no-sandbox is standard practice for headless Chromium in CI containers
// (GitHub Actions runners and this devcontainer both restrict the user
// namespaces Chromium's sandbox needs). Safe here because the only content
// ever rendered is this repo's own build output, not third-party input.
const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve(printHtmlPath)}`, {
    waitUntil: "networkidle0",
  });
  await page.pdf({
    path: outputPdfPath,
    format: "Letter",
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    printBackground: true,
  });
} finally {
  await browser.close();
}

console.log(`wrote ${outputPdfPath}`);
