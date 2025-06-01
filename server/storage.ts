import {
  users, repositories, weeklyStats, activityFeed, repositoryComments, userProgress,
  achievements, userAchievements, mentorships, learningResources, challenges, challengeParticipants, codeReviews,
  type User, type InsertUser,
  type Repository, type InsertRepository,
  type WeeklyStat, type InsertWeeklyStat,
  type ActivityFeed, type InsertActivityFeed,
  type RepositoryComment, type InsertRepositoryComment,
  type UserProgress, type InsertUserProgress,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type Mentorship, type InsertMentorship,
  type LearningResource, type InsertLearningResource,
  type Challenge, type InsertChallenge,
  type ChallengeParticipant, type InsertChallengeParticipant,
  type CodeReview, type InsertCodeReview
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
  
  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, progress: Partial<UserProgress>): Promise<UserProgress | undefined>;
  updateUserProgressStats(userId: number, stats: { commits?: number; activeDays?: number; currentStreak?: number; experience?: number }): Promise<UserProgress | undefined>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  checkAndAwardAchievements(userId: number): Promise<UserAchievement[]>;
  
  // Mentorship operations
  getMentorships(userId: number): Promise<(Mentorship & { mentor: User; mentee: User })[]>;
  createMentorship(mentorship: InsertMentorship): Promise<Mentorship>;
  updateMentorship(id: number, mentorship: Partial<Mentorship>): Promise<Mentorship | undefined>;
  getAvailableMentors(): Promise<User[]>;
  
  // Learning resources operations
  getLearningResources(): Promise<(LearningResource & { author: User })[]>;
  createLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  updateLearningResource(id: number, resource: Partial<LearningResource>): Promise<LearningResource | undefined>;
  
  // Challenge operations
  getChallenges(): Promise<(Challenge & { creator: User; participants: ChallengeParticipant[] })[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  joinChallenge(challengeId: number, userId: number): Promise<ChallengeParticipant>;
  submitChallenge(challengeId: number, userId: number, submissionUrl: string): Promise<ChallengeParticipant | undefined>;
  
  // Code review operations
  getCodeReviews(repositoryId: number): Promise<(CodeReview & { reviewer: User })[]>;
  createCodeReview(review: InsertCodeReview): Promise<CodeReview>;
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

  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress || undefined;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateUserProgress(userId: number, progressData: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [updated] = await db
      .update(userProgress)
      .set({ ...progressData, updatedAt: new Date() })
      .where(eq(userProgress.userId, userId))
      .returning();
    return updated || undefined;
  }

  async updateUserProgressStats(userId: number, stats: { commits?: number; activeDays?: number; currentStreak?: number; experience?: number }): Promise<UserProgress | undefined> {
    // Get current progress or create if doesn't exist
    let currentProgress = await this.getUserProgress(userId);
    
    if (!currentProgress) {
      currentProgress = await this.createUserProgress({
        userId,
        totalCommits: stats.commits || 0,
        activeDays: stats.activeDays || 0,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.currentStreak || 0,
        level: 1,
        experience: stats.experience || 0,
        lastActivityDate: new Date(),
        badges: []
      });
    }

    // Calculate new stats
    const newTotalCommits = currentProgress.totalCommits + (stats.commits || 0);
    const newActiveDays = Math.max(currentProgress.activeDays, stats.activeDays || 0);
    const newCurrentStreak = stats.currentStreak !== undefined ? stats.currentStreak : currentProgress.currentStreak;
    const newLongestStreak = Math.max(currentProgress.longestStreak, newCurrentStreak);
    const newExperience = currentProgress.experience + (stats.experience || 0);
    
    // Calculate level based on experience (level up every 100 XP)
    const newLevel = Math.floor(newExperience / 100) + 1;

    return await this.updateUserProgress(userId, {
      totalCommits: newTotalCommits,
      activeDays: newActiveDays,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      level: newLevel,
      experience: newExperience,
      lastActivityDate: new Date()
    });
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievementsList = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        earnedAt: userAchievements.earnedAt,
        progress: userAchievements.progress,
        achievement: {
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          category: achievements.category,
          condition: achievements.condition,
          xpReward: achievements.xpReward,
          rarity: achievements.rarity,
          isActive: achievements.isActive,
          createdAt: achievements.createdAt,
        }
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    
    return userAchievementsList as (UserAchievement & { achievement: Achievement })[];
  }

  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const [newUserAchievement] = await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return newUserAchievement;
  }

  async checkAndAwardAchievements(userId: number): Promise<UserAchievement[]> {
    const progress = await this.getUserProgress(userId);
    if (!progress) return [];

    const allAchievements = await this.getAchievements();
    const earnedAchievements = await this.getUserAchievements(userId);
    const earnedIds = earnedAchievements.map(ua => ua.achievementId);
    
    const newAchievements: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      if (earnedIds.includes(achievement.id)) continue;

      const condition = achievement.condition as any;
      let shouldAward = false;

      // Check achievement conditions
      switch (condition.type) {
        case 'commits':
          shouldAward = progress.totalCommits >= condition.value;
          break;
        case 'streak':
          shouldAward = progress.currentStreak >= condition.value;
          break;
        case 'level':
          shouldAward = progress.level >= condition.value;
          break;
        case 'active_days':
          shouldAward = progress.activeDays >= condition.value;
          break;
      }

      if (shouldAward) {
        const newAchievement = await this.awardAchievement(userId, achievement.id);
        newAchievements.push(newAchievement);
        
        // Award XP for achievement
        await this.updateUserProgressStats(userId, { experience: achievement.xpReward });
      }
    }

    return newAchievements;
  }

  // Mentorship operations
  async getMentorships(userId: number): Promise<(Mentorship & { mentor: User; mentee: User })[]> {
    const mentorshipsList = await db
      .select({
        id: mentorships.id,
        mentorId: mentorships.mentorId,
        menteeId: mentorships.menteeId,
        status: mentorships.status,
        technologies: mentorships.technologies,
        goals: mentorships.goals,
        startDate: mentorships.startDate,
        endDate: mentorships.endDate,
        createdAt: mentorships.createdAt,
        mentor: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        mentee: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(mentorships)
      .innerJoin(users, eq(mentorships.mentorId, users.id))
      .where(eq(mentorships.mentorId, userId));
    
    return mentorshipsList as (Mentorship & { mentor: User; mentee: User })[];
  }

  async createMentorship(mentorship: InsertMentorship): Promise<Mentorship> {
    const [newMentorship] = await db
      .insert(mentorships)
      .values(mentorship)
      .returning();
    return newMentorship;
  }

  async updateMentorship(id: number, mentorshipData: Partial<Mentorship>): Promise<Mentorship | undefined> {
    const [updated] = await db
      .update(mentorships)
      .set(mentorshipData)
      .where(eq(mentorships.id, id))
      .returning();
    return updated || undefined;
  }

  async getAvailableMentors(): Promise<User[]> {
    // Get users with high level or experience who can be mentors
    const mentors = await db
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
      .innerJoin(userProgress, eq(users.id, userProgress.userId))
      .where(gte(userProgress.level, 3)); // Level 3+ can be mentors

    return mentors;
  }

  // Learning resources operations
  async getLearningResources(): Promise<(LearningResource & { author: User })[]> {
    const resources = await db
      .select({
        id: learningResources.id,
        title: learningResources.title,
        description: learningResources.description,
        content: learningResources.content,
        type: learningResources.type,
        difficulty: learningResources.difficulty,
        technologies: learningResources.technologies,
        authorId: learningResources.authorId,
        views: learningResources.views,
        likes: learningResources.likes,
        isPublished: learningResources.isPublished,
        createdAt: learningResources.createdAt,
        updatedAt: learningResources.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(learningResources)
      .innerJoin(users, eq(learningResources.authorId, users.id))
      .where(eq(learningResources.isPublished, true));
    
    return resources as (LearningResource & { author: User })[];
  }

  async createLearningResource(resource: InsertLearningResource): Promise<LearningResource> {
    const [newResource] = await db
      .insert(learningResources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateLearningResource(id: number, resourceData: Partial<LearningResource>): Promise<LearningResource | undefined> {
    const [updated] = await db
      .update(learningResources)
      .set({ ...resourceData, updatedAt: new Date() })
      .where(eq(learningResources.id, id))
      .returning();
    return updated || undefined;
  }

  // Challenge operations
  async getChallenges(): Promise<(Challenge & { creator: User; participants: ChallengeParticipant[] })[]> {
    const challengesList = await db.select().from(challenges).where(eq(challenges.isActive, true));
    
    const challengesWithDetails = await Promise.all(
      challengesList.map(async (challenge) => {
        const creator = await this.getUser(challenge.createdBy);
        const participants = await db
          .select()
          .from(challengeParticipants)
          .where(eq(challengeParticipants.challengeId, challenge.id));
        
        return {
          ...challenge,
          creator: creator!,
          participants
        };
      })
    );

    return challengesWithDetails;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db
      .insert(challenges)
      .values(challenge)
      .returning();
    return newChallenge;
  }

  async joinChallenge(challengeId: number, userId: number): Promise<ChallengeParticipant> {
    const [participant] = await db
      .insert(challengeParticipants)
      .values({ challengeId, userId })
      .returning();
    return participant;
  }

  async submitChallenge(challengeId: number, userId: number, submissionUrl: string): Promise<ChallengeParticipant | undefined> {
    const [updated] = await db
      .update(challengeParticipants)
      .set({ 
        submissionUrl, 
        status: 'submitted',
        submittedAt: new Date()
      })
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ))
      .returning();
    return updated || undefined;
  }

  // Code review operations
  async getCodeReviews(repositoryId: number): Promise<(CodeReview & { reviewer: User })[]> {
    const reviews = await db
      .select({
        id: codeReviews.id,
        repositoryId: codeReviews.repositoryId,
        reviewerId: codeReviews.reviewerId,
        pullRequestUrl: codeReviews.pullRequestUrl,
        rating: codeReviews.rating,
        feedback: codeReviews.feedback,
        suggestions: codeReviews.suggestions,
        status: codeReviews.status,
        createdAt: codeReviews.createdAt,
        reviewer: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(codeReviews)
      .innerJoin(users, eq(codeReviews.reviewerId, users.id))
      .where(eq(codeReviews.repositoryId, repositoryId));
    
    return reviews as (CodeReview & { reviewer: User })[];
  }

  async createCodeReview(review: InsertCodeReview): Promise<CodeReview> {
    const [newReview] = await db
      .insert(codeReviews)
      .values(review)
      .returning();
    return newReview;
  }
}

export const storage = new DatabaseStorage();