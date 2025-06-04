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
  telegramUsername: text("telegram_username"),
  telegramConnected: boolean("telegram_connected").default(false),
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
export type GithubUser = z.infer<typeof githubUserSchema>;
