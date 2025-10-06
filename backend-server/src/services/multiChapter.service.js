/**
 * Service for downloading multiple chapters (entire work) from AO3
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
 * Fetches HTML content from a page
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>} - The HTML content
 */
async function getHtmlContent(url) {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const content = await page.$eval('#workskin', (div) => div.innerHTML);
    
    return content;
  } finally {
    await browser.close();
  }
}

/**
 * Downloads entire story content
 * @param {string} url - The story URL
 * @param {string} type - The output type (pdf or epub)
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
async function downloadStoryContent(url, type) {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Check if there's an "Entire Work" link and navigate to it
    const entireWorkLink = await page.$('li.chapter.entire a');
    if (entireWorkLink) {
      const entireWorkUrl = await page.evaluate(
        (link) => link.getAttribute('href'),
        entireWorkLink
      );
      
      if (!entireWorkUrl) {
        throw new Error('Entire Work link does not have a valid URL');
      }
      
      logger.info('Navigating to entire work', { url: entireWorkUrl });
      await page.goto(`https://archiveofourown.org${entireWorkUrl}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
    }

    const storyContent = await page.$eval('#workskin', (div) => div.innerHTML);
    logger.info('Story content fetched', { contentLength: storyContent.length });

    if (type === 'pdf') {
      await page.setContent(storyContent);

      const pdfBuffer = await page.pdf(getPdfOptions());
      logger.info('PDF generated for multi-chapter story');

      return { buffer: pdfBuffer, contentType: 'application/pdf' };
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
      logger.info('EPUB generated for multi-chapter story');

      // Clean up temporary file
      fs.unlinkSync(outputPath);

      return { buffer: epubBuffer, contentType: 'application/epub+zip' };
    } else {
      throw new Error('Unsupported file type requested');
    }
  } catch (error) {
    logger.error('Failed to download story', { error: error.message, url });
    throw new Error(`Failed to download story: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Main service function to download multiple chapters
 * @param {string} url - The AO3 story URL
 * @param {string} type - The output type (pdf or epub)
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function downloadMultiChapter(url, type) {
  logger.info('Starting multi-chapter download', { url, type });

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
