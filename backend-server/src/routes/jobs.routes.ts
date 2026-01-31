/**
 * Async Job Routes
 *
 * These endpoints use a queue system for handling downloads asynchronously.
 * Files are stored on disk (not RAM) and deleted after download.
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import jobQueue, { JobStatus } from '../utils/jobQueue.js';
import { isSupportedSite } from '../scrapers/index.js';
import logger from '../utils/logger.js';
import type { JobRequestBody, DownloadType, DownloadFormat } from '../types/index.js';

const router = Router();

interface JobParams {
  id: string;
}

/**
 * POST /api/jobs
 * Create a new download job
 */
router.post('/', (req: Request<{}, {}, JobRequestBody>, res: Response) => {
  const { url, type, format } = req.body;

  // Validation
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!isSupportedSite(url)) {
    res.status(400).json({ error: 'Unsupported site. Supported: archiveofourown.org, fanfiction.net' });
    return;
  }

  const validTypes: DownloadType[] = ['single-chapter', 'multi-chapter', 'series'];
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({ error: 'Type must be one of: single-chapter, multi-chapter, series' });
    return;
  }

  const validFormats: DownloadFormat[] = ['pdf', 'epub'];
  if (!format || !validFormats.includes(format)) {
    res.status(400).json({ error: 'Format must be either "pdf" or "epub"' });
    return;
  }

  // Create job
  const jobId = jobQueue.createJob(type, { url, type: format });
  const job = jobQueue.getJob(jobId);

  logger.info('Download job created via API', { jobId, url, type, format });

  res.status(202).json({
    jobId,
    status: job?.status,
    message: 'Job queued for processing'
  });
});

/**
 * GET /api/jobs/stats
 * Get queue statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
  const stats = jobQueue.getQueueStats();
  res.json(stats);
});

/**
 * GET /api/jobs/:id
 * Get job status
 */
router.get('/:id', (req: Request<JobParams>, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  // Add queue position for pending jobs
  const response: Record<string, unknown> = { ...job };
  if (job.status === JobStatus.PENDING) {
    const stats = jobQueue.getQueueStats();
    response.queuePosition = stats.pendingJobs;
  }

  res.json(response);
});

/**
 * GET /api/jobs/:id/result
 * Stream file from disk and delete after sending
 */
router.get('/:id/result', (req: Request<JobParams>, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.status !== JobStatus.COMPLETED) {
    res.status(400).json({
      error: 'Job not completed',
      status: job.status,
      ...(job.error && { message: job.error })
    });
    return;
  }

  const result = jobQueue.getJobResult(id);
  if (!result || !result.filePath) {
    res.status(404).json({ error: 'Result not found or expired' });
    return;
  }

  // Check if file exists
  if (!fs.existsSync(result.filePath)) {
    res.status(404).json({ error: 'File not found on disk' });
    jobQueue.deleteJob(id); // Clean up the job entry
    return;
  }

  // Set headers for file download
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Length', result.fileSize);

  const extension = result.contentType === 'application/pdf' ? 'pdf' : 'epub';
  res.setHeader('Content-Disposition', `attachment; filename="download.${extension}"`);

  // Stream file from disk
  const fileStream = fs.createReadStream(result.filePath);

  fileStream.on('error', (err) => {
    logger.error('Error streaming file', { jobId: id, error: err.message });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error reading file' });
    }
  });

  fileStream.on('end', () => {
    // Delete job and file after successful download
    jobQueue.deleteJob(id);
    logger.info('File streamed and deleted', { jobId: id });
  });

  fileStream.pipe(res);
});

/**
 * DELETE /api/jobs/:id
 * Cancel a pending job
 */
router.delete('/:id', (req: Request<JobParams>, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.status !== JobStatus.PENDING) {
    res.status(400).json({
      error: 'Can only cancel pending jobs',
      status: job.status
    });
    return;
  }

  const cancelled = jobQueue.cancelJob(id);
  if (cancelled) {
    res.json({ message: 'Job cancelled', jobId: id });
  } else {
    res.status(400).json({ error: 'Failed to cancel job' });
  }
});

export default router;
