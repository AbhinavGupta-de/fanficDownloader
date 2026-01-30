/**
 * Express application setup
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import downloadRoutes from './routes/download.routes.js';
import jobsRoutes from './routes/jobs.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Custom request logger
app.use(requestLogger);

// Routes
app.use('/api', downloadRoutes);
app.use('/api/jobs', jobsRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Fanfic Downloader Backend Server',
    version: '1.0.0',
    endpoints: {
      // Synchronous (blocking) - returns file directly
      sync: {
        singleChapter: 'POST /api/download/single-chapter',
        multiChapter: 'POST /api/download/multi-chapter',
        series: 'POST /api/download/series'
      },
      // Async (non-blocking) - returns job ID, poll for status
      async: {
        createJob: 'POST /api/jobs',
        getJobStatus: 'GET /api/jobs/:id',
        getJobResult: 'GET /api/jobs/:id/result',
        cancelJob: 'DELETE /api/jobs/:id',
        queueStats: 'GET /api/jobs/stats'
      },
      health: 'GET /api/health'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
