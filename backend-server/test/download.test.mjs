#!/usr/bin/env node
/**
 * Download API Test - Tests the full download flow via HTTP API
 *
 * Usage:
 *   node test/download.test.mjs <url> [type] [endpoint]
 *
 * Arguments:
 *   url      - The fanfic URL (required)
 *   type     - pdf or epub (default: pdf)
 *   endpoint - single-chapter or multi-chapter (default: single-chapter)
 *
 * Environment:
 *   API_URL  - Base URL for API (default: http://localhost:8002)
 *
 * Examples:
 *   node test/download.test.mjs https://archiveofourown.org/works/25830817
 *   node test/download.test.mjs https://www.fanfiction.net/s/14523797/1/Title pdf single-chapter
 *   node test/download.test.mjs https://www.fanfiction.net/s/14523797/1/Title epub multi-chapter
 */

import fs from 'fs';

const [,, url, type = 'pdf', endpoint = 'single-chapter'] = process.argv;
const API_URL = process.env.API_URL || 'http://localhost:8002';

if (!url) {
  console.log('Download API Test');
  console.log('=================');
  console.log('');
  console.log('Usage:');
  console.log('  node test/download.test.mjs <url> [type] [endpoint]');
  console.log('');
  console.log('Arguments:');
  console.log('  url      - The fanfic URL (required)');
  console.log('  type     - pdf or epub (default: pdf)');
  console.log('  endpoint - single-chapter or multi-chapter (default: single-chapter)');
  console.log('');
  console.log('Environment:');
  console.log('  API_URL  - Base URL for API (default: http://localhost:8002)');
  console.log('');
  console.log('Examples:');
  console.log('  # AO3 single chapter PDF');
  console.log('  node test/download.test.mjs https://archiveofourown.org/works/25830817');
  console.log('');
  console.log('  # FFN single chapter EPUB');
  console.log('  node test/download.test.mjs https://www.fanfiction.net/s/14523797/1/Title epub');
  console.log('');
  console.log('  # FFN multi-chapter PDF');
  console.log('  node test/download.test.mjs https://www.fanfiction.net/s/14523797/1/Title pdf multi-chapter');
  process.exit(1);
}

// Validate inputs
if (!['pdf', 'epub'].includes(type)) {
  console.error('Error: type must be "pdf" or "epub"');
  process.exit(1);
}

if (!['single-chapter', 'multi-chapter'].includes(endpoint)) {
  console.error('Error: endpoint must be "single-chapter" or "multi-chapter"');
  process.exit(1);
}

async function testDownload() {
  console.log('');
  console.log('=== Download API Test ===');
  console.log('');
  console.log('API URL:', API_URL);
  console.log('Fanfic URL:', url);
  console.log('Type:', type);
  console.log('Endpoint:', endpoint);
  console.log('');

  const apiEndpoint = `${API_URL}/api/download/${endpoint}`;
  console.log('Full endpoint:', apiEndpoint);
  console.log('');
  console.log('Sending request...');

  const startTime = Date.now();

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type })
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const timestamp = Date.now();
    const filename = `test-output-${timestamp}.${type}`;

    fs.writeFileSync(filename, buffer);

    console.log('');
    console.log('=== Results ===');
    console.log('');
    console.log('Status: SUCCESS');
    console.log('Duration:', duration, 'seconds');
    console.log('File saved:', filename);
    console.log('File size:', buffer.length, 'bytes', `(${(buffer.length / 1024).toFixed(2)} KB)`);
    console.log('');
    console.log('DOWNLOAD TEST PASSED');

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('');
    console.error('=== Results ===');
    console.error('');
    console.error('Status: FAILED');
    console.error('Duration:', duration, 'seconds');
    console.error('Error:', error.message);
    console.error('');
    console.error('DOWNLOAD TEST FAILED');
    console.error('');
    console.error('Make sure the server is running:');
    console.error('  cd backend-server && npm start');
    process.exit(1);
  }
}

testDownload();
