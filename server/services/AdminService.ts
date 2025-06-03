import { storage } from '../storage';
import { scheduler } from '../scheduler';
import { githubClient } from '../github';
import { User, Repository } from '@shared/schema';

export interface AdminUserData extends User {
  repositoryCount: number;
  activeRepositories: number;
  progress?: {
    totalCommits: number;
    activeDays: number;
    currentStreak: number;
    level: number;
    experience: number;
  };
}

export class AdminService {
  async getAllUsers(): Promise<AdminUserData[]> {
    const users = await storage.getUsers();
    const usersWithData: AdminUserData[] = [];

    for (const user of users) {
      const repositories = await storage.getRepositoriesByUser(user.id);
      const activeRepositories = repositories.filter(repo => repo.status === 'active').length;
      const progress = await storage.getUserProgress(user.id);

      usersWithData.push({
        ...user,
        repositoryCount: repositories.length,
        activeRepositories,
        progress: progress ? {
          totalCommits: progress.totalCommits,
          activeDays: progress.activeDays,
          currentStreak: progress.currentStreak,
          level: progress.level,
          experience: progress.experience
        } : undefined
      });
    }

    return usersWithData;
  }

  async setUserVacation(userId: number, onVacation: boolean, vacationUntil?: string): Promise<User> {
    const updateData: Partial<User> = {
      onVacation,
      vacationUntil: vacationUntil ? new Date(vacationUntil) : null
    };

    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  async deleteUser(userId: number): Promise<void> {
    // First, delete all user's repositories
    const repositories = await storage.getRepositoriesByUser(userId);
    for (const repo of repositories) {
      await storage.deleteRepository(repo.id);
    }

    // Delete user progress
    const progress = await storage.getUserProgress(userId);
    if (progress) {
      // Note: Add method to storage to delete user progress if needed
    }

    // Finally, delete the user
    const success = await storage.deleteUser(userId);
    if (!success) {
      throw new Error('Failed to delete user');
    }
  }

  async triggerRepositoryCheck(): Promise<{ success: boolean; message: string; errors?: string[] }> {
    try {
      const users = await storage.getUsers();
      const errors: string[] = [];
      let successCount = 0;
      let totalCount = 0;

      for (const user of users) {
        if (user.onVacation) continue;

        const repositories = await storage.getRepositoriesByUser(user.id);
        
        for (const repository of repositories) {
          totalCount++;
          
          try {
            if (user.githubToken) {
              githubClient.setToken(user.githubToken);
              
              const latestCommit = await githubClient.getLatestCommit(repository.fullName);
              const newStatus = githubClient.calculateRepositoryStatus(
                latestCommit ? new Date(latestCommit.commit.committer.date) : null
              );

              await storage.updateRepository(repository.id, {
                lastCommitDate: latestCommit ? new Date(latestCommit.commit.committer.date) : null,
                lastCommitSha: latestCommit?.sha || null,
                status: newStatus
              });

              successCount++;
            } else {
              errors.push(`User ${user.username} has no GitHub token`);
            }
          } catch (error) {
            errors.push(`Error checking ${repository.fullName}: ${error}`);
          }
        }
      }

      return {
        success: true,
        message: `Repository check completed. ${successCount}/${totalCount} repositories checked successfully.`,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Repository check failed: ${error}`
      };
    }
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalRepositories: number;
    activeRepositories: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }> {
    const users = await storage.getUsers();
    const activeUsers = await storage.getActiveUsers();
    
    let totalRepositories = 0;
    let activeRepositories = 0;

    for (const user of users) {
      const repos = await storage.getRepositoriesByUser(user.id);
      totalRepositories += repos.length;
      activeRepositories += repos.filter(repo => repo.status === 'active').length;
    }

    const healthScore = activeUsers.length / Math.max(users.length, 1);
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (healthScore < 0.3) systemHealth = 'critical';
    else if (healthScore < 0.6) systemHealth = 'warning';

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalRepositories,
      activeRepositories,
      systemHealth
    };
  }

  async scheduleRepositoryCheck(): Promise<{ message: string }> {
    scheduler.startDailyCheck();
    return { message: 'Daily repository check scheduler restarted' };
  }

  async stopRepositoryCheck(): Promise<{ message: string }> {
    scheduler.stopDailyCheck();
    return { message: 'Daily repository check scheduler stopped' };
  }

  async getUserActivity(userId: number): Promise<{
    user: User;
    repositories: Repository[];
    recentActivity: any[];
    progress: any;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const repositories = await storage.getRepositoriesByUser(userId);
    const recentActivity = await storage.getActivityFeedByUser(userId, 20);
    const progress = await storage.getUserProgress(userId);

    return {
      user,
      repositories,
      recentActivity,
      progress
    };
  }
}