import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: text("github_id").notNull().unique(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  githubToken: text("github_token"), // Encrypted GitHub access token
  telegramId: text("telegram_id"),
  notificationPreference: text("notification_preference").default("email"),
  onVacation: boolean("on_vacation").default(false),
  vacationUntil: timestamp("vacation_until"),
  isAdmin: boolean("is_admin").default(false),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Repository model
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(), // username/repo-name
  lastCommitDate: timestamp("last_commit_date"),
  status: text("status").notNull().default("pending"), // 'active', 'warning', 'inactive', 'pending'
  lastCommitSha: text("last_commit_sha"), // Для отслеживания изменений
  changesSummary: text("changes_summary"), // AI-генерированное описание изменений
  summaryGeneratedAt: timestamp("summary_generated_at"), // Когда было создано описание
  description: text("description"), // AI-генерированное описание проекта
  descriptionGeneratedAt: timestamp("description_generated_at"), // Когда было создано описание проекта
  isPublic: boolean("is_public").notNull().default(true), // Видимость в комьюнити
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly stats for "Viber of the week" feature
export const weeklyStats = pgTable("weekly_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  week: text("week").notNull(), // ISO week format (YYYY-WW)
  commitCount: integer("commit_count").default(0),
  streakDays: integer("streak_days").default(0),
  isViber: boolean("is_viber").default(false),
  stats: json("stats").default({}),
});

// Activity feed for public community activity
export const activityFeed = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  commitSha: text("commit_sha").notNull(),
  commitMessage: text("commit_message").notNull(),
  commitCount: integer("commit_count").default(1),
  commits: json("commits"), // Store detailed commit info
  filesChanged: integer("files_changed").default(0),
  linesAdded: integer("lines_added").default(0),
  linesDeleted: integer("lines_deleted").default(0),
  aiSummary: text("ai_summary"),
  commitDate: timestamp("commit_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Comments on repositories
export const repositoryComments = pgTable("repository_comments", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress tracking for gamification
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalCommits: integer("total_commits").notNull().default(0),
  activeDays: integer("active_days").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  badges: json("badges").default([]), // Массив заработанных бейджей
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievements system
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // 'coding', 'social', 'learning', 'special'
  condition: json("condition").notNull(), // Условия получения
  xpReward: integer("xp_reward").notNull().default(0),
  rarity: text("rarity").notNull().default('common'), // 'common', 'rare', 'epic', 'legendary'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: json("progress").default({}), // Прогресс выполнения
});

// Mentorship system
export const mentorships = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  menteeId: integer("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default('pending'), // 'pending', 'active', 'completed', 'cancelled'
  technologies: json("technologies").default([]), // Технологии для изучения
  goals: text("goals"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning resources
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'tutorial', 'article', 'video', 'workshop'
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  technologies: json("technologies").default([]),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  difficulty: text("difficulty").notNull(),
  technologies: json("technologies").default([]),
  xpReward: integer("xp_reward").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: integer("max_participants"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge participants
export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  submissionUrl: text("submission_url"),
  status: text("status").notNull().default('joined'), // 'joined', 'submitted', 'completed'
  score: integer("score").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

// Code reviews
export const codeReviews = pgTable("code_reviews", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pullRequestUrl: text("pull_request_url"),
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback").notNull(),
  suggestions: text("suggestions"),
  status: text("status").notNull().default('pending'), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

// User insert schema without auto-generated fields
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

// Repository insert schema without auto-generated fields
export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  status: true,
  createdAt: true,
});

// Weekly stats insert schema without auto-generated fields
export const insertWeeklyStatsSchema = createInsertSchema(weeklyStats).omit({
  id: true,
});

// Activity feed insert schema without auto-generated fields
export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
});

// Repository comments insert schema without auto-generated fields
export const insertRepositoryCommentSchema = createInsertSchema(repositoryComments).omit({
  id: true,
  createdAt: true,
});

// User progress insert schema without auto-generated fields
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  updatedAt: true,
});

// Achievements insert schemas
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

// Mentorship insert schema
export const insertMentorshipSchema = createInsertSchema(mentorships).omit({
  id: true,
  createdAt: true,
});

// Learning resources insert schema
export const insertLearningResourceSchema = createInsertSchema(learningResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Challenges insert schemas
export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joinedAt: true,
});

// Code reviews insert schema
export const insertCodeReviewSchema = createInsertSchema(codeReviews).omit({
  id: true,
  createdAt: true,
});

export const githubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  repositories: many(repositories),
  weeklyStats: many(weeklyStats),
  activityFeed: many(activityFeed),
  repositoryComments: many(repositoryComments),
  progress: one(userProgress),
  userAchievements: many(userAchievements),
  mentorships: many(mentorships, { relationName: "mentorships" }),
  menteeships: many(mentorships, { relationName: "menteeships" }),
  authoredResources: many(learningResources),
  createdChallenges: many(challenges),
  challengeParticipations: many(challengeParticipants),
  codeReviews: many(codeReviews),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  activityFeed: many(activityFeed),
  comments: many(repositoryComments),
}));

export const repositoryCommentsRelations = relations(repositoryComments, ({ one }) => ({
  repository: one(repositories, {
    fields: [repositoryComments.repositoryId],
    references: [repositories.id],
  }),
  user: one(users, {
    fields: [repositoryComments.userId],
    references: [users.id],
  }),
}));

export const weeklyStatsRelations = relations(weeklyStats, ({ one }) => ({
  user: one(users, {
    fields: [weeklyStats.userId],
    references: [users.id],
  }),
}));

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  user: one(users, {
    fields: [activityFeed.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [activityFeed.repositoryId],
    references: [repositories.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const mentorshipsRelations = relations(mentorships, ({ one }) => ({
  mentor: one(users, {
    fields: [mentorships.mentorId],
    references: [users.id],
    relationName: "mentorships",
  }),
  mentee: one(users, {
    fields: [mentorships.menteeId],
    references: [users.id],
    relationName: "menteeships",
  }),
}));

export const learningResourcesRelations = relations(learningResources, ({ one }) => ({
  author: one(users, {
    fields: [learningResources.authorId],
    references: [users.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [challenges.createdBy],
    references: [users.id],
  }),
  participants: many(challengeParticipants),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
}));

export const codeReviewsRelations = relations(codeReviews, ({ one }) => ({
  repository: one(repositories, {
    fields: [codeReviews.repositoryId],
    references: [repositories.id],
  }),
  reviewer: one(users, {
    fields: [codeReviews.reviewerId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type WeeklyStat = typeof weeklyStats.$inferSelect;
export type InsertWeeklyStat = z.infer<typeof insertWeeklyStatsSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;
export type RepositoryComment = typeof repositoryComments.$inferSelect;
export type InsertRepositoryComment = z.infer<typeof insertRepositoryCommentSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type Mentorship = typeof mentorships.$inferSelect;
export type InsertMentorship = z.infer<typeof insertMentorshipSchema>;
export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = z.infer<typeof insertLearningResourceSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;
export type CodeReview = typeof codeReviews.$inferSelect;
export type InsertCodeReview = z.infer<typeof insertCodeReviewSchema>;
export type GithubUser = z.infer<typeof githubUserSchema>;
