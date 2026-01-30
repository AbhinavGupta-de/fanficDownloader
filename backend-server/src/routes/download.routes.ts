/**
 * Download routes - synchronous endpoints that return files directly
 */

import { Router, Request, Response } from 'express';
import { downloadSingleChapter } from '../services/singleChapter.service.js';
import { downloadMultiChapter } from '../services/multiChapter.service.js';
import { downloadSeries } from '../services/series.service.js';
import { isSupportedSite } from '../scrapers/index.js';
import logger from '../utils/logger.js';
import type { DownloadRequestBody } from '../types/index.js';

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

  try {
    logger.info('Single chapter download request', { url, type });
    const result = await downloadSingleChapter(url, type);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
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

  try {
    logger.info('Multi-chapter download request', { url, type });
    const result = await downloadMultiChapter(url, type);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
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

  try {
    logger.info('Series download request', { url, type });
    const result = await downloadSeries(url, type);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Series download failed', { error: message, url });
    res.status(500).json({ error: message });
  }
});

export default router;
