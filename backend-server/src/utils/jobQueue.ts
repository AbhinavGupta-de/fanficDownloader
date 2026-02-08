/**
 * Job queue with file-based storage (not RAM)
 * Results are stored on disk in /tmp and auto-deleted after 10 minutes
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';
import {
  trackJobCreated,
  trackJobStarted,
  trackJobCompleted,
  trackJobFailed,
  trackJobCancelled,
  trackException,
} from './analytics.js';
import { detectSite } from '../scrapers/index.js';
import type { Job, JobInfo, JobData, DownloadResult, QueueStats, DownloadType, JobFileResult } from '../types/index.js';
import { JobStatus } from '../types/index.js';

// Configuration
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '3');
const JOB_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS || String(45 * 60 * 1000)); // 45 minutes
const JOB_RETENTION_MS = parseInt(process.env.JOB_RETENTION_MS || String(10 * 60 * 1000)); // 10 minutes after completion

// Directory for temporary job files
const JOB_FILES_DIR = '/tmp/fanfic-downloads';

// Ensure job files directory exists
if (!fs.existsSync(JOB_FILES_DIR)) {
  fs.mkdirSync(JOB_FILES_DIR, { recursive: true });
}

// In-memory storage (only metadata, not file contents)
const jobs = new Map<string, Job>();
const pendingQueue: string[] = [];
let activeJobs = 0;

/**
 * Save result buffer to disk and return file info
 */
function saveResultToDisk(jobId: string, result: DownloadResult): JobFileResult {
  const extension = result.contentType === 'application/pdf' ? 'pdf' : 'epub';
  const fileName = `${jobId}.${extension}`;
  const filePath = path.join(JOB_FILES_DIR, fileName);

  fs.writeFileSync(filePath, result.buffer);

  logger.info('Saved job result to disk', { jobId, filePath, size: result.buffer.length });

  return {
    filePath,
    contentType: result.contentType,
    fileSize: result.buffer.length,
    metadata: result.metadata
  };
}

/**
 * Delete result file from disk
 */
function deleteResultFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Deleted job result file', { filePath });
    }
  } catch (error) {
    logger.error('Failed to delete job result file', { filePath, error });
  }
}

/**
 * Build common job event props for analytics
 */
function getJobEventProps(job: Job) {
  const site = detectSite(job.data.url);
  return {
    job_id: job.id,
    job_type: job.type as 'single-chapter' | 'multi-chapter' | 'series',
    format: job.data.type as 'pdf' | 'epub',
    url: job.data.url,
    site: (site || 'unknown') as 'ao3' | 'ffn' | 'unknown',
  };
}

/**
 * Create a new job
 */
export function createJob(type: DownloadType, data: JobData): string {
  const jobId = uuidv4();
  const job: Job = {
    id: jobId,
    type,
    data,
    status: JobStatus.PENDING,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    progress: 0
  };

  jobs.set(jobId, job);
  pendingQueue.push(jobId);

  logger.info('Job created', { jobId, type, queuePosition: pendingQueue.length });
  trackJobCreated({ ...getJobEventProps(job), queue_position: pendingQueue.length });

  // Try to process immediately if slots available
  processNextJob();

  return jobId;
}

/**
 * Get job status
 */
export function getJob(jobId: string): JobInfo | null {
  const job = jobs.get(jobId);
  if (!job) return null;

  const { result, ...jobInfo } = job;
  return {
    ...jobInfo,
    hasResult: result !== null,
    metadata: result?.metadata
  };
}

/**
 * Get job result file info (not the actual file)
 */
export function getJobResult(jobId: string): JobFileResult | null {
  const job = jobs.get(jobId);
  if (!job || job.status !== JobStatus.COMPLETED) return null;
  return job.result;
}

/**
 * Update job progress
 */
export function updateJobProgress(jobId: string, progress: number): void {
  const job = jobs.get(jobId);
  if (job) {
    job.progress = progress;
  }
}

/**
 * Process the next job in queue
 */
async function processNextJob(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT_JOBS || pendingQueue.length === 0) {
    return;
  }

  const jobId = pendingQueue.shift();
  if (!jobId) return;

  const job = jobs.get(jobId);

  if (!job || job.status !== JobStatus.PENDING) {
    processNextJob();
    return;
  }

  activeJobs++;
  job.status = JobStatus.PROCESSING;
  job.startedAt = Date.now();

  logger.info('Job started', { jobId, activeJobs, pendingCount: pendingQueue.length });
  trackJobStarted({ ...getJobEventProps(job), active_jobs: activeJobs, pending_count: pendingQueue.length });

  try {
    const { downloadSingleChapter } = await import('../services/singleChapter.service.js');
    const { downloadMultiChapter } = await import('../services/multiChapter.service.js');
    const { downloadSeries } = await import('../services/series.service.js');

    const { url, type: format } = job.data;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Job timed out')), JOB_TIMEOUT_MS);
    });

    let downloadPromise: Promise<DownloadResult>;
    switch (job.type) {
      case 'single-chapter':
        downloadPromise = downloadSingleChapter(url, format);
        break;
      case 'multi-chapter':
        downloadPromise = downloadMultiChapter(url, format);
        break;
      case 'series':
        downloadPromise = downloadSeries(url, format);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    const result = await Promise.race([downloadPromise, timeoutPromise]);

    // Save to disk instead of keeping in RAM
    const fileResult = saveResultToDisk(jobId, result);

    job.status = JobStatus.COMPLETED;
    job.completedAt = Date.now();
    job.result = fileResult;
    job.progress = 100;

    const duration = job.completedAt - (job.startedAt || job.createdAt);
    logger.info('Job completed', { jobId, duration, fileSize: fileResult.fileSize });
    trackJobCompleted({ ...getJobEventProps(job), duration_ms: duration, file_size_bytes: fileResult.fileSize });

  } catch (error) {
    job.status = JobStatus.FAILED;
    job.completedAt = Date.now();
    job.error = error instanceof Error ? error.message : 'Unknown error';

    const duration = job.completedAt - (job.startedAt || job.createdAt);
    logger.error('Job failed', { jobId, error: job.error });
    trackJobFailed({ ...getJobEventProps(job), duration_ms: duration, error: job.error });
    if (error instanceof Error) {
      trackException(error, { job_id: jobId, job_type: job.type });
    }
  } finally {
    activeJobs--;
    processNextJob();
  }
}

/**
 * Get queue statistics
 */
export function getQueueStats(): QueueStats {
  return {
    activeJobs,
    pendingJobs: pendingQueue.length,
    maxConcurrent: MAX_CONCURRENT_JOBS,
    totalJobs: jobs.size
  };
}

/**
 * Cancel a pending job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== JobStatus.PENDING) {
    return false;
  }

  job.status = JobStatus.FAILED;
  job.error = 'Cancelled by user';
  job.completedAt = Date.now();

  const index = pendingQueue.indexOf(jobId);
  if (index > -1) {
    pendingQueue.splice(index, 1);
  }

  trackJobCancelled(getJobEventProps(job));

  return true;
}

/**
 * Delete a job and its file
 */
export function deleteJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;

  // Delete the file if it exists
  if (job.result?.filePath) {
    deleteResultFile(job.result.filePath);
  }

  jobs.delete(jobId);
  logger.info('Job deleted', { jobId });
  return true;
}

/**
 * Cleanup old jobs and their files
 */
function cleanupOldJobs(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobs) {
    if (
      (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
      job.completedAt && (now - job.completedAt > JOB_RETENTION_MS)
    ) {
      // Delete file before removing job
      if (job.result?.filePath) {
        deleteResultFile(job.result.filePath);
      }
      jobs.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info('Cleaned up old jobs', { cleaned, remaining: jobs.size });
  }
}

/**
 * Cleanup orphaned files on startup
 */
function cleanupOrphanedFiles(): void {
  try {
    const files = fs.readdirSync(JOB_FILES_DIR);
    let cleaned = 0;

    for (const file of files) {
      const jobId = path.basename(file, path.extname(file));
      if (!jobs.has(jobId)) {
        const filePath = path.join(JOB_FILES_DIR, file);
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up orphaned files on startup', { cleaned });
    }
  } catch (error) {
    logger.error('Failed to cleanup orphaned files', { error });
  }
}

// Cleanup on startup
cleanupOrphanedFiles();

// Run cleanup every 5 minutes
setInterval(cleanupOldJobs, 5 * 60 * 1000);

export { JobStatus };

export default {
  createJob,
  getJob,
  getJobResult,
  updateJobProgress,
  getQueueStats,
  cancelJob,
  deleteJob,
  JobStatus
};
