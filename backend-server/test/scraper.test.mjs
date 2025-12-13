#!/usr/bin/env node
/**
 * Scraper Test - Tests the scraper modules directly
 *
 * Usage:
 *   node test/scraper.test.mjs <url>
 *   node test/scraper.test.mjs <url> --multi
 *
 * Examples:
 *   node test/scraper.test.mjs https://archiveofourown.org/works/25830817
 *   node test/scraper.test.mjs https://www.fanfiction.net/s/14523797/1/The-Dark-Lord-Harry-Potter
 *   node test/scraper.test.mjs https://www.fanfiction.net/s/14523797/1/The-Dark-Lord-Harry-Potter --multi
 */

import puppeteer from 'puppeteer';
import { getScraper, detectSite, isSupportedSite } from '../src/scrapers/index.js';
import { getBrowserConfig } from '../src/utils/puppeteerConfig.js';

const url = process.argv[2];
const isMultiChapter = process.argv.includes('--multi');

if (!url) {
  console.log('Scraper Test');
  console.log('============');
  console.log('');
  console.log('Usage:');
  console.log('  node test/scraper.test.mjs <url>');
  console.log('  node test/scraper.test.mjs <url> --multi');
  console.log('');
  console.log('Examples:');
  console.log('  # AO3 single chapter');
  console.log('  node test/scraper.test.mjs https://archiveofourown.org/works/25830817');
  console.log('');
  console.log('  # FFN single chapter');
  console.log('  node test/scraper.test.mjs https://www.fanfiction.net/s/14523797/1/The-Dark-Lord-Harry-Potter');
  console.log('');
  console.log('  # FFN multi-chapter');
  console.log('  node test/scraper.test.mjs https://www.fanfiction.net/s/14523797/1/The-Dark-Lord-Harry-Potter --multi');
  process.exit(1);
}

async function testScraper() {
  console.log('');
  console.log('=== Scraper Test ===');
  console.log('');
  console.log('URL:', url);
  console.log('Mode:', isMultiChapter ? 'Multi-Chapter' : 'Single Chapter');

  // Check if site is supported
  if (!isSupportedSite(url)) {
    console.error('ERROR: Unsupported site');
    console.error('Supported sites: archiveofourown.org, fanfiction.net');
    process.exit(1);
  }

  const site = detectSite(url);
  console.log('Detected Site:', site);

  const scraper = getScraper(url);
  console.log('Scraper loaded:', site === 'ao3' ? 'AO3 Scraper' : 'FFN Scraper');
  console.log('');
  console.log('Launching browser...');

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    console.log('Navigating to URL...');
    await page.setCacheEnabled(false);
    // Set user agent to avoid bot detection (especially for FFN)
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded successfully');
    console.log('');

    let content;
    if (isMultiChapter) {
      console.log('Fetching multi-chapter content...');
      if (site === 'ffn') {
        const chapterCount = await scraper.getChapterCount(page);
        console.log('Chapter count:', chapterCount);
      }
      content = await scraper.getMultiChapterContent(page, url);
    } else {
      console.log('Fetching single chapter content...');
      content = await scraper.getSingleChapterContent(page);
    }

    console.log('');
    console.log('=== Results ===');
    console.log('');
    console.log('Content length:', content.length, 'characters');
    console.log('');
    console.log('Preview (first 500 chars):');
    console.log('---');
    console.log(content.substring(0, 500).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log('---');
    console.log('');

    // Try to get metadata
    try {
      const metadata = await scraper.getMetadata(page);
      console.log('Metadata:');
      console.log('  Title:', metadata.title);
      console.log('  Author:', metadata.author);
    } catch (e) {
      console.log('Metadata: Could not extract');
    }

    console.log('');
    console.log('SCRAPER TEST PASSED');

  } catch (error) {
    console.error('');
    console.error('SCRAPER TEST FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testScraper();
