/**
 * Service for downloading series from AO3
 */
import puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger.js';
import { getBrowserConfig, getPdfOptions } from '../utils/puppeteerConfig.js';

const readFile = promisify(fs.readFile);

/**
 * Launches a puppeteer browser
 * @returns {Promise<Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch(getBrowserConfig());
}

/**
 * Navigates to a page
 * @param {Page} page - Puppeteer page
 * @param {string} url - URL to navigate to
 */
async function navigateToPage(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
}

/**
 * Fetches story content from a page
 * @param {Page} page - Puppeteer page
 * @returns {Promise<string>}
 */
async function fetchStoryContent(page) {
  const entireWorkLink = await page.$('li.chapter.entire a');
  if (entireWorkLink) {
    const entireWorkUrl = await page.evaluate(
      (link) => link.href,
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
 * @param {Page} page - Puppeteer page
 * @param {string} url - Story URL
 * @returns {Promise<string[]>}
 */
async function handleSingleChapterPage(page, url) {
  const storiesContent = [];
  await navigateToPage(page, url);

  const entireWorkLink = await page.$('li.chapter.entire a');
  if (entireWorkLink) {
    const entireWorkUrl = await page.evaluate(
      (link) => link.href,
      entireWorkLink
    );
    await navigateToPage(page, entireWorkUrl);
  }

  const storyContent = await page.$eval('#workskin', (div) => div.innerHTML);
  storiesContent.push(storyContent);
  
  const nextLink = await page.$('span.series a.next');
  if (nextLink) {
    const nextUrl = await page.evaluate((link) => link.href, nextLink);
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
 * @param {Page} page - Puppeteer page
 * @param {string} url - Series URL
 * @returns {Promise<string[]>}
 */
async function handleSeriesPage(page, url) {
  const storiesContent = [];
  await navigateToPage(page, url);

  const firstStoryLink = await page.$('ul.series li h4.heading a');
  if (!firstStoryLink) {
    logger.info('No stories found in the series');
    return storiesContent;
  }
  
  const firstStoryUrl = await page.evaluate((link) => link.href, firstStoryLink);
  logger.info('Navigating to first story', { url: firstStoryUrl });
  
  const storyContent = await handleSingleChapterPage(page, firstStoryUrl);
  storiesContent.push(...storyContent);

  return storiesContent;
}

/**
 * Gets all series content
 * @param {string} url - Series or story URL
 * @returns {Promise<string[]>}
 */
async function getSeriesContent(url) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  let storiesContent = [];

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
 * @param {string[]} contentArray - Array of HTML content
 * @returns {Promise<Buffer>}
 */
async function generateCombinedPdf(contentArray) {
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
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Generates combined EPUB from content array
 * @param {string[]} contentArray - Array of HTML content
 * @returns {Promise<Buffer>}
 */
async function generateCombinedEpub(contentArray) {
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
 * @param {string} url - The AO3 series URL
 * @param {string} type - The output type (pdf or epub)
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function downloadSeries(url, type) {
  logger.info('Starting series download', { url, type });

  if (!url) {
    throw new Error('URL is required');
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    throw new Error('Type must be either "pdf" or "epub"');
  }

  const seriesContent = await getSeriesContent(url);
  logger.info('Series content fetched', { storiesCount: seriesContent.length });

  let buffer;
  let contentType;

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
