/**
 * FFN (FanFiction.Net) Scraper
 * Handles content extraction from fanfiction.net
 */

import type { Page } from 'puppeteer';
import type { StoryMetadata } from '../types/index.js';

const SELECTORS = {
  content: '#storytext',
  chapterSelect: 'select#chap_select',
  title: '#profile_top b.xcontrast_txt',
  author: '#profile_top a.xcontrast_txt'
} as const;

/**
 * Extract single chapter content from page
 */
async function getSingleChapterContent(page: Page): Promise<string> {
  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
}

/**
 * Get total chapter count from the chapter dropdown
 */
async function getChapterCount(page: Page): Promise<number> {
  try {
    const count = await page.$eval(SELECTORS.chapterSelect, (select) => {
      return (select as HTMLSelectElement).options.length;
    });
    return count;
  } catch {
    // No chapter select means single chapter story
    return 1;
  }
}

/**
 * Build chapter URL from base URL and chapter number
 * FFN URL format: /s/{storyId}/{chapterNum}/{title}
 */
function buildChapterUrl(url: string, chapterNum: number): string {
  return url.replace(/\/s\/(\d+)\/\d+\//, `/s/$1/${chapterNum}/`);
}

/**
 * Get the current chapter number from URL
 */
function getCurrentChapterFromUrl(url: string): number {
  const match = url.match(/\/s\/\d+\/(\d+)\//);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Navigate to a chapter using the dropdown selector
 */
async function navigateToChapterViaDropdown(page: Page, chapterNum: number): Promise<void> {
  await page.select(SELECTORS.chapterSelect, chapterNum.toString());
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
}

/**
 * Get multi-chapter content by iterating through all chapters
 * FFN has Cloudflare protection that may trigger on rapid requests.
 */
async function getMultiChapterContent(page: Page, url: string): Promise<string> {
  const chapters: string[] = [];
  const totalChapters = await getChapterCount(page);
  const currentChapter = getCurrentChapterFromUrl(url);

  for (let i = 1; i <= totalChapters; i++) {
    let retries = 3;
    let success = false;
    let needsNavigation = i !== currentChapter;

    while (retries > 0 && !success) {
      try {
        if (needsNavigation) {
          try {
            await navigateToChapterViaDropdown(page, i);
          } catch {
            const chapterUrl = buildChapterUrl(url, i);
            await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          }
        }

        await page.waitForSelector(SELECTORS.content, { timeout: 10000 });
        success = true;
      } catch {
        retries--;
        needsNavigation = true;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
        } else {
          throw new Error(`Failed to load chapter ${i} after retries. FFN may be rate limiting requests.`);
        }
      }
    }

    const content = await page.$eval(SELECTORS.content, (div) => div.innerHTML);
    chapters.push(`<div class="chapter"><h2>Chapter ${i}</h2>${content}</div>`);

    if (i < totalChapters) {
      const delay = 5000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return chapters.join('<div style="page-break-before: always;"></div>');
}

/**
 * Extract story metadata
 */
async function getMetadata(page: Page): Promise<StoryMetadata> {
  let title = 'Fanfic Story';
  let author = 'Unknown';

  try {
    title = await page.$eval(SELECTORS.title, (el) => el.textContent?.trim() || 'Fanfic Story');
  } catch {
    // Title not found
  }

  try {
    author = await page.$eval(SELECTORS.author, (el) => el.textContent?.trim() || 'Unknown');
  } catch {
    // Author not found
  }

  return { title, author };
}

export default {
  getSingleChapterContent,
  getChapterCount,
  getMultiChapterContent,
  getMetadata,
  buildChapterUrl,
  getCurrentChapterFromUrl,
  SELECTORS
};
