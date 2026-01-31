// Backend API configuration
export const API_BASE_URL = 'https://chrome-plus-web.emergent.host';

// Sync endpoints (direct download - may timeout for large files)
export const API_ENDPOINTS = {
  singleChapter: `${API_BASE_URL}/api/download/single-chapter`,
  multiChapter: `${API_BASE_URL}/api/download/multi-chapter`,
  series: `${API_BASE_URL}/api/download/series`,
  health: `${API_BASE_URL}/api/health`,
};

// Async job queue endpoints (use for large downloads)
export const JOB_ENDPOINTS = {
  createJob: `${API_BASE_URL}/api/jobs`,
  getJob: (id: string) => `${API_BASE_URL}/api/jobs/${id}`,
  getResult: (id: string) => `${API_BASE_URL}/api/jobs/${id}/result`,
  cancelJob: (id: string) => `${API_BASE_URL}/api/jobs/${id}`,
  stats: `${API_BASE_URL}/api/jobs/stats`,
};

// Polling interval for job status (in milliseconds)
export const JOB_POLL_INTERVAL = 2000; // 2 seconds

// Timeouts for sync endpoints (used as fallback for small downloads)
export const API_TIMEOUTS = {
  singleChapter: 2 * 60 * 1000,    // 2 minutes (use sync for quick downloads)
  multiChapter: 30 * 60 * 1000,    // Not used - always use job queue
  series: 30 * 60 * 1000,          // Not used - always use job queue
};

// Estimated download times based on actual testing (Jan 2026)
// Format: { site: { type: { format: "time string" } } }
export const ESTIMATED_TIMES: Record<string, Record<string, Record<string, string>>> = {
  ao3: {
    single: {
      epub: '30-60 seconds',
      pdf: '1-2 minutes',
    },
    multi: {
      epub: '1-2 minutes',
      pdf: '2-5 minutes',
    },
    series: {
      epub: '1-3 minutes',
      pdf: '3-6 minutes',
    },
  },
  ffn: {
    single: {
      epub: '5-15 seconds',
      pdf: '10-30 seconds',
    },
    multi: {
      epub: '5-30 minutes (large stories)',
      pdf: '10-45 minutes (large stories)',
    },
  },
};

export function getEstimatedTime(site: string, type: string, format: string): string {
  const siteData = ESTIMATED_TIMES[site];
  if (!siteData) return 'Unknown';

  const typeData = siteData[type];
  if (!typeData) return 'Unknown';

  return typeData[format] || 'Unknown';
}
