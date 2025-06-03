import { storage } from '../storage';
import { projectAnalyzer } from '../project-analyzer';
import { User, Repository, ActivityFeed } from '@shared/schema';

export interface PlatformStats {
  totalMembers: number;
  activeMembers: number;
  totalRepositories: number;
  averageCommitsPerUser: number;
  topContributors: User[];
}

export interface LeaderboardEntry {
  user: User;
  progress: {
    totalCommits: number;
    activeDays: number;
    currentStreak: number;
    level: number;
    experience: number;
  };
  rank: number;
}

export class AnalyticsService {
  async getPlatformStats(): Promise<PlatformStats> {
    const users = await storage.getUsers();
    const activeUsers = await storage.getActiveUsers();
    
    const allRepos = await Promise.all(
      users.map(user => storage.getRepositoriesByUser(user.id))
    );
    const totalRepositories = allRepos.flat().length;
    
    const totalCommits = users.reduce((sum, user) => {
      // This would be calculated from user progress
      return sum;
    }, 0);
    
    const averageCommitsPerUser = users.length > 0 ? totalCommits / users.length : 0;

    return {
      totalMembers: users.length,
      activeMembers: activeUsers.length,
      totalRepositories,
      averageCommitsPerUser,
      topContributors: activeUsers.slice(0, 5)
    };
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const users = await storage.getUsers();
    const leaderboardData: LeaderboardEntry[] = [];

    for (const user of users) {
      const progress = await storage.getUserProgress(user.id);
      if (progress) {
        leaderboardData.push({
          user,
          progress: {
            totalCommits: progress.totalCommits,
            activeDays: progress.activeDays,
            currentStreak: progress.currentStreak,
            level: progress.level,
            experience: progress.experience
          },
          rank: 0 // Will be calculated after sorting
        });
      }
    }

    // Sort by experience descending
    leaderboardData.sort((a, b) => b.progress.experience - a.progress.experience);
    
    // Assign ranks
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboardData.slice(0, limit);
  }

  async getActivityFeed(limit: number = 50): Promise<ActivityFeed[]> {
    return await storage.getActivityFeed(limit);
  }

  async getUserActivityFeed(userId: number, limit: number = 20): Promise<ActivityFeed[]> {
    return await storage.getActivityFeedByUser(userId, limit);
  }

  async getFeaturedMembers(limit: number = 6): Promise<User[]> {
    const activeUsers = await storage.getActiveUsers();
    
    // Sort by recent activity and contribution level
    const featuredUsers = activeUsers
      .filter(user => user.lastActive)
      .sort((a, b) => {
        const dateA = new Date(a.lastActive!).getTime();
        const dateB = new Date(b.lastActive!).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);

    return featuredUsers;
  }

  async getCurrentViber(): Promise<User | null> {
    return await storage.getCurrentViber();
  }

  async analyzeUserProject(userId: number, repositories: Repository[]): Promise<any> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    try {
      return await projectAnalyzer.analyzeUserProject(user, repositories);
    } catch (error) {
      console.error('Error analyzing user project:', error);
      throw new Error('Failed to analyze project');
    }
  }

  async analyzeSpecificRepository(userId: number, repositoryId: number): Promise<any> {
    const user = await storage.getUser(userId);
    const repository = await storage.getRepository(repositoryId);
    
    if (!user || !repository) {
      throw new Error('User or repository not found');
    }

    if (repository.userId !== userId) {
      throw new Error('Unauthorized to analyze this repository');
    }

    try {
      return await projectAnalyzer.analyzeSpecificRepository(user, repository);
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw new Error('Failed to analyze repository');
    }
  }

  async getWeeklyStats(userId: number): Promise<any[]> {
    return await storage.getWeeklyStatsByUser(userId);
  }

  async getUserInsights(userId: number): Promise<{
    user: User;
    progress: any;
    repositories: Repository[];
    weeklyStats: any[];
    recentActivity: ActivityFeed[];
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const progress = await storage.getUserProgress(userId);
    const repositories = await storage.getRepositoriesByUser(userId);
    const weeklyStats = await storage.getWeeklyStatsByUser(userId);
    const recentActivity = await storage.getActivityFeedByUser(userId, 10);

    return {
      user,
      progress,
      repositories,
      weeklyStats,
      recentActivity
    };
  }
}