# Fanfic Downloader Backend Server

A robust Express.js backend server for the Fanfic Downloader Chrome Extension. This server provides REST API endpoints for downloading fanfiction from Archive of Our Own (AO3) in PDF or EPUB formats.

## Features

- ✅ Download single chapters
- ✅ Download entire works (multi-chapter)
- ✅ Download complete series
- ✅ Export as PDF or EPUB
- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Request logging
- ✅ CORS support
- ✅ Security headers (Helmet)
- ✅ Graceful shutdown

## Architecture

```
backend-server/
├── src/
│   ├── routes/              # API route definitions
│   │   └── download.routes.js
│   ├── controllers/         # Request handlers
│   │   └── download.controller.js
│   ├── services/            # Business logic
│   │   ├── singleChapter.service.js
│   │   ├── multiChapter.service.js
│   │   └── series.service.js
│   ├── utils/               # Utility functions
│   │   ├── logger.js
│   │   └── puppeteerConfig.js
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── package.json
├── .env
└── README.md
```

## Prerequisites

- Node.js >= 18.x
- Chromium browser installed
- npm or yarn

## Installation

1. Navigate to the backend-server directory:
```bash
cd /app/backend-server
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Environment Variables

```env
# Server Configuration
PORT=8002
NODE_ENV=development

# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Running the Server

### Development Mode
```bash
yarn start
# or
npm start
```

### Development with Watch Mode (Node 18+)
```bash
yarn dev
# or
npm run dev
```

The server will start on `http://localhost:8002` (or the port specified in `.env`)

## API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Fanfic Downloader API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Download Single Chapter
```
POST /api/download/single-chapter
```

**Request Body:**
```json
{
  "url": "https://archiveofourown.org/works/12345/chapters/67890",
  "type": "pdf"
}
```

**Parameters:**
- `url` (string, required): AO3 chapter URL
- `type` (string, required): Output format - `"pdf"` or `"epub"`

**Response:**
- Binary file (PDF or EPUB)

### Download Multi-Chapter (Entire Work)
```
POST /api/download/multi-chapter
```

**Request Body:**
```json
{
  "url": "https://archiveofourown.org/works/12345",
  "type": "epub"
}
```

**Parameters:**
- `url` (string, required): AO3 work URL
- `type` (string, required): Output format - `"pdf"` or `"epub"`

**Response:**
- Binary file (PDF or EPUB)

### Download Series
```
POST /api/download/series
```

**Request Body:**
```json
{
  "url": "https://archiveofourown.org/series/12345",
  "type": "pdf"
}
```

**Parameters:**
- `url` (string, required): AO3 series URL
- `type` (string, required): Output format - `"pdf"` or `"epub"`

**Response:**
- Binary file (PDF or EPUB)

## Testing with cURL

### Test Health Endpoint
```bash
curl http://localhost:8002/api/health
```

### Download Single Chapter
```bash
curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345/chapters/67890",
    "type": "pdf"
  }' \
  --output chapter.pdf
```

### Download Entire Work
```bash
curl -X POST http://localhost:8002/api/download/multi-chapter \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/works/12345",
    "type": "epub"
  }' \
  --output story.epub
```

### Download Series
```bash
curl -X POST http://localhost:8002/api/download/series \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://archiveofourown.org/series/12345",
    "type": "pdf"
  }' \
  --output series.pdf
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

## Logging

The server uses a custom logger that outputs structured logs:

```
[2024-01-01T12:00:00.000Z] [INFO] Server started successfully {"port":8002,"environment":"development"}
[2024-01-01T12:00:01.000Z] [INFO] Request completed {"method":"POST","path":"/api/download/single-chapter","statusCode":200,"duration":"3456ms"}
```

## Dependencies

### Production
- **express** - Web framework
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **dotenv** - Environment variable management
- **puppeteer** - Headless browser for web scraping
- **epub-gen** - EPUB generation

### Development
- Node.js built-in watch mode for development

## Deployment

### Using Supervisor (Recommended)

Create `/etc/supervisor/conf.d/backend-server.conf`:

```ini
[program:backend-server]
command=node src/server.js
directory=/app/backend-server
autostart=true
autorestart=true
environment=NODE_ENV="production"
stderr_logfile=/var/log/supervisor/backend-server.err.log
stdout_logfile=/var/log/supervisor/backend-server.out.log
stopsignal=TERM
stopwaitsecs=30
stopasgroup=true
killasgroup=true
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start backend-server
```

### Using PM2

```bash
pm2 start src/server.js --name fanfic-backend
pm2 save
pm2 startup
```

## Performance Considerations

- Large stories may take several minutes to process
- PDF generation is more resource-intensive than EPUB
- Series downloads can be time-consuming depending on the number of works
- Consider implementing request queuing for high traffic

## Security

- CORS is configured to only allow specific origins
- Helmet provides security headers
- Input validation on all endpoints
- No sensitive data stored

## Troubleshooting

### Chromium Not Found
Ensure Chromium is installed and the path is correct in `.env`:
```bash
which chromium-browser
# Update PUPPETEER_EXECUTABLE_PATH in .env
```

### Memory Issues
Puppeteer can be memory-intensive. Increase Node.js memory if needed:
```bash
NODE_OPTIONS="--max-old-space-size=4096" node src/server.js
```

### Timeout Errors
Increase timeout in puppeteer configuration for slow connections:
```javascript
// In services, modify timeout
await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Author

Abhinav Gupta

## Related Projects

- [Fanfic Downloader Chrome Extension](../frontend)
- [Website](../website)

## Support

For issues and questions, please open an issue on GitHub or contact the maintainer.
