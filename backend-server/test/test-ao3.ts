#!/usr/bin/env tsx
/**
 * Test script for AO3 large story and series downloads
 */

import { downloadMultiChapter } from '../src/services/multiChapter.service.js';
import { downloadSeries } from '../src/services/series.service.js';
import fs from 'fs';
import path from 'path';
import type { DownloadFormat } from '../src/types/index.js';

// Test URLs and names
const LARGE_STORY_URL = 'https://archiveofourown.org/works/27206147/chapters/66454418';
const LARGE_STORY_NAME = 'All_The_Young_Dudes';

const SERIES_URL = 'https://archiveofourown.org/series/2840566';
const SERIES_NAME = 'Drarry_Series';

const OUTPUT_DIR = path.join(process.cwd(), 'test', 'test-output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function testLargeStory(format: DownloadFormat) {
  console.log('\n════════════════════════════════════════════════════');
  console.log(`          AO3 Large Story Download Test (${format.toUpperCase()})`);
  console.log('════════════════════════════════════════════════════\n');
  console.log(`URL: ${LARGE_STORY_URL}`);
  console.log(`Format: ${format.toUpperCase()}\n`);

  const startTime = Date.now();

  try {
    console.log('Starting download...');
    const result = await downloadMultiChapter(LARGE_STORY_URL, format);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const filename = `${LARGE_STORY_NAME}.${format}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, result.buffer);

    console.log(`\n✓ SUCCESS (${duration}s)`);
    console.log(`  File size: ${result.buffer.length} bytes (${(result.buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  Content type: ${result.contentType}`);
    console.log(`  Saved to: ${filepath}`);

    return { success: true, duration, size: result.buffer.length };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✗ FAILED (${duration}s)`);
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, duration, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testSeries(format: DownloadFormat) {
  console.log('\n════════════════════════════════════════════════════');
  console.log(`          AO3 Series Download Test (${format.toUpperCase()})`);
  console.log('════════════════════════════════════════════════════\n');
  console.log(`URL: ${SERIES_URL}`);
  console.log(`Format: ${format.toUpperCase()}\n`);

  const startTime = Date.now();

  try {
    console.log('Starting series download...');
    const result = await downloadSeries(SERIES_URL, format);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const filename = `${SERIES_NAME}.${format}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, result.buffer);

    console.log(`\n✓ SUCCESS (${duration}s)`);
    console.log(`  File size: ${result.buffer.length} bytes (${(result.buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  Content type: ${result.contentType}`);
    console.log(`  Saved to: ${filepath}`);

    return { success: true, duration, size: result.buffer.length };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✗ FAILED (${duration}s)`);
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, duration, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        AO3 Story and Series Download Test          ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  const runStory = args.includes('--story') || args.includes('-s');
  const runSeries = args.includes('--series') || args.includes('-r');
  const runBoth = (!runStory && !runSeries) || args.includes('--both') || args.includes('-b');

  // Format options
  const pdfOnly = args.includes('--pdf');
  const epubOnly = args.includes('--epub');
  const formats: DownloadFormat[] = pdfOnly ? ['pdf'] : epubOnly ? ['epub'] : ['epub', 'pdf'];

  const results: Array<{ name: string; success: boolean; duration: string; size?: number; error?: string }> = [];

  for (const format of formats) {
    if (runStory || runBoth) {
      const result = await testLargeStory(format);
      results.push({ name: `AO3 Large Story (${format.toUpperCase()})`, ...result });
    }

    if (runSeries || runBoth) {
      const result = await testSeries(format);
      results.push({ name: `AO3 Series (${format.toUpperCase()})`, ...result });
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════');
  console.log('                    SUMMARY');
  console.log('════════════════════════════════════════════════════\n');

  for (const r of results) {
    const icon = r.success ? '✓' : '✗';
    const sizeStr = r.size ? ` - ${(r.size / 1024).toFixed(2)} KB` : '';
    console.log(`  ${icon} ${r.name} (${r.duration}s${sizeStr})`);
    if (!r.success && r.error) {
      console.log(`      Error: ${r.error}`);
    }
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nPassed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
