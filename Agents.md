# Fanfic Downloader - Architecture Overview

A Chrome extension for downloading fanfiction from Archive of Our Own (AO3) in PDF/EPUB formats.

## Project Structure

```text
fanficDownloader/
├── frontend/          # Chrome Extension (React + TypeScript)
├── server/            # Appwrite Serverless Functions (legacy)
├── backend-server/    # Express.js Server (new, recommended)
└── test/              # Integration tests
```

---

## Frontend (Chrome Extension)

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS

### Key Components

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, orchestrates UI |
| `src/main/Main.tsx` | Extracts & displays fanfic metadata from page |
| `src/main/Download.tsx` | Download type/format selector + download trigger |
| `src/content.ts` | Content script - extracts data from AO3 DOM |
| `src/background.ts` | Service worker - handles extension lifecycle |
| `src/api/` | API calls to backend services |

### Data Flow

```text
User clicks extension → Popup loads
    ↓
content.ts extracts metadata (story name, author) from DOM
    ↓
User selects: Single Chapter / Full Story / Series + PDF/EPUB
    ↓
API call to backend → receives file buffer
    ↓
chrome.downloads.download() saves file
```

### AO3 DOM Selectors Used

- Story title: `.title.heading`
- Author: `.byline.heading`
- Content wrapper: `#workskin`

---

## Server (Appwrite Functions - Legacy)

Three independent serverless functions deployed on Appwrite:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `singleChapterFunc` | `66614fabac01bd29afbd.appwrite.global` | Download single chapter |
| `multiChapterFunc` | `6661df0a82b533cdfb2e.appwrite.global` | Download entire work |
| `seriesFunc` | - | Download complete series |

**Tech:** Node.js, Puppeteer, epub-gen

---

## Backend Server (Express.js - Recommended)

Modern Express.js implementation with proper separation of concerns.

### Directory Structure

```text
backend-server/src/
├── server.js              # Entry point (port 8002)
├── app.js                 # Express setup, middleware
├── routes/
│   └── download.routes.js # Route definitions
├── controllers/
│   └── download.controller.js
├── services/
│   ├── singleChapter.service.js
│   ├── multiChapter.service.js
│   └── series.service.js
├── middleware/
│   ├── errorHandler.js
│   └── requestLogger.js
└── utils/
    ├── logger.js
    └── puppeteerConfig.js
```

### API Endpoints

```http
GET  /api/health                    # Health check
POST /api/download/single-chapter   # Download one chapter
POST /api/download/multi-chapter    # Download entire work
POST /api/download/series           # Download complete series
```

**Request Body:**

```json
{
  "url": "https://archiveofourown.org/works/12345",
  "type": "pdf" | "epub"
}
```

### How Downloads Work

1. **Puppeteer** launches headless Chromium
2. Navigate to AO3 URL, extract HTML from `#workskin`
3. For multi-chapter: find "Entire Work" link, navigate there
4. For series: recursively traverse `span.series a.next` links
5. Generate file:
   - **PDF:** `page.pdf()` with A4 format, headers/footers
   - **EPUB:** `epub-gen` library, temp file in `/tmp`
6. Return buffer with appropriate content-type

---

## Key Technologies

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind, Chrome APIs |
| Backend | Express.js, Puppeteer, epub-gen, Helmet, CORS |
| Deployment | Docker, PM2, Appwrite (legacy) |

---

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev      # Development
npm run build    # Build for Chrome extension
```

### Backend Server

```bash
cd backend-server
npm install
npm start        # Starts on port 8002
```

### Testing

```bash
cd test
node --experimental-vm-modules singleFileDownload.test.mjs
```

---

## Current State

- **Frontend:** Fully functional Chrome extension
- **Server (Appwrite):** Legacy, still works but being phased out
- **Backend Server:** New approach, recommended for development/self-hosting
- **Supported Sites:** Archive of Our Own (archiveofourown.org)
- **Output Formats:** PDF, EPUB
