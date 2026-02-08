/**
 * Service for downloading a single chapter from AO3 or FFN
 */

import { EPub } from 'epub-gen-memory';
import logger from '../utils/logger.js';
import { puppeteer, getBrowserConfig, getPdfOptions } from '../utils/puppeteerConfig.js';
import { getScraper, detectSite } from '../scrapers/index.js';
import type { DownloadFormat, DownloadResult, StoryMetadata } from '../types/index.js';

/**
 * Extract story ID from URL
 */
function extractStoryId(url: string): string | undefined {
  // AO3: /works/12345
  const ao3Match = url.match(/\/works\/(\d+)/);
  if (ao3Match) return ao3Match[1];
  // FFN: /s/12345/
  const ffnMatch = url.match(/\/s\/(\d+)/);
  if (ffnMatch) return ffnMatch[1];
  return undefined;
}

interface ChapterContentResult {
  content: string;
  metadata: StoryMetadata;
}

/**
 * Fetches chapter content from AO3 or FFN
 */
async function getChapterContent(url: string): Promise<ChapterContentResult> {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();
  const site = detectSite(url);
  const scraper = getScraper(url);

  try {
    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Get metadata
    const metadata = await scraper.getMetadata(page);

    const chapterContent = await scraper.getSingleChapterContent(page);
    logger.info('Chapter content fetched successfully', {
      site,
      contentLength: chapterContent.length,
      title: metadata.title
    });

    return { content: chapterContent, metadata };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch chapter content', { error: message, url, site });
    throw new Error(`Failed to fetch chapter content: ${message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generates PDF from HTML content
 */
async function generatePdf(content: string): Promise<Buffer> {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.setContent(content);
    logger.info('Content set for PDF generation');

    const pdfBuffer = await page.pdf(getPdfOptions());
    logger.info('PDF generated successfully', { size: pdfBuffer.length });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate PDF', { error: message });
    throw new Error(`Failed to generate PDF: ${message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generates EPUB from HTML content
 */
async function generateEpub(content: string, metadata: StoryMetadata): Promise<Buffer> {
  try {
    const epubGen = new EPub(
      { title: metadata.title, author: metadata.author },
      [{ title: 'Story', content }]
    );
    await epubGen.render();
    const epubBuffer = await epubGen.genEpub();

    logger.info('EPUB generated successfully', { size: epubBuffer.length });
    return epubBuffer;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate EPUB', { error: message });
    throw new Error(`Failed to generate EPUB: ${message}`);
  }
}

/**
 * Main service function to download a single chapter
 */
export async function downloadSingleChapter(url: string, type: DownloadFormat): Promise<DownloadResult> {
  logger.info('Starting single chapter download', { url, type });

  if (!url) {
    throw new Error('URL is required');
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    throw new Error('Type must be either "pdf" or "epub"');
  }

  const { content, metadata } = await getChapterContent(url);

  let buffer: Buffer;
  let contentType: string;

  if (type === 'pdf') {
    buffer = await generatePdf(content);
    contentType = 'application/pdf';
  } else {
    buffer = await generateEpub(content, metadata);
    contentType = 'application/epub+zip';
  }

  logger.info('Single chapter download completed successfully');
  return {
    buffer,
    contentType,
    metadata: {
      ...metadata,
      storyId: extractStoryId(url),
      chapters: 1,
      url
    }
  };
}
