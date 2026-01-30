/**
 * Service for downloading series from AO3
 */

import Epub from 'epub-gen';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger.js';
import { puppeteer, getBrowserConfig, getPdfOptions } from '../utils/puppeteerConfig.js';
import ao3Scraper from '../scrapers/ao3.scraper.js';
import type { Page, Browser } from 'puppeteer';
import type { DownloadFormat, DownloadResult } from '../types/index.js';

const readFile = promisify(fs.readFile);

/**
 * Launches a puppeteer browser
 */
async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch(getBrowserConfig());
}

/**
 * Navigates to a page and handles AO3 prompts
 */
async function navigateToPage(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await ao3Scraper.handleAllPrompts(page);
}

/**
 * Fetches story content from a page
 */
async function fetchStoryContent(page: Page): Promise<string> {
  const entireWorkLink = await page.$('li.chapter.entire a');
  if (entireWorkLink) {
    const entireWorkUrl = await page.evaluate(
      (link) => (link as HTMLAnchorElement).href,
      entireWorkLink
    );
    logger.info('Navigating to entire work URL', { url: entireWorkUrl });
    await navigateToPage(page, entireWorkUrl);
  }

  const storyContent = await page.$eval('#workskin', (div) => div.innerHTML);
  logger.info('Fetched story content', { contentLength: storyContent.length });

  return storyContent;
}

/**
 * Handles single chapter page and recursively gets next stories
 */
async function handleSingleChapterPage(page: Page, url: string): Promise<string[]> {
  const storiesContent: string[] = [];
  await navigateToPage(page, url);

  const entireWorkLink = await page.$('li.chapter.entire a');
  if (entireWorkLink) {
    const entireWorkUrl = await page.evaluate(
      (link) => (link as HTMLAnchorElement).href,
      entireWorkLink
    );
    await navigateToPage(page, entireWorkUrl);
  }

  const storyContent = await page.$eval('#workskin', (div) => div.innerHTML);
  storiesContent.push(storyContent);

  const nextLink = await page.$('span.series a.next');
  if (nextLink) {
    const nextUrl = await page.evaluate((link) => (link as HTMLAnchorElement).href, nextLink);
    logger.info('Navigating to next story', { url: nextUrl });
    const nextStoryContent = await handleSingleChapterPage(page, nextUrl);
    storiesContent.push(...nextStoryContent);
  } else {
    logger.info('No more stories found in the series');
  }

  return storiesContent;
}

/**
 * Handles series page
 */
async function handleSeriesPage(page: Page, url: string): Promise<string[]> {
  const storiesContent: string[] = [];
  await navigateToPage(page, url);

  const firstStoryLink = await page.$('ul.series li.work h4.heading a');
  if (!firstStoryLink) {
    logger.info('No stories found in the series');
    return storiesContent;
  }

  const firstStoryUrl = await page.evaluate((link) => (link as HTMLAnchorElement).href, firstStoryLink);
  logger.info('Navigating to first story', { url: firstStoryUrl });

  const storyContent = await handleSingleChapterPage(page, firstStoryUrl);
  storiesContent.push(...storyContent);

  return storiesContent;
}

/**
 * Gets all series content
 */
async function getSeriesContent(url: string): Promise<string[]> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let storiesContent: string[] = [];

  try {
    if (url.includes('/series/')) {
      storiesContent = await handleSeriesPage(page, url);
    } else {
      storiesContent = await handleSingleChapterPage(page, url);
    }
  } finally {
    await browser.close();
  }

  return storiesContent;
}

/**
 * Generates combined PDF from content array
 */
async function generateCombinedPdf(contentArray: string[]): Promise<Buffer> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  try {
    const combinedContent = contentArray.join(
      '<div style="page-break-before: always;"></div>'
    );
    await page.setContent(combinedContent);
    logger.info('Content set for combined PDF generation');

    const pdfBuffer = await page.pdf(getPdfOptions());
    logger.info('Combined PDF generated successfully', { size: pdfBuffer.length });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates combined EPUB from content array
 */
async function generateCombinedEpub(contentArray: string[]): Promise<Buffer> {
  const epubOptions = {
    title: 'Fanfic Series',
    author: 'Unknown',
    content: contentArray.map((content, index) => ({
      title: `Story ${index + 1}`,
      data: content
    }))
  };

  const outputPath = path.join('/tmp', `series-${Date.now()}.epub`);
  await new Epub(epubOptions, outputPath).promise;

  const epubBuffer = await readFile(outputPath);
  logger.info('Combined EPUB generated successfully', { size: epubBuffer.length });

  // Clean up temporary file
  fs.unlinkSync(outputPath);

  return epubBuffer;
}

/**
 * Main service function to download a series
 */
export async function downloadSeries(url: string, type: DownloadFormat): Promise<DownloadResult> {
  logger.info('Starting series download', { url, type });

  if (!url) {
    throw new Error('URL is required');
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    throw new Error('Type must be either "pdf" or "epub"');
  }

  const seriesContent = await getSeriesContent(url);
  logger.info('Series content fetched', { storiesCount: seriesContent.length });

  let buffer: Buffer;
  let contentType: string;

  if (type === 'pdf') {
    buffer = await generateCombinedPdf(seriesContent);
    contentType = 'application/pdf';
  } else {
    buffer = await generateCombinedEpub(seriesContent);
    contentType = 'application/epub+zip';
  }

  logger.info('Series download completed successfully');
  return { buffer, contentType };
}
