import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createAppError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  let { statusCode = 500, message } = err;

  // Handle specific error types
  if (err.message.includes('GitHub token is invalid')) {
    statusCode = 401;
    message = 'GitHub authentication expired. Please log in again.';
  } else if (err.message.includes('GitHub API rate limit')) {
    statusCode = 429;
    message = 'GitHub API rate limit exceeded. Please try again later.';
  } else if (err.message.includes('GEMINI_API_KEY')) {
    statusCode = 500;
    message = 'AI service temporarily unavailable.';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
  }

  // Log error for debugging
  console.error(`Error ${statusCode}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}