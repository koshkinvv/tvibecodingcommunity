import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

const router = Router();
const analyticsService = new AnalyticsService();

// Get platform statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getPlatformStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await analyticsService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get activity feed
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await analyticsService.getActivityFeed(limit);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get featured members
router.get('/members/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const members = await analyticsService.getFeaturedMembers(limit);
    res.json(members);
  } catch (error) {
    console.error('Error fetching featured members:', error);
    res.status(500).json({ error: 'Failed to fetch featured members' });
  }
});

// Get current week's viber
router.get('/viber', async (req: Request, res: Response) => {
  try {
    const viber = await analyticsService.getCurrentViber();
    res.json(viber);
  } catch (error) {
    console.error('Error fetching viber:', error);
    res.status(500).json({ error: 'Failed to fetch viber' });
  }
});

// Analyze user project (requires authentication)
router.post('/project/analyze', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { repositoryId } = req.body;
    
    if (repositoryId) {
      const analysis = await analyticsService.analyzeSpecificRepository(req.user.id, repositoryId);
      res.json(analysis);
    } else {
      const repositories = await analyticsService.getUserInsights(req.user.id);
      const analysis = await analyticsService.analyzeUserProject(req.user.id, repositories.repositories);
      res.json(analysis);
    }
  } catch (error) {
    console.error('Error analyzing project:', error);
    res.status(500).json({ error: 'Failed to analyze project' });
  }
});

export { router as analyticsRoutes };