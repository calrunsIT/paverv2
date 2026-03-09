import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { scanRoutes } from './routes/scan';
import { businessRoutes } from './routes/business';
import { statsRoutes } from './routes/stats';
import { deployRoutes } from './routes/deploy';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 4500;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'paver',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve generated preview sites (no auth required)
app.use('/previews', express.static(path.join(process.cwd(), 'previews')));

// API routes (all require auth)
app.use('/api', authMiddleware);
app.use('/api/scan', scanRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/deploy', deployRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Paver server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 API endpoints require authentication header: X-API-Key`);
});

export default app;