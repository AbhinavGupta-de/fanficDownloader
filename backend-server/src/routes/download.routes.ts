/**
 * Download routes - synchronous endpoints that return files directly
 */

import { Router, Request, Response } from 'express';
import { downloadSingleChapter } from '../services/singleChapter.service.js';
import { downloadMultiChapter } from '../services/multiChapter.service.js';
import { downloadSeries } from '../services/series.service.js';
import { isSupportedSite, detectSite } from '../scrapers/index.js';
import logger from '../utils/logger.js';
import {
  trackDownloadStarted,
  trackDownloadCompleted,
  trackDownloadFailed,
  trackError
} from '../utils/analytics.js';
import type { DownloadRequestBody } from '../types/index.js';

// Helper to extract request info for analytics
function getReqInfo(req: Request) {
  return {
    ip: req.ip || undefined,
    headers: req.headers as Record<string, string | string[] | undefined>
  };
}

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Download single chapter
 * POST /api/download/single-chapter
 */
router.post('/download/single-chapter', async (req: Request<{}, {}, DownloadRequestBody>, res: Response) => {
  const { url, type } = req.body;
  const startTime = Date.now();
  const detectedSite = url ? detectSite(url) : null;
  const site = detectedSite || 'unknown';
  const reqInfo = getReqInfo(req);

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!isSupportedSite(url)) {
    res.status(400).json({ error: 'Unsupported site. Supported: archiveofourown.org, fanfiction.net' });
    return;
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    res.status(400).json({ error: 'Type must be either "pdf" or "epub"' });
    return;
  }

  // Track download started
  trackDownloadStarted({
    site: site as 'ao3' | 'ffn' | 'unknown',
    format: type,
    type: 'single-chapter',
    url
  }, reqInfo);

  try {
    logger.info('Single chapter download request', { url, type });
    const result = await downloadSingleChapter(url, type);

    // Track download completed with story metadata
    trackDownloadCompleted({
      site: site as 'ao3' | 'ffn' | 'unknown',
      format: type,
      type: 'single-chapter',
      url,
      duration_ms: Date.now() - startTime,
      file_size_bytes: result.buffer.length,
      success: true,
      story_id: result.metadata?.storyId,
      story_title: result.metadata?.title,
      story_author: result.metadata?.author,
      chapters: result.metadata?.chapters
    }, reqInfo);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    // Track download failed
    trackDownloadFailed({
      site: site as 'ao3' | 'ffn' | 'unknown',
      format: type,
      type: 'single-chapter',
      url,
      duration_ms: Date.now() - startTime,
      success: false,
      error: message
    }, reqInfo);

    // Track error details
    trackError({
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      error_message: message,
      error_stack: stack,
      endpoint: '/api/download/single-chapter',
      method: 'POST',
      site,
      url
    }, reqInfo);

    logger.error('Single chapter download failed', { error: message, url });
    res.status(500).json({ error: message });
  }
});

/**
 * Download multi-chapter (entire work)
 * POST /api/download/multi-chapter
 */
router.post('/download/multi-chapter', async (req: Request<{}, {}, DownloadRequestBody>, res: Response) => {
  const { url, type } = req.body;
  const startTime = Date.now();
  const detectedSite = url ? detectSite(url) : null;
  const site = detectedSite || 'unknown';
  const reqInfo = getReqInfo(req);

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!isSupportedSite(url)) {
    res.status(400).json({ error: 'Unsupported site. Supported: archiveofourown.org, fanfiction.net' });
    return;
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    res.status(400).json({ error: 'Type must be either "pdf" or "epub"' });
    return;
  }

  // Track download started
  trackDownloadStarted({
    site: site as 'ao3' | 'ffn' | 'unknown',
    format: type,
    type: 'multi-chapter',
    url
  }, reqInfo);

  try {
    logger.info('Multi-chapter download request', { url, type });
    const result = await downloadMultiChapter(url, type);

    // Track download completed with story metadata
    trackDownloadCompleted({
      site: site as 'ao3' | 'ffn' | 'unknown',
      format: type,
      type: 'multi-chapter',
      url,
      duration_ms: Date.now() - startTime,
      file_size_bytes: result.buffer.length,
      success: true,
      story_id: result.metadata?.storyId,
      story_title: result.metadata?.title,
      story_author: result.metadata?.author,
      chapters: result.metadata?.chapters
    }, reqInfo);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    // Track download failed
    trackDownloadFailed({
      site: site as 'ao3' | 'ffn' | 'unknown',
      format: type,
      type: 'multi-chapter',
      url,
      duration_ms: Date.now() - startTime,
      success: false,
      error: message
    }, reqInfo);

    // Track error details
    trackError({
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      error_message: message,
      error_stack: stack,
      endpoint: '/api/download/multi-chapter',
      method: 'POST',
      site,
      url
    }, reqInfo);

    logger.error('Multi-chapter download failed', { error: message, url });
    res.status(500).json({ error: message });
  }
});

/**
 * Download series
 * POST /api/download/series
 */
router.post('/download/series', async (req: Request<{}, {}, DownloadRequestBody>, res: Response) => {
  const { url, type } = req.body;
  const startTime = Date.now();
  const reqInfo = getReqInfo(req);

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!url.includes('archiveofourown.org')) {
    res.status(400).json({ error: 'Series download is only supported for AO3' });
    return;
  }

  if (!type || !['pdf', 'epub'].includes(type)) {
    res.status(400).json({ error: 'Type must be either "pdf" or "epub"' });
    return;
  }

  // Track download started
  trackDownloadStarted({
    site: 'ao3',
    format: type,
    type: 'series',
    url
  }, reqInfo);

  try {
    logger.info('Series download request', { url, type });
    const result = await downloadSeries(url, type);

    // Track download completed with story metadata
    trackDownloadCompleted({
      site: 'ao3',
      format: type,
      type: 'series',
      url,
      duration_ms: Date.now() - startTime,
      file_size_bytes: result.buffer.length,
      success: true,
      story_id: result.metadata?.storyId,
      story_title: result.metadata?.title,
      story_author: result.metadata?.author,
      chapters: result.metadata?.chapters
    }, reqInfo);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    // Track download failed
    trackDownloadFailed({
      site: 'ao3',
      format: type,
      type: 'series',
      url,
      duration_ms: Date.now() - startTime,
      success: false,
      error: message
    }, reqInfo);

    // Track error details
    trackError({
      error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      error_message: message,
      error_stack: stack,
      endpoint: '/api/download/series',
      method: 'POST',
      site: 'ao3',
      url
    }, reqInfo);

    logger.error('Series download failed', { error: message, url });
    res.status(500).json({ error: message });
  }
});

export default router;
