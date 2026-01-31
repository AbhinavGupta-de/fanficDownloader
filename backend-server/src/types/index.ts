/**
 * Shared types for the Fanfic Downloader backend
 */

import type { Page, Browser } from 'puppeteer';

// Download types
export type DownloadFormat = 'pdf' | 'epub';
export type DownloadType = 'single-chapter' | 'multi-chapter' | 'series';
export type SupportedSite = 'ao3' | 'ffn';

// Download result
export interface DownloadResult {
  buffer: Buffer;
  contentType: string;
  metadata?: StoryMetadata & {
    storyId?: string;
    chapters?: number;
    url?: string;
  };
}

// Story metadata
export interface StoryMetadata {
  title: string;
  author: string;
}

// Scraper interface
export interface Scraper {
  getSingleChapterContent(page: Page): Promise<string>;
  getMultiChapterContent(page: Page, url: string): Promise<string>;
  getMetadata(page: Page): Promise<StoryMetadata>;
  SELECTORS: Record<string, string>;
}

// AO3 specific
export interface AO3Scraper extends Scraper {
  handleTosPrompt(page: Page): Promise<void>;
  handleAdultContentWarning(page: Page): Promise<void>;
  handleAllPrompts(page: Page): Promise<void>;
}

// FFN specific
export interface FFNScraper extends Scraper {
  getChapterCount(page: Page): Promise<number>;
  buildChapterUrl(url: string, chapterNum: number): string;
  getCurrentChapterFromUrl(url: string): number;
}

// Job queue types
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface JobData {
  url: string;
  type: DownloadFormat;
}

// File-based result (stored on disk, not RAM)
export interface JobFileResult {
  filePath: string;
  contentType: string;
  fileSize: number;
}

export interface Job {
  id: string;
  type: DownloadType;
  data: JobData;
  status: JobStatus;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  result: JobFileResult | null;  // Now stores file path, not buffer
  error: string | null;
  progress: number;
}

export interface JobInfo extends Omit<Job, 'result'> {
  hasResult: boolean;
}

export interface QueueStats {
  activeJobs: number;
  pendingJobs: number;
  maxConcurrent: number;
  totalJobs: number;
}

// Puppeteer config
export interface BrowserConfig {
  args: string[];
  headless: boolean | 'shell';
  defaultViewport: {
    width: number;
    height: number;
  };
  executablePath?: string;
}

export interface PdfOptions {
  format: 'A4';
  margin: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  displayHeaderFooter: boolean;
  headerTemplate: string;
  footerTemplate: string;
}

// Express request types
export interface DownloadRequestBody {
  url: string;
  type: DownloadFormat;
}

export interface JobRequestBody {
  url: string;
  type: DownloadType;
  format: DownloadFormat;
}
