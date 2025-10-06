# Docker Deployment Guide for Fanfic Downloader Website

This guide explains how to build and run the Fanfic Downloader website using Docker.

## Files Created

- `Dockerfile` - Multi-stage production-ready Docker image
- `.dockerignore` - Excludes unnecessary files from Docker build
- `next.config.mjs` - Updated with standalone output configuration

## Prerequisites

- Docker installed on your system
- Node.js 18+ (for local development)

## Building the Docker Image

```bash
cd /app/website
docker build -t fanfic-website:latest .
```

The Dockerfile uses a multi-stage build process:
1. **deps** - Installs dependencies
2. **builder** - Builds the Next.js application
3. **runner** - Creates a minimal production image

## Running the Container

### Basic Run

```bash
docker run -p 3001:3000 fanfic-website:latest
```

The website will be available at `http://localhost:3001`

### Run with Environment Variables

```bash
docker run -p 3001:3000 \
  -e NODE_ENV=production \
  fanfic-website:latest
```

### Run in Background (Detached Mode)

```bash
docker run -d -p 3001:3000 --name fanfic-website fanfic-website:latest
```

### View Logs

```bash
docker logs fanfic-website
docker logs -f fanfic-website  # Follow logs
```

### Stop Container

```bash
docker stop fanfic-website
docker rm fanfic-website
```

## Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  website:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

## Current Setup (Supervisor)

The website is currently configured to run via supervisor at:
- **URL**: http://localhost:3001
- **Config**: `/etc/supervisor/conf.d/website.conf`
- **Logs**: 
  - stdout: `/var/log/supervisor/website.out.log`
  - stderr: `/var/log/supervisor/website.err.log`

### Supervisor Commands

```bash
# Check status
sudo supervisorctl status website

# Start/Stop/Restart
sudo supervisorctl start website
sudo supervisorctl stop website
sudo supervisorctl restart website

# View logs
tail -f /var/log/supervisor/website.out.log
```

## Production Optimizations

The Docker setup includes:
- ✅ Multi-stage build for minimal image size
- ✅ Next.js standalone output mode
- ✅ Non-root user for security
- ✅ Optimized layer caching
- ✅ Production-ready configuration

## Troubleshooting

### Container won't start
Check logs: `docker logs fanfic-website`

### Port already in use
Change the host port: `docker run -p 3002:3000 fanfic-website:latest`

### Build fails
Ensure you're in the `/app/website` directory and have the latest code

## Image Size

The final image size should be approximately 150-200MB thanks to:
- Alpine Linux base image
- Standalone Next.js output
- Multi-stage build process
- Minimal runtime dependencies

## Next Steps

1. Push to Docker registry (optional)
2. Deploy to Kubernetes/Cloud Run
3. Set up CI/CD pipeline
4. Configure monitoring and logging

## Links

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
