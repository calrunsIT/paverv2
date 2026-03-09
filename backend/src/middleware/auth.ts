import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.PAVER_API_KEY;

  if (!validApiKey) {
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'API key not configured on server'
    });
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Include X-API-Key header.'
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
}