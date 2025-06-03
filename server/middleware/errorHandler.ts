import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '@shared/types';

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error(`Error in ${req.method} ${req.path}:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }

  if (error.name === 'UnauthorizedError' || error.message.includes('Not authenticated')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (error.name === 'ForbiddenError' || error.message.includes('Admin access required')) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: error.message || 'Resource not found'
    });
  }

  // Handle database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed'
    });
  }

  // Handle GitHub API errors
  if (error.message.includes('GitHub API error')) {
    return res.status(502).json({
      success: false,
      error: 'External service unavailable',
      details: 'GitHub API is currently unavailable'
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}