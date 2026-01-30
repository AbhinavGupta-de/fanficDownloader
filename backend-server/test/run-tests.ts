#!/usr/bin/env tsx
/**
 * Config-based Test Runner
 *
 * Usage:
 *   npm run test              # Run all enabled tests
 *   npm run test:all          # Run all tests (ignore enabled flag)
 *   npm run test:direct       # Skip API, test scrapers directly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getScraper, detectSite, isSupportedSite } from '../src/scrapers/index.js';
import { puppeteer, getBrowserConfig } from '../src/utils/puppeteerConfig.js';
import type { StoryMetadata } from '../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'test-config.json');

interface TestConfig {
  name: string;
  url: string;
  type: 'pdf' | 'epub';
  mode: 'single' | 'multi';
  enabled: boolean;
  index?: number;
}

interface Settings {
  outputDir: string;
  apiUrl: string;
  runAllEnabled: boolean;
  stopOnFirstError: boolean;
}

interface Config {
  stories: TestConfig[];
  settings: Settings;
}

interface TestResult {
  success: boolean;
  duration: string;
  name?: string;
  filepath?: string;
  size?: number;
  error?: string;
}

interface DirectTestResult {
  content: string;
  metadata: StoryMetadata;
  contentLength: number;
}

// Parse CLI args
const args = process.argv.slice(2);
const runAll = args.includes('--all');
const directMode = args.includes('--direct');
const namePattern = args.find((_, i) => args[i - 1] === '--name');
const indexArg = args.find((_, i) => args[i - 1] === '--index');

// Load config
let config: Config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (error) {
  console.error('Error loading config file:', error instanceof Error ? error.message : 'Unknown error');
  console.error('Make sure test-config.json exists in the test directory');
  process.exit(1);
}

const { stories, settings } = config;

// Create output directory
const outputDir = path.resolve(__dirname, settings.outputDir || './test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Filter tests based on CLI args
function getTestsToRun(): TestConfig[] {
  let tests = stories;

  if (indexArg !== undefined) {
    const idx = parseInt(indexArg);
    if (idx >= 0 && idx < stories.length) {
      return [{ ...stories[idx], index: idx }];
    }
    console.error(`Invalid index: ${idx}. Valid range: 0-${stories.length - 1}`);
    process.exit(1);
  }

  if (namePattern) {
    tests = tests.filter(t => t.name.toLowerCase().includes(namePattern.toLowerCase()));
    if (tests.length === 0) {
      console.error(`No tests matching pattern: "${namePattern}"`);
      process.exit(1);
    }
  }

  if (!runAll) {
    tests = tests.filter(t => t.enabled);
  }

  return tests.map((t) => ({ ...t, index: stories.indexOf(t) }));
}

// Test via API endpoint
async function testViaApi(test: TestConfig): Promise<Buffer> {
  const endpoint = test.mode === 'multi' ? 'multi-chapter' : 'single-chapter';
  const apiEndpoint = `${settings.apiUrl}/api/download/${endpoint}`;

  console.log(`  Endpoint: ${apiEndpoint}`);
  console.log(`  Sending request...`);

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: test.url, type: test.type })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// Test directly (skip API)
async function testDirect(test: TestConfig): Promise<DirectTestResult> {
  if (!isSupportedSite(test.url)) {
    throw new Error('Unsupported site');
  }

  const site = detectSite(test.url);
  const scraper = getScraper(test.url);

  console.log(`  Site: ${site}`);
  console.log(`  Launching browser...`);

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`  Navigating to URL...`);
    await page.goto(test.url, { waitUntil: 'networkidle2', timeout: 60000 });

    let content: string;
    if (test.mode === 'multi') {
      console.log(`  Fetching multi-chapter content...`);
      content = await scraper.getMultiChapterContent(page, test.url);
    } else {
      console.log(`  Fetching single chapter content...`);
      content = await scraper.getSingleChapterContent(page);
    }

    // Get metadata
    let metadata: StoryMetadata = { title: 'Unknown', author: 'Unknown' };
    try {
      metadata = await scraper.getMetadata(page);
    } catch {
      /* ignore */
    }

    return {
      content,
      metadata,
      contentLength: content.length
    };
  } finally {
    await browser.close();
  }
}

// Run a single test
async function runTest(test: TestConfig, index: number): Promise<TestResult> {
  const testNum = index + 1;
  const startTime = Date.now();

  console.log('');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Test ${testNum}: ${test.name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  URL: ${test.url}`);
  console.log(`  Type: ${test.type}`);
  console.log(`  Mode: ${test.mode}`);
  console.log('');

  try {
    if (directMode) {
      // Direct scraper test
      const result = await testDirect(test);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('');
      console.log(`  ✓ SUCCESS (${duration}s)`);
      console.log(`  Content length: ${result.contentLength} chars`);
      console.log(`  Title: ${result.metadata.title}`);
      console.log(`  Author: ${result.metadata.author}`);

      // Save content preview
      const previewFile = path.join(outputDir, `${test.name.replace(/[^a-z0-9]/gi, '_')}_preview.txt`);
      const preview = result.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
      fs.writeFileSync(previewFile, `Title: ${result.metadata.title}\nAuthor: ${result.metadata.author}\n\nContent Preview:\n${preview}`);
      console.log(`  Preview saved: ${previewFile}`);

      return { success: true, duration };
    } else {
      // API test
      const buffer = await testViaApi(test);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const filename = `${test.name.replace(/[^a-z0-9]/gi, '_')}.${test.type}`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, buffer);

      console.log('');
      console.log(`  ✓ SUCCESS (${duration}s)`);
      console.log(`  File size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
      console.log(`  Saved: ${filepath}`);

      return { success: true, duration, filepath, size: buffer.length };
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log(`  ✗ FAILED (${duration}s)`);
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, duration, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Main
async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║         Fanfic Downloader Test Runner         ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log(`Mode: ${directMode ? 'Direct (scraper only)' : 'API (full download)'}`);
  console.log(`Config: ${configPath}`);
  console.log(`Output: ${outputDir}`);

  const tests = getTestsToRun();

  if (tests.length === 0) {
    console.log('');
    console.log('No tests to run. Enable some tests in test-config.json or use --all flag.');
    console.log('');
    console.log('Available tests:');
    stories.forEach((t, i) => {
      console.log(`  [${i}] ${t.enabled ? '✓' : '○'} ${t.name}`);
    });
    process.exit(0);
  }

  console.log(`Running ${tests.length} test(s)...`);

  const results: TestResult[] = [];
  for (let i = 0; i < tests.length; i++) {
    const result = await runTest(tests[i], i);
    results.push({ ...result, name: tests[i].name });

    if (!result.success && settings.stopOnFirstError) {
      console.log('');
      console.log('Stopping due to stopOnFirstError setting');
      break;
    }
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('                    SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✓' : '✗';
    console.log(`  ${icon} ${r.name} (${r.duration}s)`);
    if (!r.success) {
      console.log(`      Error: ${r.error}`);
    }
  });

  console.log('');
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
