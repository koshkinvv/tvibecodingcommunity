import { Express } from 'express';
import { userRoutes } from './userRoutes';
import { repositoryRoutes } from './repositoryRoutes';
import { adminRoutes } from './adminRoutes';
import { analyticsRoutes } from './analyticsRoutes';

export function registerModularRoutes(app: Express) {
  // API Routes with proper prefixes
  app.use('/api/user', userRoutes);
  app.use('/api/repositories', repositoryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', analyticsRoutes);
}