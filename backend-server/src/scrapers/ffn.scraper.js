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
 * Get the current chapter number from URL
 * @param {string} url - Story URL
 * @returns {number} Current chapter number
 */
function getCurrentChapterFromUrl(url) {
  const match = url.match(/\/s\/\d+\/(\d+)\//);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Navigate to a chapter using the dropdown selector (more natural than URL navigation)
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @param {number} chapterNum - Chapter number to navigate to
 * @returns {Promise<void>}
 */
async function navigateToChapterViaDropdown(page, chapterNum) {
  // Select the chapter from dropdown - this triggers navigation
  await page.select(SELECTORS.chapterSelect, chapterNum.toString());
  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
}

/**
 * Get multi-chapter content by iterating through all chapters
 * FFN has Cloudflare protection that may trigger on rapid requests.
 * Uses dropdown navigation (more natural) and retry logic.
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @param {string} url - Story URL
 * @returns {Promise<string>} Combined HTML content of all chapters
 */
async function getMultiChapterContent(page, url) {
  const chapters = [];

  // Get chapter count from current page (already loaded)
  const totalChapters = await getChapterCount(page);

  // Check which chapter is currently loaded from URL
  const currentChapter = getCurrentChapterFromUrl(url);

  for (let i = 1; i <= totalChapters; i++) {
    // Retry logic for Cloudflare challenges
    let retries = 3;
    let success = false;
    // Only skip navigation if we're on the correct chapter already
    let needsNavigation = i !== currentChapter;

    while (retries > 0 && !success) {
      try {
        if (needsNavigation) {
          // Try dropdown navigation first (looks more natural to Cloudflare)
          try {
            await navigateToChapterViaDropdown(page, i);
          } catch (dropdownErr) {
            // Fallback to URL navigation if dropdown fails
            const chapterUrl = buildChapterUrl(url, i);
            await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          }
        }

        // Wait for content - if Cloudflare challenge, this will timeout
        await page.waitForSelector(SELECTORS.content, { timeout: 10000 });
        success = true;
      } catch (e) {
        retries--;
        needsNavigation = true; // Force navigation on retry
        if (retries > 0) {
          // Cloudflare challenge detected, wait much longer and retry
          await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
        } else {
          throw new Error(`Failed to load chapter ${i} after retries. FFN may be rate limiting requests.`);
        }
      }
    }

    const content = await page.$eval(SELECTORS.content, (div) => div.innerHTML);
    chapters.push(`<div class="chapter"><h2>Chapter ${i}</h2>${content}</div>`);

    // Delay between chapters to avoid triggering Cloudflare (5-8 seconds random)
    if (i < totalChapters) {
      const delay = 5000 + Math.random() * 3000;
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
