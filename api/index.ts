import express from 'express';
import { apiRouter } from '../src/server/apiRouter.js';

const app = express();

// CORS setup for Vercel Serverless
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Mount all DataHub API routes under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DataHub Enterprise API (Serverless Vercel)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default app;
