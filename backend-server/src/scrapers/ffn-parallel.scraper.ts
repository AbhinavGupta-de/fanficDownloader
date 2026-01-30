/**
 * FFN Parallel Scraper
 * Downloads multiple chapters in parallel using worker browsers
 */

import type { Page, Browser } from 'puppeteer';
import { puppeteer, getBrowserConfig } from '../utils/puppeteerConfig.js';
import logger from '../utils/logger.js';
import { trackScraperMetrics, trackCloudflareBlock } from '../utils/analytics.js';
import type { StoryMetadata } from '../types/index.js';

// Configuration
const DEFAULT_CHAPTERS_PER_WORKER = 15; // More chapters per worker = fewer workers
const MAX_WORKERS = 2; // Reduced to avoid Cloudflare blocking
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 8000; // Longer delay for retries
const INTER_CHAPTER_DELAY_MS = 4000; // Longer delay between chapters
const WORKER_STAGGER_DELAY_MS = 3000; // Stagger worker starts to avoid simultaneous requests

const SELECTORS = {
  content: '#storytext',
  chapterSelect: 'select#chap_select',
  title: '#profile_top b.xcontrast_txt',
  author: '#profile_top a.xcontrast_txt'
} as const;

interface ChapterResult {
  chapterNum: number;
  content: string;
  success: boolean;
  error?: string;
}

interface WorkerResult {
  workerId: number;
  chapters: ChapterResult[];
  startChapter: number;
  endChapter: number;
}

interface ParallelScraperConfig {
  chaptersPerWorker?: number;
  maxWorkers?: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Build chapter URL from base URL and chapter number
 */
function buildChapterUrl(url: string, chapterNum: number): string {
  return url.replace(/\/s\/(\d+)\/\d+\//, `/s/$1/${chapterNum}/`);
}

/**
 * Get chapter count from the page
 */
async function getChapterCount(page: Page): Promise<number> {
  try {
    const count = await page.$eval(SELECTORS.chapterSelect, (select) => {
      return (select as HTMLSelectElement).options.length;
    });
    return count;
  } catch {
    return 1;
  }
}

/**
 * Get metadata from the page
 */
async function getMetadata(page: Page): Promise<StoryMetadata> {
  let title = 'Fanfic Story';
  let author = 'Unknown';

  try {
    title = await page.$eval(SELECTORS.title, (el) => el.textContent?.trim() || 'Fanfic Story');
  } catch { /* use default */ }

  try {
    author = await page.$eval(SELECTORS.author, (el) => el.textContent?.trim() || 'Unknown');
  } catch { /* use default */ }

  return { title, author };
}

/**
 * Fetch a single chapter with retries
 */
async function fetchChapterWithRetry(
  page: Page,
  url: string,
  chapterNum: number,
  workerId: number
): Promise<ChapterResult> {
  const chapterUrl = buildChapterUrl(url, chapterNum);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector(SELECTORS.content, { timeout: 15000 });

      const content = await page.$eval(SELECTORS.content, (div) => div.innerHTML);

      logger.debug(`Worker ${workerId}: Chapter ${chapterNum} fetched successfully`, { attempt });

      return {
        chapterNum,
        content: `<div class="chapter"><h2>Chapter ${chapterNum}</h2>${content}</div>`,
        success: true
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Worker ${workerId}: Chapter ${chapterNum} attempt ${attempt} failed`, { error: errorMsg });

      // Track potential Cloudflare block
      if (errorMsg.includes('Waiting for selector') || errorMsg.includes('timeout')) {
        trackCloudflareBlock('ffn', chapterNum, attempt);
      }

      if (attempt < RETRY_ATTEMPTS) {
        // Exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(1.5, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return {
          chapterNum,
          content: '',
          success: false,
          error: errorMsg
        };
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  return { chapterNum, content: '', success: false, error: 'Max retries exceeded' };
}

/**
 * Worker function - fetches a range of chapters
 */
async function workerFetchChapters(
  workerId: number,
  baseUrl: string,
  startChapter: number,
  endChapter: number,
  onChapterComplete?: (chapterNum: number) => void
): Promise<WorkerResult> {
  logger.info(`Worker ${workerId} starting`, { startChapter, endChapter });

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const chapters: ChapterResult[] = [];

  try {
    for (let chapterNum = startChapter; chapterNum <= endChapter; chapterNum++) {
      const result = await fetchChapterWithRetry(page, baseUrl, chapterNum, workerId);
      chapters.push(result);

      onChapterComplete?.(chapterNum);

      // Delay between chapters (except for the last one)
      if (chapterNum < endChapter) {
        // Add some randomness to avoid detection patterns
        const delay = INTER_CHAPTER_DELAY_MS + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    await browser.close();
  }

  const successCount = chapters.filter(c => c.success).length;
  logger.info(`Worker ${workerId} completed`, {
    startChapter,
    endChapter,
    successCount,
    failCount: chapters.length - successCount
  });

  return {
    workerId,
    chapters,
    startChapter,
    endChapter
  };
}

/**
 * Calculate optimal worker distribution
 */
function calculateWorkerDistribution(
  totalChapters: number,
  chaptersPerWorker: number,
  maxWorkers: number
): Array<{ start: number; end: number }> {
  // Calculate number of workers needed
  const numWorkers = Math.min(
    Math.ceil(totalChapters / chaptersPerWorker),
    maxWorkers
  );

  // Distribute chapters evenly
  const baseChaptersPerWorker = Math.floor(totalChapters / numWorkers);
  const remainder = totalChapters % numWorkers;

  const distribution: Array<{ start: number; end: number }> = [];
  let currentChapter = 1;

  for (let i = 0; i < numWorkers; i++) {
    // Give extra chapters to first 'remainder' workers
    const chapterCount = baseChaptersPerWorker + (i < remainder ? 1 : 0);
    const endChapter = currentChapter + chapterCount - 1;

    distribution.push({
      start: currentChapter,
      end: endChapter
    });

    currentChapter = endChapter + 1;
  }

  return distribution;
}

/**
 * Main parallel scraper function
 */
export async function getMultiChapterContentParallel(
  url: string,
  config: ParallelScraperConfig = {}
): Promise<{ content: string; metadata: StoryMetadata; stats: object }> {
  const {
    chaptersPerWorker = DEFAULT_CHAPTERS_PER_WORKER,
    maxWorkers = MAX_WORKERS,
    onProgress
  } = config;

  const startTime = Date.now();

  // First, get the chapter count and metadata
  logger.info('Parallel scraper: Getting story info', { url });

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let totalChapters: number;
  let metadata: StoryMetadata;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    totalChapters = await getChapterCount(page);
    metadata = await getMetadata(page);
  } finally {
    await browser.close();
  }

  logger.info('Parallel scraper: Story info retrieved', {
    title: metadata.title,
    totalChapters
  });

  // For single chapter stories, just fetch it directly
  if (totalChapters === 1) {
    const result = await workerFetchChapters(0, url, 1, 1);
    return {
      content: result.chapters[0]?.content || '',
      metadata,
      stats: {
        totalChapters: 1,
        workers: 1,
        duration: Date.now() - startTime,
        failedChapters: result.chapters[0]?.success ? 0 : 1
      }
    };
  }

  // Calculate worker distribution
  const distribution = calculateWorkerDistribution(totalChapters, chaptersPerWorker, maxWorkers);

  logger.info('Parallel scraper: Worker distribution calculated', {
    totalChapters,
    numWorkers: distribution.length,
    distribution
  });

  // Track progress
  let completedChapters = 0;
  const onChapterComplete = (chapterNum: number) => {
    completedChapters++;
    onProgress?.(completedChapters, totalChapters);
    logger.debug(`Progress: ${completedChapters}/${totalChapters} chapters`);
  };

  // Launch workers with staggered start times to avoid simultaneous Cloudflare hits
  const workerPromises: Promise<WorkerResult>[] = [];

  for (let i = 0; i < distribution.length; i++) {
    const range = distribution[i];

    // Stagger worker starts
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, WORKER_STAGGER_DELAY_MS));
    }

    workerPromises.push(
      workerFetchChapters(i, url, range.start, range.end, onChapterComplete)
    );
  }

  // Wait for all workers to complete
  const workerResults = await Promise.all(workerPromises);

  // Retry failed chapters with a single browser (more reliable)
  const failedChapterNums = workerResults
    .flatMap(r => r.chapters)
    .filter(c => !c.success)
    .map(c => c.chapterNum);

  if (failedChapterNums.length > 0) {
    logger.info('Retrying failed chapters', { count: failedChapterNums.length, chapters: failedChapterNums });

    // Wait before retry to let Cloudflare cool down
    await new Promise(resolve => setTimeout(resolve, 10000));

    const retryResults = await retryFailedChapters(url, failedChapterNums);

    // Update results with retry results
    for (const retry of retryResults) {
      for (const workerResult of workerResults) {
        const idx = workerResult.chapters.findIndex(c => c.chapterNum === retry.chapterNum);
        if (idx !== -1 && retry.success) {
          workerResult.chapters[idx] = retry;
        }
      }
    }
  }

  // Combine results in order
  const allChapters: ChapterResult[] = [];
  for (const result of workerResults) {
    allChapters.push(...result.chapters);
  }

  // Sort by chapter number (should already be in order, but be safe)
  allChapters.sort((a, b) => a.chapterNum - b.chapterNum);

  // Check for failed chapters
  const failedChapters = allChapters.filter(c => !c.success);
  if (failedChapters.length > 0) {
    logger.warn('Some chapters failed to download', {
      failed: failedChapters.map(c => c.chapterNum),
      errors: failedChapters.map(c => c.error)
    });
  }

  // Combine content
  const combinedContent = allChapters
    .filter(c => c.success)
    .map(c => c.content)
    .join('<div style="page-break-before: always;"></div>');

  const duration = Date.now() - startTime;

  const stats = {
    totalChapters,
    successfulChapters: allChapters.filter(c => c.success).length,
    failedChapters: failedChapters.length,
    workers: distribution.length,
    duration,
    durationPerChapter: Math.round(duration / totalChapters),
    chaptersPerWorker: distribution.map((d, i) => ({
      worker: i,
      chapters: `${d.start}-${d.end}`,
      count: d.end - d.start + 1
    }))
  };

  logger.info('Parallel scraper: Complete', stats);

  // Track scraper metrics
  trackScraperMetrics({
    site: 'ffn',
    total_chapters: totalChapters,
    successful_chapters: stats.successfulChapters,
    failed_chapters: stats.failedChapters,
    workers: stats.workers,
    duration_ms: duration,
    retried_chapters: failedChapterNums.length
  });

  return {
    content: combinedContent,
    metadata,
    stats
  };
}

/**
 * Retry failed chapters (can be called if some chapters failed)
 */
export async function retryFailedChapters(
  url: string,
  failedChapterNumbers: number[]
): Promise<ChapterResult[]> {
  if (failedChapterNumbers.length === 0) {
    return [];
  }

  logger.info('Retrying failed chapters', { chapters: failedChapterNumbers });

  const browser = await puppeteer.launch(getBrowserConfig());
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const results: ChapterResult[] = [];

  try {
    for (const chapterNum of failedChapterNumbers) {
      // Longer delay for retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * 2));
      const result = await fetchChapterWithRetry(page, url, chapterNum, -1);
      results.push(result);
    }
  } finally {
    await browser.close();
  }

  return results;
}

export default {
  getMultiChapterContentParallel,
  retryFailedChapters,
  calculateWorkerDistribution,
  SELECTORS
};
