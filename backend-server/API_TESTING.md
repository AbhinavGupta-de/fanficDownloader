# API Testing Guide

This guide provides examples for testing all API endpoints of the Fanfic Downloader Backend Server.

## Prerequisites

- Server running on `http://localhost:8002`
- `curl` installed
- Valid AO3 URLs for testing

## Health Check

### Test if server is running
```bash
curl http://localhost:8002/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Fanfic Downloader API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Single Chapter Download

### Download as PDF
```bash
curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345/chapters/67890",
    "type": "pdf"
  }' \
  --output chapter.pdf
```

### Download as EPUB
```bash
curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345/chapters/67890",
    "type": "epub"
  }' \
  --output chapter.epub
```

### Test Error Handling - Missing URL
```bash
curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pdf"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "URL is required"
}
```

### Test Error Handling - Invalid Type
```bash
curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345/chapters/67890",
    "type": "invalid"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Type must be either \"pdf\" or \"epub\""
}
```

## Multi-Chapter Download (Entire Work)

### Download as PDF
```bash
curl -X POST http://localhost:8002/api/download/multi-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345",
    "type": "pdf"
  }' \
  --output story.pdf
```

### Download as EPUB
```bash
curl -X POST http://localhost:8002/api/download/multi-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345",
    "type": "epub"
  }' \
  --output story.epub
```

## Series Download

### Download as PDF
```bash
curl -X POST http://localhost:8002/api/download/series \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/series/12345",
    "type": "pdf"
  }' \
  --output series.pdf
```

### Download as EPUB
```bash
curl -X POST http://localhost:8002/api/download/series \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/series/12345",
    "type": "epub"
  }' \
  --output series.epub
```

## Using Postman

### 1. Health Check
- **Method:** GET
- **URL:** `http://localhost:8002/api/health`
- **Headers:** None required

### 2. Download Single Chapter
- **Method:** POST
- **URL:** `http://localhost:8002/api/download/single-chapter`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "url": "https://archiveofourown.org/works/12345/chapters/67890",
  "type": "pdf"
}
```

### 3. Download Multi-Chapter
- **Method:** POST
- **URL:** `http://localhost:8002/api/download/multi-chapter`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "url": "https://archiveofourown.org/works/12345",
  "type": "epub"
}
```

### 4. Download Series
- **Method:** POST
- **URL:** `http://localhost:8002/api/download/series`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "url": "https://archiveofourown.org/series/12345",
  "type": "pdf"
}
```

## Using JavaScript Fetch API

### Health Check
```javascript
fetch('http://localhost:8002/api/health')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Download Single Chapter
```javascript
fetch('http://localhost:8002/api/download/single-chapter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://archiveofourown.org/works/12345/chapters/67890',
    type: 'pdf'
  })
})
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chapter.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  })
  .catch(error => console.error('Error:', error));
```

### Download with Async/Await
```javascript
async function downloadChapter(url, type) {
  try {
    const response = await fetch('http://localhost:8002/api/download/single-chapter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `chapter.${type}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Download failed:', error);
  }
}

// Usage
downloadChapter('https://archiveofourown.org/works/12345/chapters/67890', 'pdf');
```

## Performance Testing

### Test Response Time
```bash
time curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345/chapters/67890",
    "type": "pdf"
  }' \
  --output chapter.pdf
```

### Load Testing with Apache Bench
```bash
# Install apache bench if not available
# sudo apt-get install apache2-utils

# Test health endpoint
ab -n 100 -c 10 http://localhost:8002/api/health
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "URL is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Route not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch chapter content: Navigation timeout of 60000 ms exceeded"
}
```

## Logs

Check server logs for detailed information:
```bash
# If running directly
tail -f /tmp/backend-server.log

# If running with supervisor
tail -f /var/log/supervisor/backend-server.out.log
tail -f /var/log/supervisor/backend-server.err.log
```

## Common Issues

### Connection Refused
**Issue:** `curl: (7) Failed to connect to localhost port 8002: Connection refused`
**Solution:** Ensure the server is running

### Timeout
**Issue:** Request takes too long and times out
**Solution:** The story might be very large. Increase timeout or try a smaller story

### Invalid URL
**Issue:** `Failed to fetch chapter content`
**Solution:** Verify the AO3 URL is correct and accessible

## Integration with Chrome Extension

The Chrome extension should call these endpoints:

```javascript
// In your extension's background script or content script
async function downloadStory(url, type, downloadType) {
  const endpoint = {
    'single': '/api/download/single-chapter',
    'multi': '/api/download/multi-chapter',
    'series': '/api/download/series'
  }[downloadType];

  try {
    const response = await fetch(`http://localhost:8002${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const blob = await response.blob();
    // Handle the blob download in your extension
    return blob;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
```

## Notes

- All endpoints return binary data (PDF/EPUB) on success
- Error responses are JSON format
- Requests may take 10-60 seconds depending on story size
- Large series can take several minutes
- The server logs all requests with timestamps and duration
