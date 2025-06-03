import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AnalyticsService } from '../services/AnalyticsService';
import { z } from 'zod';

const router = Router();
const userService = new UserService();
const analyticsService = new AnalyticsService();

// Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const profile = await userService.getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user progress
router.get('/progress/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const progress = await userService.getUserProgress(userId);
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update user settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const updateSchema = z.object({
      notificationPreference: z.enum(['email', 'telegram', 'both']).optional(),
      telegramId: z.string().optional()
    });

    const validatedData = updateSchema.parse(req.body);
    const updatedUser = await userService.updateUser(req.user.id, validatedData);
    
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user insights
router.get('/insights/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user is viewing their own insights or is admin
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const insights = await analyticsService.getUserInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error('Error fetching user insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export { router as userRoutes };