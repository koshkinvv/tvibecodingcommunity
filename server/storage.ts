import {
  users, repositories, weeklyStats,
  type User, type InsertUser,
  type Repository, type InsertRepository,
  type WeeklyStat, type InsertWeeklyStat
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.githubId, githubId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getActiveUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.onVacation, false));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUsersWithInactiveRepos(daysThreshold: number): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    
    const usersWithInactiveRepos = await db
      .select({
        id: users.id,
        githubId: users.githubId,
        username: users.username,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        githubToken: users.githubToken,
        telegramId: users.telegramId,
        notificationPreference: users.notificationPreference,
        onVacation: users.onVacation,
        vacationUntil: users.vacationUntil,
        isAdmin: users.isAdmin,
        lastActive: users.lastActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(repositories, eq(users.id, repositories.userId))
      .where(
        and(
          eq(users.onVacation, false),
          repositories.lastCommitDate ? gte(repositories.lastCommitDate, cutoffDate) : sql`true`
        )
      )
      .groupBy(users.id);

    return usersWithInactiveRepos;
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, id));
    return repo || undefined;
  }

  async getRepositoriesByUser(userId: number): Promise<Repository[]> {
    return await db.select().from(repositories).where(eq(repositories.userId, userId));
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    const [repository] = await db.insert(repositories).values(repo).returning();
    return repository;
  }

  async updateRepository(id: number, repoData: Partial<Repository>): Promise<Repository | undefined> {
    const [repo] = await db.update(repositories).set(repoData).where(eq(repositories.id, id)).returning();
    return repo || undefined;
  }

  async deleteRepository(id: number): Promise<boolean> {
    const result = await db.delete(repositories).where(eq(repositories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCurrentViber(): Promise<User | undefined> {
    const currentWeek = this.getCurrentWeekIdentifier();
    
    const [viber] = await db
      .select({
        id: users.id,
        githubId: users.githubId,
        username: users.username,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        githubToken: users.githubToken,
        telegramId: users.telegramId,
        notificationPreference: users.notificationPreference,
        onVacation: users.onVacation,
        vacationUntil: users.vacationUntil,
        isAdmin: users.isAdmin,
        lastActive: users.lastActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(weeklyStats, eq(users.id, weeklyStats.userId))
      .where(
        and(
          eq(weeklyStats.week, currentWeek),
          eq(weeklyStats.isViber, true)
        )
      );

    return viber || undefined;
  }

  async updateWeeklyStats(stat: InsertWeeklyStat): Promise<WeeklyStat> {
    const [existingStat] = await db
      .select()
      .from(weeklyStats)
      .where(
        and(
          eq(weeklyStats.userId, stat.userId),
          eq(weeklyStats.week, stat.week)
        )
      );

    if (existingStat) {
      const [updated] = await db
        .update(weeklyStats)
        .set(stat)
        .where(eq(weeklyStats.id, existingStat.id))
        .returning();
      return updated;
    } else {
      const [newStat] = await db.insert(weeklyStats).values(stat).returning();
      return newStat;
    }
  }

  async getWeeklyStatsByUser(userId: number): Promise<WeeklyStat[]> {
    return await db
      .select()
      .from(weeklyStats)
      .where(eq(weeklyStats.userId, userId))
      .orderBy(desc(weeklyStats.week));
  }

  private getCurrentWeekIdentifier(): string {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
}

export const storage = new DatabaseStorage();