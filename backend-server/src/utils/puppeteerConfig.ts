/**
 * Puppeteer configuration for browser launch
 * Uses puppeteer-extra with stealth plugin for better anti-detection
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { PdfOptions } from '../types/index.js';
import type { PuppeteerLaunchOptions } from 'puppeteer';

// Add stealth plugin to avoid detection (Cloudflare, etc.)
puppeteer.use(StealthPlugin());

export { puppeteer };

export const getBrowserConfig = (): PuppeteerLaunchOptions => {
  const config: PuppeteerLaunchOptions = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    headless: process.env.HEADLESS === 'false' ? false : true,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  };

  // Only set executablePath if explicitly provided (for Docker/CI environments)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return config;
};

export const getPdfOptions = (): PdfOptions => {
  return {
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; display: flex;">Downloaded using fanfic downloader</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  };
};
