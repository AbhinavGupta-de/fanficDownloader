/**
 * Job storage utilities for persisting download state across extension reopens
 */

export interface StoredJob {
  jobId: string;
  url: string;
  type: 'single-chapter' | 'multi-chapter' | 'series';
  format: 'pdf' | 'epub';
  createdAt: number;
}

/**
 * Extract story ID from URL
 */
export function extractStoryId(url: string): string | null {
  // AO3: https://archiveofourown.org/works/12345/chapters/123
  const ao3Match = url.match(/archiveofourown\.org\/works\/(\d+)/);
  if (ao3Match) {
    return `ao3_${ao3Match[1]}`;
  }

  // AO3 series: https://archiveofourown.org/series/12345
  const ao3SeriesMatch = url.match(/archiveofourown\.org\/series\/(\d+)/);
  if (ao3SeriesMatch) {
    return `ao3_series_${ao3SeriesMatch[1]}`;
  }

  // FFN: https://www.fanfiction.net/s/14256506/1/Story-Name
  const ffnMatch = url.match(/fanfiction\.net\/s\/(\d+)/);
  if (ffnMatch) {
    return `ffn_${ffnMatch[1]}`;
  }

  return null;
}

/**
 * Generate storage key for a job
 */
export function getStorageKey(storyId: string, type: string, format: string): string {
  return `fanfic_job_${storyId}_${type}_${format}`;
}

/**
 * Save job to localStorage
 */
export function saveJob(
  url: string,
  jobId: string,
  type: 'single-chapter' | 'multi-chapter' | 'series',
  format: 'pdf' | 'epub'
): void {
  const storyId = extractStoryId(url);
  if (!storyId) return;

  const key = getStorageKey(storyId, type, format);
  const job: StoredJob = {
    jobId,
    url,
    type,
    format,
    createdAt: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(job));
  console.log('Job saved to storage:', key, jobId);
}

/**
 * Get job from localStorage
 */
export function getStoredJob(
  url: string,
  type: 'single-chapter' | 'multi-chapter' | 'series',
  format: 'pdf' | 'epub'
): StoredJob | null {
  const storyId = extractStoryId(url);
  if (!storyId) return null;

  const key = getStorageKey(storyId, type, format);
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    const job = JSON.parse(stored) as StoredJob;
    // Check if job is not too old (older than 10 minutes = backend deleted it)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - job.createdAt > TEN_MINUTES) {
      clearStoredJob(url, type, format);
      return null;
    }
    return job;
  } catch {
    return null;
  }
}

/**
 * Clear job from localStorage
 */
export function clearStoredJob(
  url: string,
  type: 'single-chapter' | 'multi-chapter' | 'series',
  format: 'pdf' | 'epub'
): void {
  const storyId = extractStoryId(url);
  if (!storyId) return;

  const key = getStorageKey(storyId, type, format);
  localStorage.removeItem(key);
  console.log('Job cleared from storage:', key);
}
