import {
  users, repositories, weeklyStats,
  type User, type InsertUser,
  type Repository, type InsertRepository,
  type WeeklyStat, type InsertWeeklyStat
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByGithubId(githubId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersWithInactiveRepos(daysThreshold: number): Promise<User[]>;
  
  // Repository operations
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoriesByUser(userId: number): Promise<Repository[]>;
  createRepository(repo: InsertRepository): Promise<Repository>;
  updateRepository(id: number, repo: Partial<Repository>): Promise<Repository | undefined>;
  deleteRepository(id: number): Promise<boolean>;
  
  // Weekly stats operations
  getCurrentViber(): Promise<User | undefined>;
  updateWeeklyStats(stat: InsertWeeklyStat): Promise<WeeklyStat>;
  getWeeklyStatsByUser(userId: number): Promise<WeeklyStat[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private repositories: Map<number, Repository>;
  private weeklyStats: Map<number, WeeklyStat>;
  private currentUserId: number = 1;
  private currentRepoId: number = 1;
  private currentStatId: number = 1;

  constructor() {
    this.users = new Map();
    this.repositories = new Map();
    this.weeklyStats = new Map();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.githubId === githubId
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getActiveUsers(): Promise<User[]> {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return Array.from(this.users.values()).filter(user => 
      !user.onVacation && user.lastActive && new Date(user.lastActive) > twoWeeksAgo
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const newUser: User = { ...user, id, createdAt: now, lastActive: now };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    // Also delete associated repositories and stats
    const userRepos = await this.getRepositoriesByUser(id);
    for (const repo of userRepos) {
      await this.deleteRepository(repo.id);
    }
    
    return this.users.delete(id);
  }

  async getUsersWithInactiveRepos(daysThreshold: number): Promise<User[]> {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);
    
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.onVacation) continue;
      
      const repos = await this.getRepositoriesByUser(user.id);
      const hasInactiveRepo = repos.some(repo => 
        !repo.lastCommitDate || new Date(repo.lastCommitDate) < thresholdDate
      );
      
      if (hasInactiveRepo) {
        result.push(user);
      }
    }
    
    return result;
  }

  // Repository operations
  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoriesByUser(userId: number): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(
      (repo) => repo.userId === userId
    );
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    const id = this.currentRepoId++;
    const now = new Date();
    const newRepo: Repository = { 
      ...repo, 
      id, 
      createdAt: now, 
      status: 'pending', 
      lastCommitDate: null 
    };
    this.repositories.set(id, newRepo);
    return newRepo;
  }

  async updateRepository(id: number, repoData: Partial<Repository>): Promise<Repository | undefined> {
    const existingRepo = this.repositories.get(id);
    if (!existingRepo) return undefined;
    
    const updatedRepo = { ...existingRepo, ...repoData };
    this.repositories.set(id, updatedRepo);
    return updatedRepo;
  }

  async deleteRepository(id: number): Promise<boolean> {
    return this.repositories.delete(id);
  }

  // Weekly stats operations
  async getCurrentViber(): Promise<User | undefined> {
    const currentWeek = this.getCurrentWeekIdentifier();
    
    const viberStat = Array.from(this.weeklyStats.values()).find(
      stat => stat.week === currentWeek && stat.isViber
    );
    
    if (!viberStat) return undefined;
    return this.getUser(viberStat.userId);
  }

  async updateWeeklyStats(stat: InsertWeeklyStat): Promise<WeeklyStat> {
    // Check if a stat for this user/week already exists
    const existingStat = Array.from(this.weeklyStats.values()).find(
      s => s.userId === stat.userId && s.week === stat.week
    );
    
    if (existingStat) {
      const updatedStat = { ...existingStat, ...stat };
      this.weeklyStats.set(existingStat.id, updatedStat);
      return updatedStat;
    }
    
    // Create new stat
    const id = this.currentStatId++;
    const newStat: WeeklyStat = { ...stat, id };
    this.weeklyStats.set(id, newStat);
    return newStat;
  }

  async getWeeklyStatsByUser(userId: number): Promise<WeeklyStat[]> {
    return Array.from(this.weeklyStats.values()).filter(
      stat => stat.userId === userId
    );
  }

  // Helper method to get current week in YYYY-WW format
  private getCurrentWeekIdentifier(): string {
    const now = new Date();
    const year = now.getFullYear();
    
    // Calculate week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-${weekNumber.toString().padStart(2, '0')}`;
  }
}

export const storage = new MemStorage();
