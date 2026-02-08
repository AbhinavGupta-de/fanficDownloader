/**
 * Service for downloading series from AO3
 */

import { EPub } from 'epub-gen-memory';
import logger from '../utils/logger.js';
import { puppeteer, getBrowserConfig, getPdfOptions } from '../utils/puppeteerConfig.js';
import ao3Scraper from '../scrapers/ao3.scraper.js';
import type { Page, Browser } from 'puppeteer';
import type { DownloadFormat, DownloadResult } from '../types/index.js';

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
 * Fetches the full content of a single work (navigating to "Entire Work" view if needed)
 */
async function fetchWorkContent(page: Page, workUrl: string): Promise<string> {
  await navigateToPage(page, workUrl);

  // If multi-chapter, navigate to the "Entire Work" view
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
  logger.info('Fetched work content', { contentLength: storyContent.length });
  return storyContent;
}

/**
 * Gets all work URLs from a series listing page.
 * The page must already be navigated to the series URL.
 */
async function getWorkUrlsFromSeriesPage(page: Page): Promise<string[]> {
  const workUrls = await page.$$eval(
    'ul.series li.work h4.heading a',
    (links) => links
      .map((link) => (link as HTMLAnchorElement).href)
      .filter((href) => href.includes('/works/'))
  );
  return workUrls;
}

/**
 * Finds the series URL from a work page.
 * AO3 work pages link to their series in a list item like:
 *   <li>Part <strong>N</strong> of <a href="/series/12345">Series Name</a></li>
 */
async function findSeriesUrlFromWorkPage(page: Page): Promise<string | null> {
  try {
    const seriesUrl = await page.$eval(
      'a[href*="/series/"]',
      (link) => (link as HTMLAnchorElement).href
    );
    return seriesUrl || null;
  } catch {
    return null;
  }
}

interface SeriesMetadata {
  title: string;
  creator?: string;
  worksCount: number;
}

interface SeriesContentResult {
  content: string[];
  metadata: SeriesMetadata;
}

/**
 * Extract series ID from URL
 */
function extractSeriesId(url: string): string | undefined {
  const match = url.match(/\/series\/(\d+)/);
  return match?.[1];
}

/**
 * Gets series metadata from the series listing page.
 * The page must already be navigated to the series URL.
 */
async function getSeriesMetadata(page: Page): Promise<SeriesMetadata> {
  let title = 'Fanfic Series';
  let creator: string | undefined;

  try {
    // Use #main to avoid matching the TOS prompt heading
    title = await page.$eval('#main h2.heading', (el) => el.textContent?.trim() || 'Fanfic Series');
  } catch { /* use default */ }

  try {
    creator = await page.$eval('dl.series.meta dd a[rel="author"]', (el) => el.textContent?.trim());
  } catch { /* creator not found */ }

  return { title, creator, worksCount: 0 };
}

/**
 * Gets all series content by visiting each work in the series
 */
async function getSeriesContent(url: string): Promise<SeriesContentResult> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let storiesContent: string[] = [];
  let metadata: SeriesMetadata = { title: 'Fanfic Series', worksCount: 0 };

  try {
    let seriesUrl = url;

    // If user provided a work URL, find the series page from it
    if (!url.includes('/series/')) {
      logger.info('Work URL provided for series download, looking for series link', { url });
      await navigateToPage(page, url);
      const foundSeriesUrl = await findSeriesUrlFromWorkPage(page);

      if (!foundSeriesUrl) {
        throw new Error('This work does not appear to be part of a series');
      }

      logger.info('Found series URL from work page', { seriesUrl: foundSeriesUrl });
      seriesUrl = foundSeriesUrl;
    }

    // Navigate to the series listing page
    await navigateToPage(page, seriesUrl);
    metadata = await getSeriesMetadata(page);

    // Get all work URLs from the series page
    const workUrls = await getWorkUrlsFromSeriesPage(page);
    logger.info('Found works in series', { count: workUrls.length, urls: workUrls });

    if (workUrls.length === 0) {
      throw new Error('No works found in the series');
    }

    // Visit each work and fetch its content
    for (let i = 0; i < workUrls.length; i++) {
      logger.info(`Fetching work ${i + 1}/${workUrls.length}`, { url: workUrls[i] });
      const content = await fetchWorkContent(page, workUrls[i]);
      storiesContent.push(content);
    }

    metadata.worksCount = storiesContent.length;
  } finally {
    await browser.close();
  }

  return { content: storiesContent, metadata };
}

/**
 * Generates combined PDF from content array (optimized for large content)
 */
async function generateCombinedPdf(contentArray: string[]): Promise<Buffer> {
  // Launch browser with settings optimized for large PDF generation
  const browser = await puppeteer.launch({
    ...getBrowserConfig(),
    protocolTimeout: 600000, // 10 minute protocol timeout for large PDFs
    args: [
      ...(getBrowserConfig().args || []),
      '--disable-dev-shm-usage',
      '--no-zygote',
      '--single-process'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    // Set longer timeout for large content
    page.setDefaultTimeout(300000);

    const combinedContent = contentArray.join(
      '<div style="page-break-before: always;"></div>'
    );

    logger.info('Setting content for combined PDF generation', { contentLength: combinedContent.length });
    await page.setContent(combinedContent, { waitUntil: 'domcontentloaded', timeout: 300000 });

    logger.info('Generating combined PDF (this may take several minutes for large content)...');
    const pdfBuffer = await page.pdf({
      ...getPdfOptions(),
      timeout: 600000 // 10 minute timeout for PDF generation
    });

    logger.info('Combined PDF generated successfully', { size: pdfBuffer.length });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates combined EPUB from content array
 */
async function generateCombinedEpub(contentArray: string[], metadata: SeriesMetadata): Promise<Buffer> {
  const chapters = contentArray.map((content, index) => ({
    title: `Story ${index + 1}`,
    content,
  }));

  const epubGen = new EPub(
    { title: metadata.title, author: metadata.creator || 'Unknown' },
    chapters
  );
  await epubGen.render();
  const epubBuffer = await epubGen.genEpub();

  logger.info('Combined EPUB generated successfully', { size: epubBuffer.length });
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

  const { content: seriesContent, metadata } = await getSeriesContent(url);
  logger.info('Series content fetched', { storiesCount: seriesContent.length, title: metadata.title });

  let buffer: Buffer;
  let contentType: string;

  if (type === 'pdf') {
    buffer = await generateCombinedPdf(seriesContent);
    contentType = 'application/pdf';
  } else {
    buffer = await generateCombinedEpub(seriesContent, metadata);
    contentType = 'application/epub+zip';
  }

  logger.info('Series download completed successfully');
  return {
    buffer,
    contentType,
    metadata: {
      title: metadata.title,
      author: metadata.creator || 'Unknown',
      storyId: extractSeriesId(url),
      chapters: metadata.worksCount,
      url
    }
  };
}
