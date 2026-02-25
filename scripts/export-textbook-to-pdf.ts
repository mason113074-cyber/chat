/**
 * 將教科書 Markdown 轉成 PDF（使用專案內 Playwright + marked）
 * 執行：npx tsx scripts/export-textbook-to-pdf.ts
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import { chromium } from '@playwright/test';

const ROOT = join(__dirname, '..');
const MD_PATH = join(ROOT, 'docs', 'CustomerAIPro_SaaS_教科書.md');
const PDF_PATH = join(ROOT, 'docs', 'CustomerAIPro_SaaS_教科書.pdf');
const TEMP_HTML = join(ROOT, 'docs', '_textbook-export-temp.html');

async function main() {
  if (!existsSync(MD_PATH)) {
    console.error('找不到教科書檔案:', MD_PATH);
    process.exit(1);
  }

  console.log('讀取 Markdown...');
  const md = readFileSync(MD_PATH, 'utf-8');

  console.log('轉成 HTML...');
  const bodyHtml = (await marked.parse(md)) as string;
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CustomerAIPro SaaS 教科書</title>
  <style>
    body { font-family: "Microsoft JhengHei", "Segoe UI", sans-serif; line-height: 1.6; max-width: 800px; margin: 2em auto; padding: 0 2em; color: #333; }
    h1 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.4em; margin-top: 1.2em; }
    h3 { font-size: 1.15em; margin-top: 1em; }
    pre, code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { padding: 1em; overflow-x: auto; }
    pre code { padding: 0; background: none; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 0.5em 0.75em; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  writeFileSync(TEMP_HTML, html, 'utf-8');
  console.log('啟動 Chromium 產出 PDF...');

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + TEMP_HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.pdf({
      path: PDF_PATH,
      format: 'A4',
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      printBackground: true,
    });
    console.log('已產出:', PDF_PATH);
  } finally {
    await browser.close();
    if (existsSync(TEMP_HTML)) unlinkSync(TEMP_HTML);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
