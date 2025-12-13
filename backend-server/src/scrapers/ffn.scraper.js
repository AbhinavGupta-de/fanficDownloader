/**
 * FFN (FanFiction.Net) Scraper
 * Handles content extraction from fanfiction.net
 */

const SELECTORS = {
  content: '#storytext',
  chapterSelect: 'select#chap_select',
  title: '#profile_top b.xcontrast_txt',
  author: '#profile_top a.xcontrast_txt'
};

/**
 * Extract single chapter content from page
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<string>} HTML content
 */
async function getSingleChapterContent(page) {
  // Wait for content element to appear (handles dynamic loading)
  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
}

/**
 * Get total chapter count from the chapter dropdown
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<number>} Number of chapters (1 if single chapter)
 */
async function getChapterCount(page) {
  try {
    // FFN has two chapter dropdowns (top and bottom), use the first one
    const count = await page.$eval(SELECTORS.chapterSelect, (select) => {
      return select.options.length;
    });
    return count;
  } catch (e) {
    // No chapter select means single chapter story
    return 1;
  }
}

/**
 * Build chapter URL from base URL and chapter number
 * FFN URL format: /s/{storyId}/{chapterNum}/{title}
 * @param {string} url - Base story URL
 * @param {number} chapterNum - Chapter number (1-indexed)
 * @returns {string} Full chapter URL
 */
function buildChapterUrl(url, chapterNum) {
  // URL format: https://www.fanfiction.net/s/12345/1/Story-Title
  // Replace the chapter number in the URL
  return url.replace(/\/s\/(\d+)\/\d+\//, `/s/$1/${chapterNum}/`);
}

/**
 * Get multi-chapter content by iterating through all chapters
 * FFN has Cloudflare protection that may trigger on rapid requests.
 * Uses longer delays and retry logic to work around this.
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @param {string} url - Story URL
 * @returns {Promise<string>} Combined HTML content of all chapters
 */
async function getMultiChapterContent(page, url) {
  const chapters = [];

  // Get chapter count from current page (already loaded)
  const totalChapters = await getChapterCount(page);

  for (let i = 1; i <= totalChapters; i++) {
    const chapterUrl = buildChapterUrl(url, i);

    // Retry logic for Cloudflare challenges
    let retries = 3;
    let success = false;
    let needsNavigation = i > 1; // First chapter is already loaded

    while (retries > 0 && !success) {
      try {
        if (needsNavigation) {
          // Navigate with longer delay to avoid Cloudflare
          await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        }

        // Wait for content - if Cloudflare challenge, this will timeout
        await page.waitForSelector(SELECTORS.content, { timeout: 10000 });
        success = true;
      } catch (e) {
        retries--;
        needsNavigation = true; // Force navigation on retry
        if (retries > 0) {
          // Cloudflare challenge detected, wait longer and retry
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw new Error(`Failed to load chapter ${i} after retries. FFN may be rate limiting requests.`);
        }
      }
    }

    const content = await page.$eval(SELECTORS.content, (div) => div.innerHTML);
    chapters.push(`<div class="chapter"><h2>Chapter ${i}</h2>${content}</div>`);

    // Delay between chapters to avoid triggering Cloudflare (1.5-2.5 seconds random)
    if (i < totalChapters) {
      const delay = 1500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Join chapters with page breaks
  return chapters.join('<div style="page-break-before: always;"></div>');
}

/**
 * Extract story metadata
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<{title: string, author: string}>}
 */
async function getMetadata(page) {
  let title = 'Fanfic Story';
  let author = 'Unknown';

  try {
    title = await page.$eval(SELECTORS.title, (el) => el.textContent.trim());
  } catch (e) {
    // Title not found, use default
  }

  try {
    author = await page.$eval(SELECTORS.author, (el) => el.textContent.trim());
  } catch (e) {
    // Author not found, use default
  }

  return { title, author };
}

export default {
  getSingleChapterContent,
  getChapterCount,
  getMultiChapterContent,
  getMetadata,
  buildChapterUrl,
  SELECTORS
};
