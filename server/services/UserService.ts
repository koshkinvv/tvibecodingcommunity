import { storage } from '../storage';
import { githubClient } from '../github';
import { User, Repository, UserProgress, InsertUser } from '@shared/schema';

export class UserService {
  async getUserProfile(userId: number): Promise<{
    user: User;
    repositories: Repository[];
    progress: UserProgress | null;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const repositories = await storage.getRepositoriesByUser(userId);
    const progress = await storage.getUserProgress(userId);

    return {
      user,
      repositories,
      progress
    };
  }

  async createUser(userData: InsertUser): Promise<User> {
    return await storage.createUser(userData);
  }

  async updateUser(userId: number, updateData: Partial<User>): Promise<User> {
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async deleteUser(userId: number): Promise<void> {
    const success = await storage.deleteUser(userId);
    if (!success) {
      throw new Error('Failed to delete user');
    }
  }

  async getUserByGithubId(githubId: string): Promise<User | null> {
    return await storage.getUserByGithubId(githubId);
  }

  async getUserProgress(userId: number): Promise<UserProgress | null> {
    return await storage.getUserProgress(userId);
  }

  async updateUserProgress(
    userId: number, 
    stats: { commits?: number; activeDays?: number; currentStreak?: number; experience?: number }
  ): Promise<UserProgress | null> {
    return await storage.updateUserProgressStats(userId, stats);
  }

  async getActiveUsers(): Promise<User[]> {
    return await storage.getActiveUsers();
  }

  async getUsersWithInactiveRepos(daysThreshold: number): Promise<User[]> {
    return await storage.getUsersWithInactiveRepos(daysThreshold);
  }

  async setUserVacation(userId: number, onVacation: boolean, vacationUntil?: string): Promise<User> {
    const updateData: Partial<User> = {
      onVacation,
      vacationUntil: vacationUntil ? new Date(vacationUntil) : null
    };
    return await this.updateUser(userId, updateData);
  }
}