/**
 * PostHog Analytics Integration
 * Tracks events, errors, and performance metrics
 */

import { PostHog } from 'posthog-node';
import logger from './logger.js';

// Initialize PostHog client (public key - safe to expose)
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_69FQrHDBclBMwCpKDCTZQurOIeyVf1LW6wyZsOvoBS3';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

let posthog: PostHog | null = null;

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
    properties: {
      ...props,
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
    properties: {
      ...props,
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
    properties: {
      ...props,
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
    properties: {
      ...props,
      $exception_type: props.error_type,
      $exception_message: props.error_message,
    },
  });

  logger.debug('Analytics: error_occurred', { distinctId, error_type: props.error_type });
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
    properties: {
      ...props,
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
    properties: {
      ...props,
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
    properties: {
      site,
      chapter,
      attempt,
    },
  });

  logger.debug('Analytics: cloudflare_blocked', { site, chapter, attempt });
}

export default {
  initAnalytics,
  shutdownAnalytics,
  trackDownloadStarted,
  trackDownloadCompleted,
  trackDownloadFailed,
  trackError,
  trackPerformance,
  trackApiRequest,
  trackScraperMetrics,
  trackCloudflareBlock,
};
