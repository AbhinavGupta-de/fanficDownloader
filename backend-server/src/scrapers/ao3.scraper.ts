/**
 * AO3 (Archive of Our Own) Scraper
 * Handles content extraction from archiveofourown.org
 */

import type { Page } from 'puppeteer';
import type { StoryMetadata } from '../types/index.js';

const SELECTORS = {
  content: '#workskin',
  entireWorkLink: 'li.chapter.entire a',
  title: 'h2.title',
  author: 'a[rel="author"]',
  tosPrompt: '#tos_prompt',
  tosAgreeCheckbox: '#tos_agree',
  dataProcessingCheckbox: '#data_processing_agree',
  acceptTosButton: '#accept_tos',
  adultContentLink: 'a[href*="view_adult=true"]'
} as const;

/**
 * Handle TOS (Terms of Service) prompt that appears for EU users
 */
async function handleTosPrompt(page: Page): Promise<void> {
  try {
    const tosPrompt = await page.$(SELECTORS.tosPrompt);
    if (!tosPrompt) return;

    const isVisible = await page.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }, tosPrompt);

    if (!isVisible) return;

    // Check both checkboxes
    const tosCheckbox = await page.$(SELECTORS.tosAgreeCheckbox);
    const dataCheckbox = await page.$(SELECTORS.dataProcessingCheckbox);

    if (tosCheckbox) {
      await tosCheckbox.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (dataCheckbox) {
      await dataCheckbox.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Click accept button
    const acceptButton = await page.$(SELECTORS.acceptTosButton);
    if (acceptButton) {
      await acceptButton.click();
      // Wait for the modal to fade out
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    // TOS prompt handling is best-effort
  }
}

/**
 * Handle adult content warning page
 * AO3 shows a warning page for adult content that requires clicking through
 */
async function handleAdultContentWarning(page: Page): Promise<void> {
  try {
    const adultLink = await page.$(SELECTORS.adultContentLink);
    if (adultLink) {
      const href = await page.evaluate((el) => el.getAttribute('href'), adultLink);
      if (href) {
        // Navigate directly to the adult content URL
        const fullUrl = href.startsWith('http') ? href : `https://archiveofourown.org${href}`;
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      }
    }
  } catch (error) {
    // Adult content handling is best-effort
  }
}

/**
 * Handle all AO3 prompts (TOS, adult content)
 */
async function handleAllPrompts(page: Page): Promise<void> {
  // Handle adult content first (may navigate to new page)
  await handleAdultContentWarning(page);
  // Then handle TOS on the resulting page
  await handleTosPrompt(page);
}

/**
 * Extract single chapter content from page
 */
async function getSingleChapterContent(page: Page): Promise<string> {
  await handleAllPrompts(page);
  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
}

/**
 * Get multi-chapter content (entire work)
 */
async function getMultiChapterContent(page: Page, url: string): Promise<string> {
  await handleAllPrompts(page);

  // Check for "Entire Work" link
  const entireWorkLink = await page.$(SELECTORS.entireWorkLink);
  if (entireWorkLink) {
    const entireWorkUrl = await page.evaluate((link) => link.href, entireWorkLink);
    await page.goto(entireWorkUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await handleAllPrompts(page);
  }

  await page.waitForSelector(SELECTORS.content, { timeout: 30000 });
  return await page.$eval(SELECTORS.content, (div) => div.innerHTML);
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
    // Title not found, use default
  }

  try {
    author = await page.$eval(SELECTORS.author, (el) => el.textContent?.trim() || 'Unknown');
  } catch {
    // Author not found, use default
  }

  return { title, author };
}

export default {
  getSingleChapterContent,
  getMultiChapterContent,
  getMetadata,
  handleTosPrompt,
  handleAdultContentWarning,
  handleAllPrompts,
  SELECTORS
};
