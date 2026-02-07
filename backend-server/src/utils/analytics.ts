/**
 * PostHog Analytics Integration
 * Tracks events, errors, and performance metrics
 *
 * Features:
 * - Group analytics (ao3 vs ffn site-level insights)
 * - Anonymous event tracking ($process_person_profile: false)
 * - Error tracking via captureException (separate 100K free tier)
 * - Job queue lifecycle tracking
 * - API request tracking
 * - Scraper & Cloudflare metrics
 */

import { PostHog } from 'posthog-node';
import logger from './logger.js';

// Initialize PostHog client (public key - safe to expose)
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_69FQrHDBclBMwCpKDCTZQurOIeyVf1LW6wyZsOvoBS3';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

let posthog: PostHog | null = null;

/**
 * Get the PostHog client instance (for use in app.ts error handler setup)
 */
export function getPostHogClient(): PostHog | null {
  return posthog;
}

// Initialize PostHog (call this at server startup)
export function initAnalytics(): void {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Analytics disabled in test mode');
    return;
  }

  try {
    posthog = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 20, // Send events in batches of 20
      flushInterval: 10000, // Or every 10 seconds
    });

    // Register site groups for group analytics
    posthog.groupIdentify({
      groupType: 'site',
      groupKey: 'ao3',
      properties: {
        name: 'Archive of Our Own',
        base_url: 'https://archiveofourown.org',
      },
    });

    posthog.groupIdentify({
      groupType: 'site',
      groupKey: 'ffn',
      properties: {
        name: 'FanFiction.Net',
        base_url: 'https://www.fanfiction.net',
      },
    });

    logger.info('PostHog analytics initialized');
  } catch (error) {
    logger.error('Failed to initialize PostHog', { error });
  }
}

// Shutdown PostHog gracefully
export async function shutdownAnalytics(): Promise<void> {
  if (posthog) {
    await posthog.shutdown();
    logger.info('PostHog analytics shutdown');
  }
}

// Generate anonymous distinct ID from request
function getDistinctId(req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  if (!req) return 'server';

  // Use IP + User-Agent hash for anonymous tracking
  const ip = req.ip || req.headers?.['x-forwarded-for'] || 'unknown';
  const ua = req.headers?.['user-agent'] || 'unknown';

  // Simple hash function
  const str = `${ip}-${ua}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `anon_${Math.abs(hash).toString(36)}`;
}

/**
 * Helper to build groups object for site-level analytics
 */
function siteGroups(site?: string): Record<string, string> | undefined {
  if (site && (site === 'ao3' || site === 'ffn')) {
    return { site };
  }
  return undefined;
}

// ============================================
// EVENT TRACKING
// ============================================

interface DownloadEventProps {
  site: 'ao3' | 'ffn' | 'unknown';
  format: 'pdf' | 'epub';
  type: 'single-chapter' | 'multi-chapter' | 'series';
  url: string;
  chapters?: number;
  duration_ms?: number;
  file_size_bytes?: number;
  success: boolean;
  error?: string;
  // Story metadata for caching insights
  story_id?: string;
  story_title?: string;
  story_author?: string;
}

export function trackDownloadStarted(
  props: Omit<DownloadEventProps, 'duration_ms' | 'file_size_bytes' | 'success'>,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'download_started',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      $current_url: props.url,
    },
  });

  logger.debug('Analytics: download_started', { distinctId, ...props });
}

export function trackDownloadCompleted(
  props: DownloadEventProps,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'download_completed',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      $current_url: props.url,
    },
  });

  logger.debug('Analytics: download_completed', { distinctId, ...props });
}

export function trackDownloadFailed(
  props: DownloadEventProps,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'download_failed',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      $current_url: props.url,
    },
  });

  logger.debug('Analytics: download_failed', { distinctId, ...props });
}

// ============================================
// ERROR TRACKING
// ============================================

interface ErrorEventProps {
  error_type: string;
  error_message: string;
  error_stack?: string;
  endpoint?: string;
  method?: string;
  site?: string;
  url?: string;
  context?: Record<string, unknown>;
}

export function trackError(
  props: ErrorEventProps,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'error_occurred',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      $exception_type: props.error_type,
      $exception_message: props.error_message,
    },
  });

  logger.debug('Analytics: error_occurred', { distinctId, error_type: props.error_type });
}

/**
 * Track exceptions via PostHog's dedicated error tracking (separate 100K free tier)
 */
export function trackException(
  error: Error,
  additionalProps?: Record<string, unknown>,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.captureException(error, distinctId, {
    $process_person_profile: false,
    ...additionalProps,
  });

  logger.debug('Analytics: exception captured', { distinctId, error: error.message });
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

interface PerformanceEventProps {
  operation: string;
  duration_ms: number;
  site?: string;
  chapters?: number;
  workers?: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export function trackPerformance(
  props: PerformanceEventProps,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'performance_metric',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      duration_seconds: props.duration_ms / 1000,
    },
  });

  logger.debug('Analytics: performance_metric', { distinctId, operation: props.operation });
}

// ============================================
// API REQUEST TRACKING
// ============================================

export function trackApiRequest(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'api_request',
    properties: {
      endpoint,
      method,
      status_code: statusCode,
      duration_ms: durationMs,
      success: statusCode < 400,
      $process_person_profile: false,
    },
  });
}

// ============================================
// SCRAPER METRICS
// ============================================

interface ScraperMetricsProps {
  site: 'ao3' | 'ffn';
  total_chapters: number;
  successful_chapters: number;
  failed_chapters: number;
  workers: number;
  duration_ms: number;
  retried_chapters?: number;
}

export function trackScraperMetrics(
  props: ScraperMetricsProps,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'scraper_completed',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      success_rate: props.total_chapters > 0
        ? (props.successful_chapters / props.total_chapters * 100).toFixed(2)
        : 0,
      chapters_per_second: props.duration_ms > 0
        ? (props.successful_chapters / (props.duration_ms / 1000)).toFixed(2)
        : 0,
    },
  });

  logger.debug('Analytics: scraper_completed', { distinctId, site: props.site });
}

// ============================================
// CLOUDFLARE BLOCK TRACKING
// ============================================

export function trackCloudflareBlock(
  site: string,
  chapter: number,
  attempt: number,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  if (!posthog) return;

  const distinctId = getDistinctId(req);

  posthog.capture({
    distinctId,
    event: 'cloudflare_blocked',
    groups: siteGroups(site),
    properties: {
      site,
      chapter,
      attempt,
      $process_person_profile: false,
    },
  });

  logger.debug('Analytics: cloudflare_blocked', { site, chapter, attempt });
}

// ============================================
// JOB QUEUE TRACKING
// ============================================

interface JobEventProps {
  job_id: string;
  job_type: 'single-chapter' | 'multi-chapter' | 'series';
  format: 'pdf' | 'epub';
  url: string;
  site: 'ao3' | 'ffn' | 'unknown';
}

export function trackJobCreated(props: JobEventProps & { queue_position: number }): void {
  if (!posthog) return;

  posthog.capture({
    distinctId: 'server',
    event: 'job_created',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
    },
  });

  logger.debug('Analytics: job_created', { job_id: props.job_id });
}

export function trackJobStarted(props: JobEventProps & { active_jobs: number; pending_count: number }): void {
  if (!posthog) return;

  posthog.capture({
    distinctId: 'server',
    event: 'job_started',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
    },
  });

  logger.debug('Analytics: job_started', { job_id: props.job_id });
}

export function trackJobCompleted(props: JobEventProps & { duration_ms: number; file_size_bytes: number }): void {
  if (!posthog) return;

  posthog.capture({
    distinctId: 'server',
    event: 'job_completed',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      success: true,
    },
  });

  logger.debug('Analytics: job_completed', { job_id: props.job_id, duration_ms: props.duration_ms });
}

export function trackJobFailed(props: JobEventProps & { duration_ms: number; error: string }): void {
  if (!posthog) return;

  posthog.capture({
    distinctId: 'server',
    event: 'job_failed',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
      success: false,
      $exception_type: 'JobError',
      $exception_message: props.error,
    },
  });

  logger.debug('Analytics: job_failed', { job_id: props.job_id, error: props.error });
}

export function trackJobCancelled(props: JobEventProps): void {
  if (!posthog) return;

  posthog.capture({
    distinctId: 'server',
    event: 'job_cancelled',
    groups: siteGroups(props.site),
    properties: {
      ...props,
      $process_person_profile: false,
    },
  });

  logger.debug('Analytics: job_cancelled', { job_id: props.job_id });
}

export default {
  initAnalytics,
  shutdownAnalytics,
  getPostHogClient,
  trackDownloadStarted,
  trackDownloadCompleted,
  trackDownloadFailed,
  trackError,
  trackException,
  trackPerformance,
  trackApiRequest,
  trackScraperMetrics,
  trackCloudflareBlock,
  trackJobCreated,
  trackJobStarted,
  trackJobCompleted,
  trackJobFailed,
  trackJobCancelled,
};
