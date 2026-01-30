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
import type { DownloadFormat, DownloadResult } from '../types/index.js';

const readFile = promisify(fs.readFile);

/**
 * Downloads entire story content from AO3 or FFN
 */
async function downloadStoryContent(url: string, type: DownloadFormat): Promise<DownloadResult> {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();
  const site = detectSite(url);
  const scraper = getScraper(url);

  try {
    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const storyContent = await scraper.getMultiChapterContent(page, url);
    logger.info('Story content fetched', { site, contentLength: storyContent.length });

    if (type === 'pdf') {
      await page.setContent(storyContent);
      const pdfBuffer = await page.pdf(getPdfOptions());
      logger.info('PDF generated for multi-chapter story', { site });

      return { buffer: Buffer.from(pdfBuffer), contentType: 'application/pdf' };
    } else if (type === 'epub') {
      const epubOptions = {
        title: 'Fanfic Story',
        author: 'Unknown',
        content: [
          {
            title: 'Story',
            data: storyContent
          }
        ]
      };

      const outputPath = path.join('/tmp', `story-${Date.now()}.epub`);
      await new Epub(epubOptions, outputPath).promise;

      const epubBuffer = await readFile(outputPath);
      logger.info('EPUB generated for multi-chapter story', { site });

      // Clean up temporary file
      fs.unlinkSync(outputPath);

      return { buffer: epubBuffer, contentType: 'application/epub+zip' };
    } else {
      throw new Error('Unsupported file type requested');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to download story', { error: message, url, site });
    throw new Error(`Failed to download story: ${message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Main service function to download multiple chapters
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

  const result = await downloadStoryContent(url, type);
  logger.info('Multi-chapter download completed successfully');

  return result;
}
