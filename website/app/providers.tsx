'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

// PostHog public key (safe to expose - it's meant to be public like Google Analytics)
const POSTHOG_KEY = 'phc_69FQrHDBclBMwCpKDCTZQurOIeyVf1LW6wyZsOvoBS3';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if user has declined cookies
    const consent = localStorage.getItem('cookie-consent');

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
      // Respect user's cookie choice
      opt_out_capturing_by_default: consent === 'declined',
    });

    // If user previously declined, make sure tracking is off
    if (consent === 'declined') {
      posthog.opt_out_capturing();
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
