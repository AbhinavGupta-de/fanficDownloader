/**
 * AO3 (Archive of Our Own) Scraper
 * Handles content extraction from archiveofourown.org
 */

const SELECTORS = {
  content: '#workskin',
  entireWorkLink: 'li.chapter.entire a',
  title: 'h2.title',
  author: 'a[rel="author"]',
  tosPrompt: '#tos_prompt',
  tosAgreeCheckbox: '#tos_agree',
  dataProcessingCheckbox: '#data_processing_agree',
  acceptTosButton: '#accept_tos'
};

const BASE_URL = 'https://archiveofourown.org';

/**
 * Handle TOS/GDPR consent prompt if it appears
 * AO3 shows a consent dialog for logged-out users that must be accepted
 * @param {import('puppeteer').Page} page - Puppeteer page
 */
async function handleTosPrompt(page) {
  try {
    // Check if TOS prompt is visible (wait briefly for fade in)
    const tosPrompt = await page.$(SELECTORS.tosPrompt);
    if (!tosPrompt) return;

    // Wait for the TOS prompt to potentially fade in (1.5 second delay in AO3 JS)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if the prompt is actually visible (not hidden)
    const isVisible = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    }, SELECTORS.tosPrompt);

    if (!isVisible) return;

    // Wait for checkboxes to be available and click them
    await page.waitForSelector(SELECTORS.tosAgreeCheckbox, { timeout: 5000 });
    await page.click(SELECTORS.tosAgreeCheckbox);
    await page.click(SELECTORS.dataProcessingCheckbox);

    // Wait for button to be enabled and click it
    await page.waitForFunction(
      (selector) => !document.querySelector(selector)?.disabled,
      { timeout: 5000 },
      SELECTORS.acceptTosButton
    );
    await page.click(SELECTORS.acceptTosButton);

    // Wait for the prompt to fade out
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (e) {
    // TOS prompt handling failed, but we'll continue and try to get content anyway
    // This could happen if the page structure changes
  }
}

/**
 * Handle adult content warning page
 * AO3 shows an intermediate page for works marked as adult content
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<boolean>} true if adult warning was handled (page navigated)
 */
async function handleAdultContentWarning(page) {
  try {
    // Check if we're on an adult content warning page
    const adultWarning = await page.$('h2.landmark.heading');
    if (!adultWarning) return false;

    const headerText = await page.$eval('h2.landmark.heading', el => el.textContent);
    if (!headerText.includes('Adult Content Warning')) return false;

    // Get the continue link href and navigate directly
    const continueLink = await page.$('a[href*="view_adult=true"]');
    if (continueLink) {
      const href = await page.evaluate(el => el.getAttribute('href'), continueLink);
      if (href) {
        // Navigate directly to the URL (more reliable than clicking)
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        return true; // Page navigated, TOS may appear again
      }
    }
  } catch (e) {
    // Adult warning handling failed, continue anyway
  }
  return false;
}

/**
 * Handle all AO3 prompts (TOS and adult content warnings)
 * This should be called after any navigation to AO3 pages
 * @param {import('puppeteer').Page} page - Puppeteer page
 */
async function handleAllPrompts(page) {
  // Check for adult content warning FIRST (it appears immediately)
  // Handle adult content warning (may navigate to new page)
  const navigated = await handleAdultContentWarning(page);

  // If we navigated through adult warning, we need to handle TOS on new page
  // If we didn't navigate, we still need to handle TOS on current page
  await handleTosPrompt(page);
}

/**
 * Extract single chapter content from page
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<string>} HTML content
 */
async function getSingleChapterContent(page) {
  // Handle all prompts (TOS and adult content)
  await handleAllPrompts(page);

  // Wait for content element to appear (handles dynamic loading)
  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
}

/**
 * Get the "Entire Work" URL if it exists (for multi-chapter stories)
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @returns {Promise<string|null>} Full URL to entire work or null
 */
async function getEntireWorkUrl(page) {
  const entireWorkLink = await page.$(SELECTORS.entireWorkLink);
  if (!entireWorkLink) {
    return null;
  }

  const href = await page.evaluate(
    (link) => link.getAttribute('href'),
    entireWorkLink
  );

  return href ? `${BASE_URL}${href}` : null;
}

/**
 * Get multi-chapter content (navigates to entire work if available)
 * @param {import('puppeteer').Page} page - Puppeteer page
 * @param {string} url - Original URL
 * @returns {Promise<string>} HTML content of entire story
 */
async function getMultiChapterContent(page, url) {
  // Handle all prompts first (TOS and adult content)
  await handleAllPrompts(page);

  // Check if there's an "Entire Work" link
  const entireWorkUrl = await getEntireWorkUrl(page);

  if (entireWorkUrl) {
    await page.goto(entireWorkUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    // Handle any prompts on the new page as well
    await handleAllPrompts(page);
  }

  // Wait for content element and return
  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
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
  getEntireWorkUrl,
  getMultiChapterContent,
  getMetadata,
  handleAllPrompts,
  SELECTORS,
  BASE_URL
};
