/**
 * Service for downloading a single chapter from AO3
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
 * Fetches chapter content from AO3
 * @param {string} url - The AO3 chapter URL
 * @returns {Promise<string>} - The chapter HTML content
 */
async function getChapterContent(url) {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const chapterContent = await page.$eval('#workskin', (div) => div.innerHTML);
    logger.info('Chapter content fetched successfully', { contentLength: chapterContent.length });
    
    return chapterContent;
  } catch (error) {
    logger.error('Failed to fetch chapter content', { error: error.message, url });
    throw new Error(`Failed to fetch chapter content: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generates PDF from HTML content
 * @param {string} content - The HTML content
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(content) {
  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  try {
    await page.setCacheEnabled(false);
    await page.setContent(content);
    logger.info('Content set for PDF generation');

    const pdfBuffer = await page.pdf(getPdfOptions());
    logger.info('PDF generated successfully', { size: pdfBuffer.length });
    
    return pdfBuffer;
  } catch (error) {
    logger.error('Failed to generate PDF', { error: error.message });
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generates EPUB from HTML content
 * @param {string} content - The HTML content
 * @returns {Promise<Buffer>} - The EPUB buffer
 */
async function generateEpub(content) {
  try {
    const epubOptions = {
      title: 'Fanfic Story',
      author: 'Unknown',
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
    logger.info('EPUB generated successfully', { size: epubBuffer.length });

    // Clean up temporary file
    fs.unlinkSync(outputPath);
    
    return epubBuffer;
  } catch (error) {
    logger.error('Failed to generate EPUB', { error: error.message });
    throw new Error(`Failed to generate EPUB: ${error.message}`);
  }
}

/**
 * Main service function to download a single chapter
 * @param {string} url - The AO3 chapter URL
 * @param {string} type - The output type (pdf or epub)
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function downloadSingleChapter(url, type) {
  logger.info('Starting single chapter download', { url, type });

  if (!url) {
    throw new Error('URL is required');
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    throw new Error('Type must be either "pdf" or "epub"');
  }

  const chapterContent = await getChapterContent(url);

  let buffer;
  let contentType;

  if (type === 'pdf') {
    buffer = await generatePdf(chapterContent);
    contentType = 'application/pdf';
  } else {
    buffer = await generateEpub(chapterContent);
    contentType = 'application/epub+zip';
  }

  logger.info('Single chapter download completed successfully');
  return { buffer, contentType };
}
