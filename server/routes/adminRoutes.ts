import { Router, Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { z } from 'zod';

const router = Router();
const adminService = new AdminService();

// Middleware to check admin permissions
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users with admin data
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Set user vacation status
router.put('/users/:id/vacation', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const vacationSchema = z.object({
      onVacation: z.boolean(),
      vacationUntil: z.string().optional()
    });

    const { onVacation, vacationUntil } = vacationSchema.parse(req.body);
    const updatedUser = await adminService.setUserVacation(userId, onVacation, vacationUntil);
    
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error setting user vacation:', error);
    res.status(500).json({ error: 'Failed to update user vacation status' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    await adminService.deleteUser(userId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Trigger manual repository check
router.post('/check-repositories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await adminService.triggerRepositoryCheck();
    res.json(result);
  } catch (error) {
    console.error('Error triggering repository check:', error);
    res.status(500).json({ error: 'Failed to trigger repository check' });
  }
});

// Get system statistics
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Control repository check scheduler
router.post('/scheduler/start', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await adminService.scheduleRepositoryCheck();
    res.json(result);
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

router.post('/scheduler/stop', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await adminService.stopRepositoryCheck();
    res.json(result);
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

// Get detailed user activity
router.get('/users/:id/activity', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const activity = await adminService.getUserActivity(userId);
    
    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

export { router as adminRoutes };