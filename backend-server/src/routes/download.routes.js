/**
 * Routes for download endpoints
 */
import express from 'express';
import {
  downloadSingleChapterHandler,
  downloadMultiChapterHandler,
  downloadSeriesHandler,
  healthCheckHandler
} from '../controllers/download.controller.js';

const router = express.Router();

// Health check
router.get('/health', healthCheckHandler);

// Download routes
router.post('/download/single-chapter', downloadSingleChapterHandler);
router.post('/download/multi-chapter', downloadMultiChapterHandler);
router.post('/download/series', downloadSeriesHandler);

export default router;
