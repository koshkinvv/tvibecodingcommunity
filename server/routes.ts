import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { githubClient } from "./github";
import { scheduler } from "./scheduler";
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
      
      // Try to fetch last commit date immediately
      try {
        const lastCommitDate = await githubClient.getLastCommitDate(repository);
        const status = githubClient.calculateRepositoryStatus(lastCommitDate);
        
        await storage.updateRepository(repository.id, {
          lastCommitDate,
          status
        });
        
        // Return updated repository
        const updatedRepo = await storage.getRepository(repository.id);
        res.status(201).json(updatedRepo);
      } catch (error) {
        // Just return the created repository if we couldn't fetch commit data
        console.error("Error fetching initial commit data:", error);
        res.status(201).json(repository);
      }
    } catch (error) {
      console.error("Error adding repository:", error);
      res.status(500).json({ error: "Failed to add repository" });
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
  
  // Community members endpoint
  app.get("/api/community", auth.isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const community = [];
      
      for (const user of users) {
        const repositories = await storage.getRepositoriesByUser(user.id);
        
        // Calculate overall status
        let overallStatus = 'inactive';
        if (repositories.some(r => r.status === 'active')) {
          overallStatus = 'active';
        } else if (repositories.some(r => r.status === 'warning')) {
          overallStatus = 'warning';
        }
        
        community.push({
          id: user.id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          status: overallStatus,
          repositories: repositories.map(r => ({
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
