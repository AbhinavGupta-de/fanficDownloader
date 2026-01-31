import axios from 'axios';
import { JOB_ENDPOINTS, JOB_POLL_INTERVAL } from './config';
import { saveJob, getStoredJob, clearStoredJob } from './jobStorage';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobInfo {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  error?: string;
  hasResult?: boolean;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface JobCreateResponse {
  jobId: string;
  status: JobStatus;
  message: string;
}

export type ProgressCallback = (status: JobStatus, progress: number, message?: string) => void;

/**
 * Create a new download job
 */
export async function createJob(
  url: string,
  type: 'single-chapter' | 'multi-chapter' | 'series',
  format: 'pdf' | 'epub'
): Promise<string> {
  const response = await axios.post<JobCreateResponse>(JOB_ENDPOINTS.createJob, {
    url,
    type,
    format,
  });
  return response.data.jobId;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobInfo> {
  const response = await axios.get<JobInfo>(JOB_ENDPOINTS.getJob(jobId));
  return response.data;
}

/**
 * Download job result
 */
export async function downloadJobResult(jobId: string): Promise<ArrayBuffer> {
  const response = await axios.get(JOB_ENDPOINTS.getResult(jobId), {
    responseType: 'arraybuffer',
  });
  return response.data;
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<void> {
  await axios.delete(JOB_ENDPOINTS.cancelJob(jobId));
}

/**
 * Poll job until completion and download result
 * Returns { result, jobNotFound } - jobNotFound=true means we got 404
 */
export async function pollAndDownload(
  jobId: string,
  onProgress?: ProgressCallback
): Promise<{ result: ArrayBuffer; jobNotFound: false } | { result: null; jobNotFound: true }> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await getJobStatus(jobId);

        // Report progress
        if (onProgress) {
          const message = getProgressMessage(job);
          onProgress(job.status, job.progress, message);
        }

        if (job.status === 'completed') {
          // Download the result
          const result = await downloadJobResult(jobId);
          resolve({ result, jobNotFound: false });
        } else if (job.status === 'failed') {
          reject(new Error(job.error || 'Download failed'));
        } else {
          // Keep polling
          setTimeout(poll, JOB_POLL_INTERVAL);
        }
      } catch (error) {
        // Check if it's a 404 (job not found)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          resolve({ result: null, jobNotFound: true });
        } else {
          reject(error);
        }
      }
    };

    // Start polling
    poll();
  });
}

/**
 * Get human-readable progress message
 */
function getProgressMessage(job: JobInfo): string {
  switch (job.status) {
    case 'pending':
      return 'Waiting in queue...';
    case 'processing':
      if (job.progress > 0) {
        return `Processing... ${job.progress}%`;
      }
      return 'Processing...';
    case 'completed':
      return 'Download ready!';
    case 'failed':
      return job.error || 'Failed';
    default:
      return 'Unknown status';
  }
}

/**
 * Full download flow: check existing job → create if needed → poll → download
 */
export async function downloadWithJobQueue(
  url: string,
  type: 'single-chapter' | 'multi-chapter' | 'series',
  format: 'pdf' | 'epub',
  onProgress?: ProgressCallback
): Promise<ArrayBuffer> {
  // Check for existing job in localStorage
  const existingJob = getStoredJob(url, type, format);

  if (existingJob) {
    console.log('Found existing job:', existingJob.jobId);
    if (onProgress) {
      onProgress('pending', 0, 'Resuming previous download...');
    }

    // Try to poll the existing job
    const pollResult = await pollAndDownload(existingJob.jobId, onProgress);

    if (pollResult.jobNotFound) {
      // Job was deleted on server (404), clear storage and create new
      console.log('Existing job not found on server, creating new one...');
      clearStoredJob(url, type, format);
    } else {
      // Success - clear storage and return result
      clearStoredJob(url, type, format);
      return pollResult.result;
    }
  }

  // Create new job
  if (onProgress) {
    onProgress('pending', 0, 'Creating download job...');
  }

  const jobId = await createJob(url, type, format);
  console.log('Job created:', jobId);

  // Save to localStorage for resume capability
  saveJob(url, jobId, type, format);

  // Poll until complete and get result
  const pollResult = await pollAndDownload(jobId, onProgress);

  // Clear storage after completion
  clearStoredJob(url, type, format);

  if (pollResult.jobNotFound) {
    throw new Error('Job was deleted unexpectedly. Please try again.');
  }

  return pollResult.result;
}
