/**
 * Service for downloading multiple chapters (entire work) from AO3 or FFN
 */

import Epub from 'epub-gen';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger.js';
import { puppeteer, getBrowserConfig, getPdfOptions } from '../utils/puppeteerConfig.js';
import { getScraper, detectSite } from '../scrapers/index.js';
import { getMultiChapterContentParallel } from '../scrapers/ffn-parallel.scraper.js';
import type { DownloadFormat, DownloadResult } from '../types/index.js';

const readFile = promisify(fs.readFile);

// Configuration for parallel FFN downloads
const FFN_PARALLEL_CONFIG = {
  chaptersPerWorker: parseInt(process.env.FFN_CHAPTERS_PER_WORKER || '10'),
  maxWorkers: parseInt(process.env.FFN_MAX_WORKERS || '3')
};

/**
 * Extract story ID from AO3 URL
 */
function extractAO3StoryId(url: string): string | undefined {
  const match = url.match(/\/works\/(\d+)/);
  return match?.[1];
}

/**
 * Downloads entire story content from AO3 (sequential - uses "Entire Work" link)
 */
async function downloadAO3StoryContent(url: string, type: DownloadFormat): Promise<DownloadResult> {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();
  const scraper = getScraper(url);

  try {
    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Get metadata before navigating to entire work
    const metadata = await scraper.getMetadata(page);

    const storyContent = await scraper.getMultiChapterContent(page, url);
    logger.info('AO3 story content fetched', { contentLength: storyContent.length });

    const result = await generateOutput(storyContent, metadata.title, metadata.author, type, page);
    // Add metadata for analytics
    result.metadata = {
      ...metadata,
      storyId: extractAO3StoryId(url),
      url
    };
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to download AO3 story', { error: message, url });
    throw new Error(`Failed to download story: ${message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Extract story ID from FFN URL
 */
function extractFFNStoryId(url: string): string | undefined {
  const match = url.match(/\/s\/(\d+)/);
  return match?.[1];
}

/**
 * Downloads entire story content from FFN using parallel workers
 */
async function downloadFFNStoryContent(url: string, type: DownloadFormat): Promise<DownloadResult> {
  try {
    const { content, metadata, stats } = await getMultiChapterContentParallel(url, {
      chaptersPerWorker: FFN_PARALLEL_CONFIG.chaptersPerWorker,
      maxWorkers: FFN_PARALLEL_CONFIG.maxWorkers,
      onProgress: (completed, total) => {
        logger.debug(`FFN download progress: ${completed}/${total}`);
      }
    });

    logger.info('FFN parallel download complete', { stats });

    // Generate output
    const browser = await puppeteer.launch(getBrowserConfig());
    const page = await browser.newPage();

    try {
      const result = await generateOutput(content, metadata.title, metadata.author, type, page);
      // Add metadata for analytics
      result.metadata = {
        ...metadata,
        storyId: extractFFNStoryId(url),
        chapters: (stats as { totalChapters?: number }).totalChapters,
        url
      };
      return result;
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to download FFN story', { error: message, url });
    throw new Error(`Failed to download story: ${message}`);
  }
}

/**
 * Generate PDF from content with a fresh browser (handles large content better)
 */
async function generatePdf(content: string): Promise<Buffer> {
  // Launch a fresh browser with settings optimized for large PDF generation
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

    // Set longer timeout for large content
    page.setDefaultTimeout(300000);

    logger.info('Setting content for PDF generation', { contentLength: content.length });
    await page.setContent(content, { waitUntil: 'domcontentloaded', timeout: 300000 });

    logger.info('Generating PDF (this may take several minutes for large content)...');
    const pdfBuffer = await page.pdf({
      ...getPdfOptions(),
      timeout: 600000 // 10 minute timeout for PDF generation
    });

    logger.info('PDF generated', { size: pdfBuffer.length });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generate PDF or EPUB from content
 */
async function generateOutput(
  content: string,
  title: string,
  author: string,
  type: DownloadFormat,
  page: import('puppeteer').Page
): Promise<DownloadResult> {
  if (type === 'pdf') {
    // Close the existing page/browser and use dedicated PDF generator
    const pdfBuffer = await generatePdf(content);
    return { buffer: pdfBuffer, contentType: 'application/pdf' };
  } else {
    const epubOptions = {
      title,
      author,
      content: [
        {
          title: 'Story',
          data: content
        }
      ]
    };

    const outputPath = path.join('/tmp', `story-${Date.now()}.epub`);
    await new Epub(epubOptions, outputPath).promise;

    const epubBuffer = await readFile(outputPath);
    logger.info('EPUB generated', { size: epubBuffer.length });

    fs.unlinkSync(outputPath);

    return { buffer: epubBuffer, contentType: 'application/epub+zip' };
  }
}

/**
 * Main service function to download multiple chapters
 * Uses parallel downloading for FFN, sequential for AO3
 */
export async function downloadMultiChapter(url: string, type: DownloadFormat): Promise<DownloadResult> {
  const site = detectSite(url);
  logger.info('Starting multi-chapter download', { url, type, site });

  if (!url) {
    throw new Error('URL is required');
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    throw new Error('Type must be either "pdf" or "epub"');
  }

  let result: DownloadResult;

  if (site === 'ffn') {
    // Use parallel downloading for FFN
    logger.info('Using parallel scraper for FFN');
    result = await downloadFFNStoryContent(url, type);
  } else {
    // Use sequential downloading for AO3 (already optimized with "Entire Work" link)
    logger.info('Using sequential scraper for AO3');
    result = await downloadAO3StoryContent(url, type);
  }

  logger.info('Multi-chapter download completed successfully');
  return result;
}
