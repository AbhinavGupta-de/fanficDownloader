# Migration from Appwrite Functions to Express Server

This document explains the differences between the original Appwrite serverless functions and the new Express.js backend server, and provides a migration guide.

## Overview

The original backend used Appwrite serverless functions that were deployed individually. The new backend is a unified Express.js server with multiple endpoints, providing better control, easier debugging, and simplified deployment.

## Key Differences

### Architecture

**Before (Appwrite):**
```
├── singleChapterFunc/
│   └── index.js (deployed as separate function)
├── multiChapterFunc/
│   └── index.js (deployed as separate function)
└── seriesFunc/
    └── index.js (deployed as separate function)
```

**After (Express):**
```
backend-server/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/          # Business logic from Appwrite functions
│   │   ├── singleChapter.service.js
│   │   ├── multiChapter.service.js
│   │   └── series.service.js
│   └── app.js
```

### Endpoint Changes

| Functionality | Appwrite Function | Express Endpoint |
|--------------|-------------------|------------------|
| Single Chapter | Custom Appwrite URL | `POST /api/download/single-chapter` |
| Multi Chapter | Custom Appwrite URL | `POST /api/download/multi-chapter` |
| Series | Custom Appwrite URL | `POST /api/download/series` |

### Request/Response Format

**Before (Appwrite):**
```javascript
export default async ({ req, res, log }) => {
  // Appwrite-specific request/response objects
  const { url, type } = req.body;
  return res.send(buffer, 200, { 'Content-Type': contentType });
};
```

**After (Express):**
```javascript
export async function handler(req, res, next) {
  // Standard Express request/response
  const { url, type } = req.body;
  res.setHeader('Content-Type', contentType);
  res.send(buffer);
}
```

## Code Changes

### 1. Chromium Installation

**Before (Appwrite):**
```javascript
// Had to install Chromium on every cold start
if (!installed) {
  execSync('apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont');
  installed = true;
}
```

**After (Express):**
```javascript
// Chromium is installed once in the Docker image or server setup
// No runtime installation needed
```

### 2. Logging

**Before (Appwrite):**
```javascript
export default async ({ req, res, log }) => {
  log('Processing request');
  log(`URL: ${url}`);
};
```

**After (Express):**
```javascript
import logger from '../utils/logger.js';

logger.info('Processing request', { url });
logger.error('Error occurred', { error: err.message });
```

### 3. Error Handling

**Before (Appwrite):**
```javascript
try {
  // logic
} catch (err) {
  return res.send({ error: err.toString() }, 500);
}
```

**After (Express):**
```javascript
try {
  // logic
} catch (error) {
  next(error); // Handled by global error middleware
}
```

### 4. Puppeteer Configuration

**Before (Appwrite):**
```javascript
// Hardcoded in each function
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});
```

**After (Express):**
```javascript
// Centralized configuration
import { getBrowserConfig } from '../utils/puppeteerConfig.js';
const browser = await puppeteer.launch(getBrowserConfig());
```

## Frontend Migration

### Appwrite Function Calls

**Before:**
```javascript
// frontend/src/api/fetchSingleChapter.js
const response = await fetch('https://appwrite-function-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': 'project-id',
  },
  body: JSON.stringify({ url, type })
});
```

**After:**
```javascript
// Update to call Express server
const response = await fetch('http://localhost:8002/api/download/single-chapter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url, type })
});
```

### Environment Variables

Create a `.env` file in your frontend:

```env
REACT_APP_API_URL=http://localhost:8002
```

Then update API calls:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

async function downloadChapter(url, type) {
  const response = await fetch(`${API_URL}/api/download/single-chapter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type })
  });
  return response;
}
```

## Benefits of Migration

### 1. **Unified Deployment**
- Single server instead of multiple function deployments
- Easier to manage and monitor
- Consistent versioning

### 2. **Better Development Experience**
- Local development without Appwrite SDK
- Standard Express.js patterns
- Hot reload in development

### 3. **Improved Error Handling**
- Centralized error middleware
- Consistent error responses
- Better logging and debugging

### 4. **Cost Optimization**
- No cold starts (server always running)
- No per-function pricing
- Predictable hosting costs

### 5. **Easier Testing**
- Standard HTTP testing with curl, Postman, etc.
- No Appwrite-specific testing setup
- Unit tests for services

### 6. **Better Monitoring**
- Standard logging to files
- Can integrate with any monitoring service
- Request/response tracking

## Deployment Options

### Option 1: Traditional Server
```bash
# Install dependencies
npm install

# Start server
npm start
```

### Option 2: Docker
```bash
# Build image
docker build -t fanfic-backend .

# Run container
docker run -p 8002:8002 fanfic-backend
```

### Option 3: Docker Compose
```bash
docker-compose up -d
```

### Option 4: Supervisor (Recommended for production)
```bash
# Copy supervisor config
sudo cp supervisor.conf /etc/supervisor/conf.d/backend-server.conf

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start backend-server
```

## Backward Compatibility

To maintain backward compatibility during migration, you can:

1. **Run both systems in parallel**
   - Keep Appwrite functions running
   - Deploy Express server on different port
   - Gradually migrate frontend calls

2. **Use a proxy**
   - Route old Appwrite URLs to Express endpoints
   - Nginx or API Gateway configuration

3. **Feature flag**
   - Add feature flag in frontend
   - Switch between Appwrite and Express based on flag

```javascript
const USE_NEW_BACKEND = process.env.REACT_APP_USE_NEW_BACKEND === 'true';

const API_URL = USE_NEW_BACKEND 
  ? 'http://localhost:8002/api'
  : 'https://appwrite-function-url';
```

## Performance Comparison

| Metric | Appwrite Functions | Express Server |
|--------|-------------------|----------------|
| Cold Start | 2-5 seconds | None (always warm) |
| Request Time | Variable | Consistent |
| Concurrent Requests | Limited by function instances | Limited by server resources |
| Memory Usage | Per function | Shared across endpoints |
| Cost | Per invocation | Fixed hosting cost |

## Testing Migration

### 1. Test Health Endpoint
```bash
curl http://localhost:8002/api/health
```

### 2. Test Single Chapter (Compare with Appwrite)
```bash
# New Express endpoint
time curl -X POST http://localhost:8002/api/download/single-chapter \
  -H "Content-Type: application/json" \
  -d '{"url":"AO3_URL","type":"pdf"}' \
  -o express-chapter.pdf

# Old Appwrite function
time curl -X POST https://appwrite-url \
  -H "Content-Type: application/json" \
  -d '{"url":"AO3_URL","type":"pdf"}' \
  -o appwrite-chapter.pdf

# Compare files
diff express-chapter.pdf appwrite-chapter.pdf
```

### 3. Load Testing
```bash
# Test Express server
ab -n 100 -c 10 http://localhost:8002/api/health

# Compare with Appwrite function performance
```

## Rollback Plan

If issues occur during migration:

1. **Keep Appwrite functions active**
   - Don't delete functions immediately
   - Keep them as backup for 30 days

2. **Frontend rollback**
   - Use feature flags to switch back
   - Update environment variables

3. **Database/Storage**
   - No database changes needed
   - Files are generated on-the-fly

## Migration Checklist

- [ ] Deploy Express server
- [ ] Test all endpoints with real AO3 URLs
- [ ] Update frontend API calls
- [ ] Update environment variables
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Test in staging environment
- [ ] Gradual rollout to production
- [ ] Monitor error rates
- [ ] Keep Appwrite functions active for 30 days
- [ ] Complete migration and deactivate Appwrite functions

## Support

For issues during migration:
- Check logs: `tail -f /var/log/supervisor/backend-server.out.log`
- Test endpoints: See `API_TESTING.md`
- GitHub issues: Open issue with [MIGRATION] tag

## Conclusion

The migration from Appwrite serverless functions to Express server provides:
- Better developer experience
- Improved performance (no cold starts)
- Easier debugging and monitoring
- More control over deployment
- Cost optimization

The migration is straightforward and can be done gradually with minimal downtime.
