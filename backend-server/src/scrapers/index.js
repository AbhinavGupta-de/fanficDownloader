/**
 * Scraper Router
 * Detects site from URL and returns appropriate scraper
 */

import ao3Scraper from './ao3.scraper.js';
import ffnScraper from './ffn.scraper.js';

/**
 * Detect which site the URL belongs to
 * @param {string} url - The fanfic URL
 * @returns {'ao3' | 'ffn' | 'unknown'}
 */
export function detectSite(url) {
  if (url.includes('archiveofourown.org')) return 'ao3';
  if (url.includes('fanfiction.net')) return 'ffn';
  return 'unknown';
}

/**
 * Get the appropriate scraper for the given URL
 * @param {string} url - The fanfic URL
 * @returns {object} Site-specific scraper module
 * @throws {Error} If site is not supported
 */
export function getScraper(url) {
  const site = detectSite(url);

  switch (site) {
    case 'ao3':
      return ao3Scraper;
    case 'ffn':
      return ffnScraper;
    default:
      throw new Error(`Unsupported site. URL must be from archiveofourown.org or fanfiction.net`);
  }
}

/**
 * Check if a URL is from a supported site
 * @param {string} url - The fanfic URL
 * @returns {boolean}
 */
export function isSupportedSite(url) {
  return detectSite(url) !== 'unknown';
}

export { ao3Scraper, ffnScraper };
