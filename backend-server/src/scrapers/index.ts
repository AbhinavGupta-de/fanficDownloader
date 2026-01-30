/**
 * Scraper factory - returns the appropriate scraper based on URL
 */

import ao3Scraper from './ao3.scraper.js';
import ffnScraper from './ffn.scraper.js';
import type { SupportedSite } from '../types/index.js';

type ScraperModule = typeof ao3Scraper | typeof ffnScraper;

/**
 * Detect which site the URL belongs to
 */
export function detectSite(url: string): SupportedSite | null {
  if (url.includes('archiveofourown.org')) {
    return 'ao3';
  }
  if (url.includes('fanfiction.net')) {
    return 'ffn';
  }
  return null;
}

/**
 * Check if URL is from a supported site
 */
export function isSupportedSite(url: string): boolean {
  return detectSite(url) !== null;
}

/**
 * Get the appropriate scraper for the URL
 */
export function getScraper(url: string): ScraperModule {
  const site = detectSite(url);

  switch (site) {
    case 'ao3':
      return ao3Scraper;
    case 'ffn':
      return ffnScraper;
    default:
      throw new Error(`Unsupported site: ${url}`);
  }
}

export { ao3Scraper, ffnScraper };
