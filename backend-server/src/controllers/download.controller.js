/**
 * Controller for handling download requests
 */
import { downloadSingleChapter } from '../services/singleChapter.service.js';
import { downloadMultiChapter } from '../services/multiChapter.service.js';
import { downloadSeries } from '../services/series.service.js';
import logger from '../utils/logger.js';

/**
 * Download a single chapter
 * @route POST /api/download/single-chapter
 */
export async function downloadSingleChapterHandler(req, res, next) {
  try {
    const { url, type } = req.body;
    
    logger.info('Single chapter download request received', { url, type });
    
    const { buffer, contentType } = await downloadSingleChapter(url, type);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="chapter.${type}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Download multiple chapters (entire work)
 * @route POST /api/download/multi-chapter
 */
export async function downloadMultiChapterHandler(req, res, next) {
  try {
    const { url, type } = req.body;
    
    logger.info('Multi-chapter download request received', { url, type });
    
    const { buffer, contentType } = await downloadMultiChapter(url, type);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="story.${type}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Download a series
 * @route POST /api/download/series
 */
export async function downloadSeriesHandler(req, res, next) {
  try {
    const { url, type } = req.body;
    
    logger.info('Series download request received', { url, type });
    
    const { buffer, contentType } = await downloadSeries(url, type);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="series.${type}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Health check endpoint
 * @route GET /api/health
 */
export function healthCheckHandler(req, res) {
  res.json({
    success: true,
    message: 'Fanfic Downloader API is running',
    timestamp: new Date().toISOString()
  });
}
