# Fanfiction Downloader Chrome Extension

A Chrome extension to download fanfiction from Archive of Our Own (AO3) and FanFiction.Net as EPUB or PDF.

## Installation

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/fanfiction-downloader/hbmlonlejahpphahalbcldboehhjieih).

### Manual Installation

1. Clone the repository
2. `cd frontend && npm install && npm run build`
3. Go to `chrome://extensions/` and enable Developer Mode
4. Click "Load unpacked" and select the `frontend/dist` folder

## Features

- Download single chapters or entire stories
- Download complete series from AO3
- Export as EPUB or PDF
- Supports Archive of Our Own (AO3)
- Supports FanFiction.Net

## Project Structure

- `frontend/` - Chrome extension (React + TypeScript)
- `backend-server/` - Express server with job queue
- `website/` - Landing page

## Contributing

1. Fork and clone the repository
2. Pick a folder (`frontend`, `backend-server`, or `website`)
3. Run `npm install` and start developing
4. Open a PR following [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

> [!TIP]
> Report bugs or suggest features by opening an issue.
