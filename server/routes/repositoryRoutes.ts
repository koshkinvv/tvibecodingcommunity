import { Router, Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';
import { githubClient } from '../github';
import { z } from 'zod';
import { insertRepositorySchema } from '@shared/schema';

const router = Router();
const repositoryService = new RepositoryService();

// Get user repositories
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check if user is viewing their own repos or is admin
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const repositories = await repositoryService.getUserRepositories(userId);
    res.json(repositories);
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get current user repositories
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositories = await repositoryService.getUserRepositories(req.user.id);
    res.json(repositories);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Add new repository
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const addRepoSchema = z.object({
      name: z.string().min(1).max(100),
      fullName: z.string().regex(/^[\w\-\.]+\/[\w\-\.]+$/)
    });

    const validatedData = addRepoSchema.parse(req.body);
    const repository = await repositoryService.addRepository(req.user.id, validatedData);
    
    res.status(201).json(repository);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error adding repository:', error);
    res.status(500).json({ error: 'Failed to add repository' });
  }
});

// Delete repository
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = parseInt(req.params.id);
    await repositoryService.deleteRepository(repositoryId, req.user.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting repository:', error);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

// Update repository visibility
router.patch('/:id/visibility', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = parseInt(req.params.id);
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean' });
    }

    const updatedRepo = await repositoryService.updateRepositoryVisibility(
      repositoryId, 
      req.user.id, 
      isPublic
    );
    
    res.json(updatedRepo);
  } catch (error) {
    console.error('Error updating repository visibility:', error);
    res.status(500).json({ error: 'Failed to update repository' });
  }
});

// Generate AI description
router.post('/:id/generate-description', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = parseInt(req.params.id);
    const result = await repositoryService.generateDescription(repositoryId, req.user.id);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

// Sync repository with GitHub
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = parseInt(req.params.id);
    const repository = await storage.getRepository(repositoryId);
    
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (repository.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedRepo = await repositoryService.syncWithGitHub(repository, req.user.githubToken);
    res.json(updatedRepo);
  } catch (error) {
    console.error('Error syncing repository:', error);
    res.status(500).json({ error: 'Failed to sync repository' });
  }
});

// Add comment to repository
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const repositoryId = parseInt(req.params.id);
    const commentSchema = z.object({
      content: z.string().min(1).max(1000)
    });

    const { content } = commentSchema.parse(req.body);
    const comment = await repositoryService.addComment(repositoryId, req.user.id, content);
    
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get repository comments
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const repositoryId = parseInt(req.params.id);
    const comments = await repositoryService.getRepositoryComments(repositoryId);
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export { router as repositoryRoutes };