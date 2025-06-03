import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '@shared/types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      githubId: string;
      username: string;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
      githubToken: string | null;
      telegramId: string | null;
      notificationPreference: string | null;
      onVacation: boolean | null;
      vacationUntil: Date | null;
      isAdmin: boolean | null;
      lastActive: Date | null;
      createdAt: Date | null;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (!req.user.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }
  
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Allow both authenticated and unauthenticated access
  next();
}

export function requireOwnershipOrAdmin(resourceUserId: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (req.user.id !== resourceUserId && !req.user.isAdmin) {
      throw new ForbiddenError('Access denied: insufficient permissions');
    }
    
    next();
  };
}