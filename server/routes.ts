import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { githubClient } from "./github";
import { scheduler } from "./scheduler";
import { projectAnalyzer } from "./project-analyzer";
import { geminiService } from "./gemini";
import { z } from "zod";
import { insertRepositorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize auth middleware
  const auth = setupAuth(app);
  
  // Add mock login endpoint for testing
  app.get('/api/mock-login', (req, res) => {
    if (!req.user) {
      const mockUser = {
        id: 1,
        githubId: 'mock123',
        username: 'mockuser',
        name: 'Mock User',
        email: 'mock@example.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        telegramId: null,
        notificationPreference: 'email',
        onVacation: false,
        vacationUntil: null,
        isAdmin: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      // @ts-ignore - Set the mock user in session for testing
      req.login(mockUser, () => {
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  });

  // Add mock login endpoint for user 2 (nskob)
  app.get('/api/mock-login-user2', async (req, res) => {
    try {
      const user = await storage.getUser(2);
      if (user) {
        // @ts-ignore - Set the user in session for testing
        req.login(user, () => {
          res.redirect('/');
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error logging in as user 2' });
    }
  });
  
  // Initialize the scheduler for daily checks
  scheduler.startDailyCheck();
  
  // User endpoints
  app.get("/api/users", auth.isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Get statistics for home page
  app.get("/api/stats", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const allRepos = await Promise.all(
        users.map(user => storage.getRepositoriesByUser(user.id))
      );
      
      // Flatten all repositories
      const repositories = allRepos.flat();
      
      // Count active members (those with at least one active repo)
      const activeMembers = new Set();
      
      repositories.forEach(repo => {
        if (repo.status === 'active') {
          activeMembers.add(repo.userId);
        }
      });
      
      // Get current viber of the week
      const viber = await storage.getCurrentViber();
      
      // Return stats
      res.json({
        totalMembers: users.length,
        activeMembers: activeMembers.size,
        totalRepositories: repositories.length,
        viberOfTheWeek: viber ? {
          id: viber.id,
          username: viber.username,
          name: viber.name,
          avatarUrl: viber.avatarUrl
        } : null
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  
  // Activity feed route - requires authentication
  app.get("/api/activity", auth.isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getActivityFeed(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ error: "Failed to fetch activity feed" });
    }
  });

  // Get user repositories - requires authentication
  app.get("/api/user/repositories", auth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const repositories = await storage.getRepositoriesByUser(userId);
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Project analysis route - requires authentication
  app.get("/api/project/analysis", auth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const repositoryId = req.query.repositoryId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Если указан конкретный репозиторий, анализируем только его
      if (repositoryId) {
        const repository = await storage.getRepository(parseInt(repositoryId));
        if (!repository || repository.userId !== userId) {
          return res.status(404).json({ error: "Repository not found" });
        }
        
        // Используем специализированный анализ для конкретного репозитория
        const analysis = await projectAnalyzer.analyzeSpecificRepository(user, repository);
        return res.json(analysis);
      }

      // Общий анализ всех репозиториев пользователя
      const repositories = await storage.getRepositoriesByUser(userId);
      const analysis = await projectAnalyzer.analyzeUserProject(user, repositories);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project:", error);
      res.status(500).json({ error: "Failed to analyze project" });
    }
  });

  // Get featured members for home page
  app.get("/api/members/featured", async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Get 3 random active users
      const activeUsers = [];
      
      for (const user of users) {
        const repos = await storage.getRepositoriesByUser(user.id);
        const activeRepoCount = repos.filter(r => r.status === 'active').length;
        
        if (activeRepoCount > 0) {
          activeUsers.push({
            id: user.id,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            activeRepoCount
          });
        }
      }
      
      // Shuffle and take up to 3
      const shuffled = activeUsers.sort(() => 0.5 - Math.random());
      const featured = shuffled.slice(0, 3);
      
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured members:", error);
      res.status(500).json({ error: "Failed to fetch featured members" });
    }
  });
  
  // User profile
  app.get("/api/profile", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const repositories = await storage.getRepositoriesByUser(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          notificationPreference: user.notificationPreference,
          onVacation: user.onVacation,
          vacationUntil: user.vacationUntil
        },
        repositories
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  // Update user profile
  app.patch("/api/profile", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate request
      const updateSchema = z.object({
        notificationPreference: z.enum(['email', 'telegram']).optional(),
        telegramId: z.string().nullable().optional(),
        onVacation: z.boolean().optional(),
        vacationUntil: z.string().nullable().optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid profile data', details: validationResult.error });
      }
      
      // Process vacation date if provided
      let vacationUntil = null;
      if (req.body.onVacation === true && req.body.vacationUntil) {
        vacationUntil = new Date(req.body.vacationUntil);
        
        // Set default vacation period to 2 weeks if date is invalid
        if (isNaN(vacationUntil.getTime())) {
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
          vacationUntil = twoWeeksFromNow;
        }
      }
      
      // Update user
      const updatedUser = await storage.updateUser(user.id, {
        ...validationResult.data,
        vacationUntil
      });
      
      res.json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Repository endpoints
  app.get("/api/repositories", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const repositories = await storage.getRepositoriesByUser(user.id);
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Get user's GitHub repositories
  app.get("/api/github/repositories", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user.githubToken) {
        return res.status(401).json({ error: "GitHub token not available" });
      }
      
      githubClient.setToken(user.githubToken);
      const repositories = await githubClient.getUserRepositories();
      
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      res.status(500).json({ error: "Failed to fetch GitHub repositories" });
    }
  });
  
  // Add repository
  app.post("/api/repositories", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Extend schema to validate GitHub repo format, excluding userId since it's set automatically
      const addRepoSchema = insertRepositorySchema.omit({ userId: true }).extend({
        fullName: z.string().regex(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/, 
          'Repository must be in format "username/repository"')
      });
      
      const validationResult = addRepoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid repository data', details: validationResult.error });
      }
      
      // Check if repository exists on GitHub
      if (user.githubToken) {
        githubClient.setToken(user.githubToken);
      }
      
      const repoExists = await githubClient.checkRepositoryExists(req.body.fullName);
      if (!repoExists) {
        return res.status(404).json({ error: 'Repository not found on GitHub or you don\'t have access to it' });
      }
      
      // Check if repository is already added
      const existingRepos = await storage.getRepositoriesByUser(user.id);
      if (existingRepos.some(r => r.fullName === req.body.fullName)) {
        return res.status(409).json({ error: 'Repository already added' });
      }
      
      // Create repository
      const repository = await storage.createRepository({
        userId: user.id,
        name: req.body.name,
        fullName: req.body.fullName
      });
      
      // Try to fetch last commit date and generate description
      try {
        const lastCommitDate = await githubClient.getLastCommitDate(repository);
        const status = githubClient.calculateRepositoryStatus(lastCommitDate);
        
        // Generate AI description for the project
        let description = null;
        let descriptionGeneratedAt = null;
        try {
          description = await geminiService.generateProjectDescription(repository, user);
          descriptionGeneratedAt = new Date();
        } catch (error) {
          console.error("Error generating project description:", error);
        }
        
        await storage.updateRepository(repository.id, {
          lastCommitDate,
          status,
          description,
          descriptionGeneratedAt
        });
        
        // Return updated repository
        const updatedRepo = await storage.getRepository(repository.id);
        res.status(201).json(updatedRepo);
      } catch (error) {
        // Still try to generate description even if commit data failed
        try {
          const description = await geminiService.generateProjectDescription(repository, user);
          await storage.updateRepository(repository.id, {
            description,
            descriptionGeneratedAt: new Date()
          });
        } catch (descError) {
          console.error("Error generating project description:", descError);
        }
        
        console.error("Error fetching initial commit data:", error);
        const updatedRepo = await storage.getRepository(repository.id);
        res.status(201).json(updatedRepo || repository);
      }
    } catch (error) {
      console.error("Error adding repository:", error);
      res.status(500).json({ error: "Failed to add repository" });
    }
  });

  // Add multiple repositories
  app.post("/api/repositories/multiple", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { repositoryNames } = req.body;
      
      if (!Array.isArray(repositoryNames) || repositoryNames.length === 0) {
        return res.status(400).json({ error: 'Repository names array is required' });
      }

      const results = {
        added: [] as any[],
        skipped: [] as any[],
        errors: [] as any[]
      };

      // Get existing repositories to avoid duplicates
      const existingRepos = await storage.getRepositoriesByUser(user.id);
      const existingFullNames = new Set(existingRepos.map(r => r.fullName));

      for (const fullName of repositoryNames) {
        try {
          // Skip if already exists
          if (existingFullNames.has(fullName)) {
            results.skipped.push({ fullName, reason: 'Already exists' });
            continue;
          }

          // Validate format
          if (!fullName.match(/^[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/)) {
            results.errors.push({ fullName, reason: 'Invalid format' });
            continue;
          }

          // Extract repository name
          const name = fullName.split('/')[1];

          // Check if repository exists on GitHub (if we have a token)
          if (user.githubToken) {
            githubClient.setToken(user.githubToken);
            const exists = await githubClient.checkRepositoryExists(fullName);
            if (!exists) {
              results.errors.push({ fullName, reason: 'Repository not found on GitHub' });
              continue;
            }
          }

          // Create repository
          const repository = await storage.createRepository({
            userId: user.id,
            name,
            fullName,
            lastCommitDate: null
          });

          results.added.push({
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName,
            status: repository.status
          });

        } catch (error) {
          console.error(`Error adding repository ${fullName}:`, error);
          results.errors.push({ fullName, reason: 'Server error' });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error adding multiple repositories:", error);
      res.status(500).json({ error: "Failed to add repositories" });
    }
  });
  
  // Remove repository
  app.delete("/api/repositories/:id", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const repoId = parseInt(req.params.id);
      
      if (isNaN(repoId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }
      
      // Check if repository exists and belongs to user
      const repository = await storage.getRepository(repoId);
      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      if (repository.userId !== user.id) {
        return res.status(403).json({ error: 'You don\'t have permission to delete this repository' });
      }
      
      // Delete repository
      await storage.deleteRepository(repoId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing repository:", error);
      res.status(500).json({ error: "Failed to remove repository" });
    }
  });
  
  // Generate repository description
  app.post("/api/repositories/:id/generate-description", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const repoId = parseInt(req.params.id);
      
      // Get repository and verify ownership
      const repository = await storage.getRepository(repoId);
      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      if (repository.userId !== user.id) {
        return res.status(403).json({ error: 'You don\'t have permission to modify this repository' });
      }
      
      // Generate description using AI
      try {
        const description = await geminiService.generateProjectDescription(repository, user);
        
        // Update repository with new description
        const updatedRepo = await storage.updateRepository(repoId, {
          description,
          descriptionGeneratedAt: new Date()
        });
        
        res.json({ 
          success: true, 
          description,
          repository: updatedRepo
        });
      } catch (error) {
        console.error("Error generating project description:", error);
        res.status(500).json({ error: "Failed to generate project description" });
      }
    } catch (error) {
      console.error("Error in generate description endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Community members endpoint
  app.get("/api/community", auth.isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const community = [];
      
      for (const user of users) {
        const repositories = await storage.getRepositoriesByUser(user.id);
        
        // Update repository statuses with fresh data from GitHub if we have a token
        const updatedRepositories = [];
        for (const repo of repositories) {
          let updatedRepo = { ...repo };
          
          if (user.githubToken) {
            try {
              githubClient.setToken(user.githubToken);
              const lastCommitDate = await githubClient.getLastCommitDate(repo);
              const newStatus = githubClient.calculateRepositoryStatus(lastCommitDate);
              
              // Update the repository in storage if status changed
              const needsUpdate = newStatus !== repo.status || 
                  (lastCommitDate && repo.lastCommitDate && lastCommitDate.getTime() !== new Date(repo.lastCommitDate).getTime()) ||
                  (!lastCommitDate && repo.lastCommitDate) ||
                  (lastCommitDate && !repo.lastCommitDate);
              
              if (needsUpdate) {
                updatedRepo = await storage.updateRepository(repo.id, {
                  status: newStatus,
                  lastCommitDate: lastCommitDate as any // Type assertion for compatibility
                }) || repo;
              }
            } catch (error) {
              console.error(`Error updating repository ${repo.fullName}:`, error);
            }
          }
          
          updatedRepositories.push(updatedRepo);
        }
        
        // Calculate overall status based on updated repositories
        let overallStatus = 'inactive';
        if (updatedRepositories.some(r => r.status === 'active')) {
          overallStatus = 'active';
        } else if (updatedRepositories.some(r => r.status === 'warning')) {
          overallStatus = 'warning';
        }
        
        community.push({
          id: user.id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          status: overallStatus,
          repositories: updatedRepositories.map(r => ({
            id: r.id,
            name: r.name,
            fullName: r.fullName,
            status: r.status,
            lastCommitDate: r.lastCommitDate
          }))
        });
      }
      
      // Apply filters if provided
      const { status, search } = req.query;
      let filtered = community;
      
      if (status && ['active', 'warning', 'inactive'].includes(status as string)) {
        filtered = filtered.filter(member => member.status === status);
      }
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(member => 
          member.username.toLowerCase().includes(searchLower) || 
          (member.name && member.name.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching community members:", error);
      res.status(500).json({ error: "Failed to fetch community members" });
    }
  });

  // Get user progress
  app.get("/api/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const progress = await storage.getUserProgress(userId);
      if (!progress) {
        // Create initial progress for user
        const newProgress = await storage.createUserProgress({
          userId,
          totalCommits: 0,
          activeDays: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          experience: 0,
          badges: []
        });
        return res.json(newProgress);
      }

      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Get leaderboard with user progress
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const leaderboard = [];

      for (const user of users) {
        let progress = await storage.getUserProgress(user.id);
        
        if (!progress) {
          // Create initial progress for users who don't have it
          progress = await storage.createUserProgress({
            userId: user.id,
            totalCommits: 0,
            activeDays: 0,
            currentStreak: 0,
            longestStreak: 0,
            level: 1,
            experience: 0,
            badges: []
          });
        }

        leaderboard.push({
          user,
          progress
        });
      }

      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  
  // Admin endpoints
  app.get("/api/admin/users", auth.isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const detailedUsers = [];
      
      for (const user of users) {
        const repositories = await storage.getRepositoriesByUser(user.id);
        
        // Find last activity date
        let lastActivity = user.lastActive;
        const activeRepo = repositories.find(r => r.status === 'active');
        
        if (activeRepo && activeRepo.lastCommitDate) {
          const repoDate = new Date(activeRepo.lastCommitDate);
          const userDate = user.lastActive ? new Date(user.lastActive) : new Date(0);
          lastActivity = repoDate > userDate ? activeRepo.lastCommitDate : user.lastActive;
        }
        
        // Calculate overall status
        let status = 'inactive';
        if (repositories.some(r => r.status === 'active')) {
          status = 'active';
        } else if (repositories.some(r => r.status === 'warning')) {
          status = 'warning';
        }
        
        detailedUsers.push({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          status,
          repositoryCount: repositories.length,
          lastActivity,
          onVacation: user.onVacation
        });
      }
      
      res.json(detailedUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users for admin" });
    }
  });
  
  // Admin - view user details
  app.get("/api/admin/users/:id", auth.isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const repositories = await storage.getRepositoriesByUser(userId);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          githubId: user.githubId,
          notificationPreference: user.notificationPreference,
          telegramId: user.telegramId,
          onVacation: user.onVacation,
          vacationUntil: user.vacationUntil,
          isAdmin: user.isAdmin,
          lastActive: user.lastActive,
          createdAt: user.createdAt
        },
        repositories
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });
  
  // Admin - update user status
  app.patch("/api/admin/users/:id", auth.isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Validate request
      const updateSchema = z.object({
        isAdmin: z.boolean().optional(),
        onVacation: z.boolean().optional(),
        vacationUntil: z.string().nullable().optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid update data', details: validationResult.error });
      }
      
      // Process vacation date if provided
      let vacationUntil = null;
      if (req.body.onVacation === true && req.body.vacationUntil) {
        vacationUntil = new Date(req.body.vacationUntil);
        
        // Set default vacation period to 2 weeks if date is invalid
        if (isNaN(vacationUntil.getTime())) {
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
          vacationUntil = twoWeeksFromNow;
        }
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        ...validationResult.data,
        vacationUntil
      });
      
      res.json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Admin - remove user
  app.delete("/api/admin/users/:id", auth.isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Cannot delete yourself
      const adminUser = req.user as any;
      if (userId === adminUser.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });


  // Helper function for manual repository check
  async function triggerManualRepositoryCheck() {
    const results = {
      usersChecked: 0,
      repositoriesUpdated: 0,
      errors: 0,
      details: [] as any[]
    };

    try {
      // Get all users (except those on vacation)
      const users = await storage.getUsers();
      
      for (const user of users) {
        // Skip users on vacation
        if (user.onVacation) {
          if (user.vacationUntil && new Date() > new Date(user.vacationUntil)) {
            // Vacation period ended, reset the vacation mode
            await storage.updateUser(user.id, {
              onVacation: false,
              vacationUntil: null
            });
            console.log(`Vacation ended for user: ${user.username}`);
          } else {
            // User still on vacation, skip
            continue;
          }
        }

        // Get user's repositories
        const repositories = await storage.getRepositoriesByUser(user.id);
        
        results.usersChecked++;
        
        if (repositories.length === 0) {
          results.details.push({
            user: user.username,
            status: 'skipped',
            reason: 'No repositories'
          });
          continue;
        }
        
        // Initialize GitHub client with user's token
        if (user.githubToken) {
          githubClient.setToken(user.githubToken);
        } else {
          // Skip if we don't have a token
          console.log(`No GitHub token for user: ${user.username}, skipping`);
          results.details.push({
            user: user.username,
            status: 'skipped',
            reason: 'No GitHub token'
          });
          continue;
        }

        // Update each repository's status
        for (const repo of repositories) {
          try {
            // Get latest commit information
            const latestCommit = await githubClient.getLatestCommit(repo.fullName);
            
            if (!latestCommit) {
              console.log(`No commits found for repository ${repo.fullName}`);
              continue;
            }

            const lastCommitDate = new Date(latestCommit.commit.author.date);
            const newCommitSha = latestCommit.sha;
            const newStatus = githubClient.calculateRepositoryStatus(lastCommitDate);
            
            // Check if we need to update the repository
            const needsUpdate = 
              newStatus !== repo.status || 
              newCommitSha !== repo.lastCommitSha ||
              (lastCommitDate && repo.lastCommitDate && lastCommitDate.getTime() !== new Date(repo.lastCommitDate).getTime()) ||
              (!lastCommitDate && repo.lastCommitDate) ||
              (lastCommitDate && !repo.lastCommitDate);
            
            if (needsUpdate) {
              // Check if there are new commits for summary generation
              let changesSummary = repo.changesSummary;
              let summaryGeneratedAt = repo.summaryGeneratedAt;
              
              if (repo.lastCommitSha !== newCommitSha && repo.lastCommitSha) {
                try {
                  const { geminiService } = await import('./gemini');
                  const newCommits = await githubClient.getCommitsSince(repo.fullName, repo.lastCommitSha || undefined);
                  
                  if (newCommits.length > 0) {
                    changesSummary = await geminiService.generateChangesSummary(newCommits);
                    summaryGeneratedAt = new Date();
                  }
                } catch (summaryError) {
                  console.error(`Error generating summary for ${repo.fullName}:`, summaryError);
                  changesSummary = "Не удалось проанализировать изменения";
                  summaryGeneratedAt = new Date();
                }
              }
              
              await storage.updateRepository(repo.id, {
                status: newStatus,
                lastCommitDate: lastCommitDate,
                lastCommitSha: newCommitSha,
                changesSummary,
                summaryGeneratedAt
              });
              
              results.repositoriesUpdated++;
              results.details.push({
                user: user.username,
                repository: repo.fullName,
                oldStatus: repo.status,
                newStatus: newStatus,
                lastCommit: lastCommitDate?.toISOString(),
                hasSummary: !!changesSummary
              });
            }
          } catch (error) {
            console.error(`Error updating repository ${repo.fullName}:`, error);
            results.errors++;
            results.details.push({
              user: user.username,
              repository: repo.fullName,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Update user progress after checking all repositories
        try {
          let totalCommits = 0;
          const activeDaysSet = new Set<string>();

          // Calculate stats from all repositories - only count user's own commits
          for (const repo of repositories) {
            try {
              console.log(`[ADMIN] Fetching commits for ${repo.fullName} for user ${user.username} (ID: ${user.githubId})`);
              const commits = await githubClient.getCommitsSince(repo.fullName);
              console.log(`[ADMIN] Found ${commits?.length || 0} commits in ${repo.fullName}`);
              
              if (commits && commits.length > 0) {
                let userCommitCount = 0;
                commits.forEach((commit, index) => {
                  if (commit.commit?.author?.date) {
                    // GitHub API structure: commit.author is null but commit.commit.author has the info
                    const commitAuthorName = commit.commit?.author?.name;
                    const commitAuthorEmail = commit.commit?.author?.email;
                    
                    if (index < 3) { // Debug first 3 commits
                      console.log(`[ADMIN] Commit ${index}: authorName=${commitAuthorName}, authorEmail=${commitAuthorEmail}, looking for username=${user.username}`);
                    }
                    
                    // Match by author name (GitHub username)
                    const isUserCommit = commitAuthorName && commitAuthorName.toLowerCase() === user.username.toLowerCase();
                    
                    if (isUserCommit) {
                      userCommitCount++;
                      const commitDate = new Date(commit.commit.author.date);
                      const dayKey = commitDate.toISOString().split('T')[0];
                      activeDaysSet.add(dayKey);
                    }
                  }
                });
                console.log(`[ADMIN] User commits found in ${repo.fullName}: ${userCommitCount}`);
                totalCommits += userCommitCount;
              }
            } catch (error) {
              console.error(`Error fetching commits for ${repo.fullName}:`, error);
            }
          }

          const activeDays = activeDaysSet.size;
          const experience = totalCommits * 10;

          // Simple streak calculation
          let currentStreak = 0;
          if (activeDaysSet.size > 0) {
            const sortedDays = Array.from(activeDaysSet).sort().reverse();
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            if (sortedDays.includes(today) || sortedDays.includes(yesterday)) {
              currentStreak = 1;
              for (let i = 1; i < sortedDays.length; i++) {
                const currentDay = new Date(sortedDays[i]);
                const previousDay = new Date(sortedDays[i - 1]);
                const dayDiff = Math.abs((previousDay.getTime() - currentDay.getTime()) / (24 * 60 * 60 * 1000));
                
                if (dayDiff === 1) {
                  currentStreak++;
                } else {
                  break;
                }
              }
            }
          }

          await storage.updateUserProgressStats(user.id, {
            commits: totalCommits,
            activeDays: activeDays,
            currentStreak: currentStreak,
            experience: experience
          });

          console.log(`Updated progress for user ${user.username}: ${totalCommits} commits, ${activeDays} active days, ${currentStreak} streak`);
        } catch (progressError) {
          console.error(`Error updating progress for user ${user.username}:`, progressError);
        }
      }
    } catch (error) {
      console.error("Error during repository check:", error);
      results.errors++;
      results.details.push({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    console.log('Repository check completed:', results);
    return results;
  }

  // Admin - trigger manual repository check
  app.post("/api/admin/check-repositories", auth.isAdmin, async (req, res) => {
    try {
      const adminUser = req.user as any;
      console.log(`Admin ${adminUser.username} triggered manual repository check`);
      
      // Trigger the repository check manually
      const checkResults = await triggerManualRepositoryCheck();
      
      // Ensure checkResults is properly defined with default values
      const safeResults = {
        usersChecked: checkResults?.usersChecked || 0,
        repositoriesUpdated: checkResults?.repositoriesUpdated || 0,
        errors: checkResults?.errors || 0,
        details: checkResults?.details || []
      };
      
      res.json({
        success: true,
        message: 'Repository check completed successfully',
        results: safeResults
      });
    } catch (error) {
      console.error("Error during manual repository check:", error);
      res.status(500).json({ 
        error: "Failed to complete repository check",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Verify Telegram bot integration
  app.post("/api/telegram/verify", auth.isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate verification code
      const schema = z.object({
        verificationCode: z.string().min(3)
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // In a real implementation, we would verify this code with Telegram
      // For this MVP, we'll simulate the verification by just setting the telegram ID 
      // to a random string (in reality this would be the actual Telegram chat ID)
      const telegramId = Math.floor(Math.random() * 1000000000).toString();
      
      // Update user with the new Telegram ID
      await storage.updateUser(user.id, {
        telegramId,
        notificationPreference: 'telegram'
      });
      
      res.json({
        success: true,
        message: 'Telegram integration successful'
      });
    } catch (error) {
      console.error("Error verifying Telegram:", error);
      res.status(500).json({ error: "Failed to verify Telegram" });
    }
  });
  
  // Public projects page - requires authentication to view
  app.get("/api/projects", auth.isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getPublicRepositories();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching public projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Add comment to repository - requires authentication
  app.post("/api/repositories/:id/comments", auth.isAuthenticated, async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      if (content.length > 1000) {
        return res.status(400).json({ error: "Comment is too long (max 1000 characters)" });
      }

      // Verify repository exists and is public
      const repository = await storage.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      if (!repository.isPublic) {
        return res.status(403).json({ error: "Cannot comment on private repository" });
      }

      const comment = await storage.createRepositoryComment({
        repositoryId,
        userId,
        content: content.trim()
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Get comments for repository
  app.get("/api/repositories/:id/comments", auth.isAuthenticated, async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.id);
      
      // Verify repository exists and is public
      const repository = await storage.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      if (!repository.isPublic) {
        return res.status(403).json({ error: "Cannot view comments on private repository" });
      }

      const comments = await storage.getRepositoryComments(repositoryId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Delete comment - requires authentication and ownership
  app.delete("/api/comments/:id", auth.isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;

      const success = await storage.deleteRepositoryComment(commentId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });
  
  // Manual trigger for repository checks (for testing/development)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/dev/check-repos", auth.isAdmin, async (req, res) => {
      try {
        await scheduler.startDailyCheck();
        res.json({ success: true, message: 'Repository check triggered' });
      } catch (error) {
        console.error("Error triggering repo check:", error);
        res.status(500).json({ error: "Failed to trigger repository check" });
      }
    });
  }
  
  const httpServer = createServer(app);
  return httpServer;
}
