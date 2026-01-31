import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-gray-400 mb-8">Last updated: January 2026</p>

      {/* TL;DR */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-primary mb-3">TL;DR</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✓ We don&apos;t collect your name, email, or any personal info</li>
          <li>✓ We track anonymous analytics including which stories are downloaded (for caching)</li>
          <li>✓ We don&apos;t sell or share your data with anyone</li>
          <li>✓ Your downloaded fanfics stay on your device</li>
        </ul>
      </div>

      {/* What We Collect */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">What We Collect</h2>

        <h3 className="text-lg font-medium text-primary mb-2">Anonymous Usage Data</h3>
        <p className="text-gray-300 mb-4">
          We use PostHog to understand how people use our extension. This helps us fix bugs and improve features.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-medium text-white mb-2">What&apos;s tracked:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Pages visited on our website</li>
              <li>• Which buttons are clicked</li>
              <li>• Download counts and story info (title, author, ID)</li>
              <li>• Errors that occur</li>
              <li>• Basic device info (browser, screen size)</li>
            </ul>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-medium text-white mb-2">What&apos;s NOT tracked:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Your name or email</li>
              <li>• Your reading habits</li>
              <li>• Anything that identifies you personally</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <h4 className="font-medium text-white mb-2">Why we track story downloads:</h4>
          <p className="text-gray-400 text-sm">
            We track which stories are downloaded (title, author, ID) to understand popular content
            and potentially cache frequently requested stories to make the extension faster.
            This data is anonymous and not linked to you personally.
          </p>
        </div>

        <h3 className="text-lg font-medium text-primary mb-2">Cookies</h3>
        <p className="text-gray-300">
          We use a small cookie to track anonymous sessions. This helps us count unique visitors without knowing who you are.
          You can decline cookies using the banner at the bottom of the page.
        </p>
      </section>

      {/* What We Don't Do */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">What We Don&apos;t Do</h2>
        <ul className="space-y-2 text-gray-300">
          <li>❌ Sell your data</li>
          <li>❌ Share data with third parties (except PostHog for analytics)</li>
          <li>❌ Track what fanfics you read or download</li>
          <li>❌ Store any files on our servers (downloads go straight to your device)</li>
        </ul>
      </section>

      {/* Your Rights */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
        <ul className="space-y-2 text-gray-300">
          <li><strong className="text-white">Opt out of tracking:</strong> Click &quot;Decline&quot; on the cookie banner, or use an ad blocker</li>
          <li><strong className="text-white">Delete data:</strong> Since we don&apos;t collect personal data, there&apos;s nothing to delete</li>
          <li><strong className="text-white">Questions:</strong> Open an issue on our GitHub repo</li>
        </ul>
      </section>

      {/* Third-Party Services */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-primary">PostHog (Analytics)</h3>
            <p className="text-gray-400 text-sm">
              Anonymous usage analytics •{' '}
              <a href="https://posthog.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-primary">Fanfiction Sites (AO3, FFN)</h3>
            <p className="text-gray-400 text-sm">
              When you download a story, your browser connects directly to the fanfiction site. We don&apos;t proxy or store this data.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-2">Questions?</h2>
        <p className="text-gray-300">
          Open an issue on{' '}
          <a href="https://github.com" className="text-primary hover:underline">
            GitHub
          </a>{' '}
          or reach out through our contact page.
        </p>
      </section>
    </div>
  );
}
