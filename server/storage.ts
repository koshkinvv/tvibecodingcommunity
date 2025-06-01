import {
  users, repositories, weeklyStats, activityFeed, repositoryComments,
  type User, type InsertUser,
  type Repository, type InsertRepository,
  type WeeklyStat, type InsertWeeklyStat,
  type ActivityFeed, type InsertActivityFeed,
  type RepositoryComment, type InsertRepositoryComment
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
  
  // Activity feed operations
  createActivityFeedEntry(entry: InsertActivityFeed): Promise<ActivityFeed>;
  getActivityFeed(limit?: number): Promise<(ActivityFeed & { user: User; repository: Repository })[]>;
  getActivityFeedByUser(userId: number, limit?: number): Promise<ActivityFeed[]>;
  
  // Repository comments operations
  createRepositoryComment(comment: InsertRepositoryComment): Promise<RepositoryComment>;
  getRepositoryComments(repositoryId: number): Promise<(RepositoryComment & { user: User })[]>;
  deleteRepositoryComment(commentId: number, userId: number): Promise<boolean>;
  
  // Public repositories operations
  getPublicRepositories(): Promise<(Repository & { user: User; comments: (RepositoryComment & { user: User })[] })[]>;
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
    
    // Calculate week number (same logic as in scheduler.ts)
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-${weekNumber.toString().padStart(2, '0')}`;
  }

  // Activity feed operations
  async createActivityFeedEntry(entry: InsertActivityFeed): Promise<ActivityFeed> {
    const [activityEntry] = await db
      .insert(activityFeed)
      .values(entry)
      .returning();
    return activityEntry;
  }

  async getActivityFeed(limit: number = 50): Promise<(ActivityFeed & { user: User; repository: Repository })[]> {
    const activities = await db
      .select({
        id: activityFeed.id,
        userId: activityFeed.userId,
        repositoryId: activityFeed.repositoryId,
        commitSha: activityFeed.commitSha,
        commitMessage: activityFeed.commitMessage,
        filesChanged: activityFeed.filesChanged,
        linesAdded: activityFeed.linesAdded,
        linesDeleted: activityFeed.linesDeleted,
        aiSummary: activityFeed.aiSummary,
        commitDate: activityFeed.commitDate,
        createdAt: activityFeed.createdAt,
        user: {
          id: users.id,
          githubId: users.githubId,
          username: users.username,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          telegramId: users.telegramId,
          notificationPreference: users.notificationPreference,
          onVacation: users.onVacation,
          vacationUntil: users.vacationUntil,
          isAdmin: users.isAdmin,
          lastActive: users.lastActive,
          createdAt: users.createdAt,
        },
        repository: {
          id: repositories.id,
          userId: repositories.userId,
          name: repositories.name,
          fullName: repositories.fullName,
          lastCommitDate: repositories.lastCommitDate,
          status: repositories.status,
          lastCommitSha: repositories.lastCommitSha,
          changesSummary: repositories.changesSummary,
          summaryGeneratedAt: repositories.summaryGeneratedAt,
          createdAt: repositories.createdAt,
        }
      })
      .from(activityFeed)
      .innerJoin(users, eq(activityFeed.userId, users.id))
      .innerJoin(repositories, eq(activityFeed.repositoryId, repositories.id))
      .orderBy(desc(activityFeed.commitDate))
      .limit(limit);

    return activities as (ActivityFeed & { user: User; repository: Repository })[];
  }

  async getActivityFeedByUser(userId: number, limit: number = 20): Promise<ActivityFeed[]> {
    const activities = await db
      .select()
      .from(activityFeed)
      .where(eq(activityFeed.userId, userId))
      .orderBy(desc(activityFeed.commitDate))
      .limit(limit);
    return activities;
  }

  async createRepositoryComment(comment: InsertRepositoryComment): Promise<RepositoryComment> {
    const [newComment] = await db
      .insert(repositoryComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getRepositoryComments(repositoryId: number): Promise<(RepositoryComment & { user: User })[]> {
    const comments = await db
      .select({
        id: repositoryComments.id,
        repositoryId: repositoryComments.repositoryId,
        userId: repositoryComments.userId,
        content: repositoryComments.content,
        createdAt: repositoryComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(repositoryComments)
      .innerJoin(users, eq(repositoryComments.userId, users.id))
      .where(eq(repositoryComments.repositoryId, repositoryId))
      .orderBy(desc(repositoryComments.createdAt));
    
    return comments as (RepositoryComment & { user: User })[];
  }

  async deleteRepositoryComment(commentId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(repositoryComments)
      .where(and(
        eq(repositoryComments.id, commentId),
        eq(repositoryComments.userId, userId)
      ));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPublicRepositories(): Promise<(Repository & { user: User; comments: (RepositoryComment & { user: User })[] })[]> {
    const repos = await db
      .select({
        id: repositories.id,
        userId: repositories.userId,
        name: repositories.name,
        fullName: repositories.fullName,
        lastCommitDate: repositories.lastCommitDate,
        status: repositories.status,
        lastCommitSha: repositories.lastCommitSha,
        changesSummary: repositories.changesSummary,
        summaryGeneratedAt: repositories.summaryGeneratedAt,
        description: repositories.description,
        descriptionGeneratedAt: repositories.descriptionGeneratedAt,
        isPublic: repositories.isPublic,
        createdAt: repositories.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(repositories)
      .innerJoin(users, eq(repositories.userId, users.id))
      .where(eq(repositories.isPublic, true))
      .orderBy(desc(repositories.createdAt));

    const reposWithComments = await Promise.all(
      repos.map(async (repo) => {
        const comments = await this.getRepositoryComments(repo.id);
        return {
          ...repo,
          comments
        };
      })
    );

    return reposWithComments as (Repository & { user: User; comments: (RepositoryComment & { user: User })[] })[];
  }
}

export const storage = new DatabaseStorage();