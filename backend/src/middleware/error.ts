import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database Error',
      message: 'Invalid request parameters'
    });
  }

  // Validation errors
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.message
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  });
}