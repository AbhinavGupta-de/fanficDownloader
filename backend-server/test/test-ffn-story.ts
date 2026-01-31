#!/usr/bin/env tsx
/**
 * Quick FFN parallel download test
 */

import { getMultiChapterContentParallel } from '../src/scrapers/ffn-parallel.scraper.js';
import { downloadMultiChapter } from '../src/services/multiChapter.service.js';
import fs from 'fs';
import path from 'path';

const URL = process.argv[2] || 'https://www.fanfiction.net/s/13384414/1/The-Dragon-Cub';
const FORMAT = (process.argv[3] as 'epub' | 'pdf') || 'epub';
const OUTPUT_DIR = path.join(process.cwd(), 'test', 'test-output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║         FFN Parallel Download Test                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`URL: ${URL}`);
  console.log(`Format: ${FORMAT.toUpperCase()}\n`);

  const startTime = Date.now();

  try {
    // First, let's see how many chapters and test the parallel scraper directly
    console.log('Fetching with parallel scraper...\n');

    const { content, metadata, stats } = await getMultiChapterContentParallel(URL, {
      onProgress: (completed, total) => {
        const pct = Math.round((completed / total) * 100);
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        process.stdout.write(`\r  [${bar}] ${completed}/${total} chapters (${pct}%)`);
      }
    });

    const scrapeDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n\n✓ Scraping complete in ${scrapeDuration}s`);
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Author: ${metadata.author}`);
    console.log(`  Stats:`, JSON.stringify(stats, null, 2));

    // Now generate the file
    console.log(`\nGenerating ${FORMAT.toUpperCase()}...`);
    const genStart = Date.now();

    const result = await downloadMultiChapter(URL, FORMAT);

    const genDuration = ((Date.now() - genStart) / 1000).toFixed(2);
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Save file
    const safeName = metadata.title.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeName}.${FORMAT}`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, result.buffer);

    console.log(`\n════════════════════════════════════════════════════`);
    console.log(`                    RESULTS`);
    console.log(`════════════════════════════════════════════════════\n`);
    console.log(`  Story: ${metadata.title}`);
    console.log(`  Chapters: ${(stats as any).totalChapters}`);
    console.log(`  Workers: ${(stats as any).workers}`);
    console.log(`  Scrape time: ${scrapeDuration}s`);
    console.log(`  ${FORMAT.toUpperCase()} generation: ${genDuration}s`);
    console.log(`  Total time: ${totalDuration}s`);
    console.log(`  File size: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Saved to: ${filepath}`);

    // Calculate speed
    const chapters = (stats as any).totalChapters;
    const chaptersPerSecond = (chapters / parseFloat(scrapeDuration)).toFixed(2);
    console.log(`\n  Speed: ${chaptersPerSecond} chapters/second`);

  } catch (error) {
    console.error('\n✗ FAILED:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
