#!/usr/bin/env tsx
/**
 * Test script to compare sequential vs parallel FFN scraping
 */

import ffnParallel from '../src/scrapers/ffn-parallel.scraper.js';
const { getMultiChapterContentParallel } = ffnParallel;

// Export calculateWorkerDistribution for testing
function calculateWorkerDistribution(
  totalChapters: number,
  chaptersPerWorker: number,
  maxWorkers: number
): Array<{ start: number; end: number }> {
  const numWorkers = Math.min(
    Math.ceil(totalChapters / chaptersPerWorker),
    maxWorkers
  );

  const baseChaptersPerWorker = Math.floor(totalChapters / numWorkers);
  const remainder = totalChapters % numWorkers;

  const distribution: Array<{ start: number; end: number }> = [];
  let currentChapter = 1;

  for (let i = 0; i < numWorkers; i++) {
    const chapterCount = baseChaptersPerWorker + (i < remainder ? 1 : 0);
    const endChapter = currentChapter + chapterCount - 1;

    distribution.push({
      start: currentChapter,
      end: endChapter
    });

    currentChapter = endChapter + 1;
  }

  return distribution;
}
import ffnScraper from '../src/scrapers/ffn.scraper.js';
import { puppeteer, getBrowserConfig } from '../src/utils/puppeteerConfig.js';

const TEST_URL = 'https://www.fanfiction.net/s/14523797/1/The-Dark-Lord-Harry-Potter';

async function testWorkerDistribution() {
  console.log('\n=== Worker Distribution Tests ===\n');

  const testCases = [
    { chapters: 5, perWorker: 10, maxWorkers: 3 },
    { chapters: 10, perWorker: 10, maxWorkers: 3 },
    { chapters: 25, perWorker: 10, maxWorkers: 3 },
    { chapters: 63, perWorker: 10, maxWorkers: 3 },
    { chapters: 100, perWorker: 10, maxWorkers: 3 },
    { chapters: 100, perWorker: 20, maxWorkers: 5 },
  ];

  for (const tc of testCases) {
    const dist = calculateWorkerDistribution(tc.chapters, tc.perWorker, tc.maxWorkers);
    console.log(`Chapters: ${tc.chapters}, PerWorker: ${tc.perWorker}, MaxWorkers: ${tc.maxWorkers}`);
    console.log(`  -> ${dist.length} workers: ${dist.map(d => `[${d.start}-${d.end}]`).join(', ')}`);
  }
}

async function testSequentialScraper() {
  console.log('\n=== Sequential Scraper Test ===\n');

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const startTime = Date.now();

  try {
    console.log('Navigating to URL...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Fetching multi-chapter content sequentially...');
    const content = await ffnScraper.getMultiChapterContent(page, TEST_URL);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`\nSequential scraper completed:`);
    console.log(`  Content length: ${content.length} chars`);
    console.log(`  Duration: ${duration.toFixed(2)}s`);

    return { duration, contentLength: content.length };
  } finally {
    await browser.close();
  }
}

async function testParallelScraper() {
  console.log('\n=== Parallel Scraper Test ===\n');

  const startTime = Date.now();

  const { content, metadata, stats } = await getMultiChapterContentParallel(TEST_URL, {
    chaptersPerWorker: 10,
    maxWorkers: 3,
    onProgress: (completed, total) => {
      const pct = Math.round((completed / total) * 100);
      process.stdout.write(`\r  Progress: ${completed}/${total} (${pct}%)`);
    }
  });

  const duration = (Date.now() - startTime) / 1000;

  console.log(`\n\nParallel scraper completed:`);
  console.log(`  Title: ${metadata.title}`);
  console.log(`  Author: ${metadata.author}`);
  console.log(`  Content length: ${content.length} chars`);
  console.log(`  Duration: ${duration.toFixed(2)}s`);
  console.log(`  Stats:`, JSON.stringify(stats, null, 2));

  return { duration, contentLength: content.length, stats };
}

async function runComparison() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║    FFN Sequential vs Parallel Scraper Comparison   ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\nTest URL: ${TEST_URL}`);

  // Test worker distribution logic
  testWorkerDistribution();

  // Ask user which test to run
  const args = process.argv.slice(2);
  const runSequential = args.includes('--sequential') || args.includes('-s');
  const runParallel = args.includes('--parallel') || args.includes('-p');
  const runBoth = args.includes('--both') || args.includes('-b') || (!runSequential && !runParallel);

  let sequentialResult: { duration: number; contentLength: number } | null = null;
  let parallelResult: { duration: number; contentLength: number; stats: object } | null = null;

  if (runSequential || runBoth) {
    try {
      sequentialResult = await testSequentialScraper();
    } catch (error) {
      console.error('Sequential test failed:', error instanceof Error ? error.message : error);
    }
  }

  if (runParallel || runBoth) {
    try {
      parallelResult = await testParallelScraper();
    } catch (error) {
      console.error('Parallel test failed:', error instanceof Error ? error.message : error);
    }
  }

  // Print comparison
  if (sequentialResult && parallelResult) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('                    COMPARISON');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`Sequential: ${sequentialResult.duration.toFixed(2)}s`);
    console.log(`Parallel:   ${parallelResult.duration.toFixed(2)}s`);

    const speedup = sequentialResult.duration / parallelResult.duration;
    console.log(`\nSpeedup: ${speedup.toFixed(2)}x faster with parallel`);

    const timeSaved = sequentialResult.duration - parallelResult.duration;
    console.log(`Time saved: ${timeSaved.toFixed(2)}s`);
  }
}

// Run
runComparison().catch(console.error);
