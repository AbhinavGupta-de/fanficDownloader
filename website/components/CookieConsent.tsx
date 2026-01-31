'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
    // Optionally disable PostHog here
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300 text-center sm:text-left">
          We use cookies for anonymous analytics to improve the extension.{' '}
          <a href="/privacy" className="text-primary underline hover:no-underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex gap-2">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-primary text-black rounded-md hover:bg-opacity-90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
