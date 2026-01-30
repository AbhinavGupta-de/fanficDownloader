/**
 * Simple in-memory job queue with concurrency control
 * No database required - jobs are lost on server restart
 *
 * For production with persistence, replace with Bull + Redis
 */

import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';
import type { Job, JobInfo, JobData, DownloadResult, QueueStats, DownloadType } from '../types/index.js';
import { JobStatus } from '../types/index.js';

// Configuration
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '3');
const JOB_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS || String(10 * 60 * 1000)); // 10 minutes
const JOB_RETENTION_MS = parseInt(process.env.JOB_RETENTION_MS || String(30 * 60 * 1000)); // 30 minutes

// In-memory storage
const jobs = new Map<string, Job>();
const pendingQueue: string[] = [];
let activeJobs = 0;

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

  // Try to process immediately if slots available
  processNextJob();

  return jobId;
}

/**
 * Get job status (without the result buffer)
 */
export function getJob(jobId: string): JobInfo | null {
  const job = jobs.get(jobId);
  if (!job) return null;

  const { result, ...jobInfo } = job;
  return {
    ...jobInfo,
    hasResult: result !== null
  };
}

/**
 * Get job result (the actual file buffer)
 */
export function getJobResult(jobId: string): DownloadResult | null {
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
  // Check if we can process more jobs
  if (activeJobs >= MAX_CONCURRENT_JOBS || pendingQueue.length === 0) {
    return;
  }

  const jobId = pendingQueue.shift();
  if (!jobId) return;

  const job = jobs.get(jobId);

  if (!job || job.status !== JobStatus.PENDING) {
    // Job was cancelled or doesn't exist, try next
    processNextJob();
    return;
  }

  activeJobs++;
  job.status = JobStatus.PROCESSING;
  job.startedAt = Date.now();

  logger.info('Job started', { jobId, activeJobs, pendingCount: pendingQueue.length });

  try {
    // Import services dynamically to avoid circular deps
    const { downloadSingleChapter } = await import('../services/singleChapter.service.js');
    const { downloadMultiChapter } = await import('../services/multiChapter.service.js');
    const { downloadSeries } = await import('../services/series.service.js');

    const { url, type: format } = job.data;

    // Set timeout for the job
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Job timed out')), JOB_TIMEOUT_MS);
    });

    // Execute based on job type
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

    job.status = JobStatus.COMPLETED;
    job.completedAt = Date.now();
    job.result = result;
    job.progress = 100;

    logger.info('Job completed', {
      jobId,
      duration: job.completedAt - (job.startedAt || job.createdAt),
      resultSize: result.buffer?.length
    });

  } catch (error) {
    job.status = JobStatus.FAILED;
    job.completedAt = Date.now();
    job.error = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Job failed', { jobId, error: job.error });
  } finally {
    activeJobs--;
    // Process next job in queue
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

  // Remove from pending queue
  const index = pendingQueue.indexOf(jobId);
  if (index > -1) {
    pendingQueue.splice(index, 1);
  }

  return true;
}

/**
 * Cleanup old jobs periodically
 */
function cleanupOldJobs(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobs) {
    // Remove completed/failed jobs older than retention period
    if (
      (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
      job.completedAt && (now - job.completedAt > JOB_RETENTION_MS)
    ) {
      jobs.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info('Cleaned up old jobs', { cleaned, remaining: jobs.size });
  }
}

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
  JobStatus
};
