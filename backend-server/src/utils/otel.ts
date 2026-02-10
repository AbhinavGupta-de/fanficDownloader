/**
 * OpenTelemetry setup for PostHog Logs
 * Sends structured logs to PostHog via OTLP
 */

import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_69FQrHDBclBMwCpKDCTZQurOIeyVf1LW6wyZsOvoBS3';

let initialized = false;

export function initOtel(): void {
  if (initialized || process.env.NODE_ENV === 'test') return;

  const resource = resourceFromAttributes({
    'service.name': 'fanfic-downloader-backend',
    'service.version': '3.0.2',
  });

  const logExporter = new OTLPLogExporter({
    url: 'https://us.i.posthog.com/i/v1/logs',
    headers: {
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
    },
  });

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(logExporter)],
  });

  logs.setGlobalLoggerProvider(loggerProvider);
  initialized = true;
}

const SEVERITY_MAP = {
  INFO: SeverityNumber.INFO,
  WARN: SeverityNumber.WARN,
  ERROR: SeverityNumber.ERROR,
  DEBUG: SeverityNumber.DEBUG,
} as const;

/**
 * Emit a log record to PostHog via OpenTelemetry
 */
export function emitLog(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!initialized) return;

  const otelLogger = logs.getLogger('fanfic-downloader');
  otelLogger.emit({
    severityNumber: SEVERITY_MAP[level],
    severityText: level,
    body: message,
    attributes: metadata as Record<string, string | number | boolean> || {},
  });
}

export async function shutdownOtel(): Promise<void> {
  const provider = logs.getLoggerProvider() as LoggerProvider;
  if (provider?.shutdown) {
    await provider.shutdown();
  }
}
