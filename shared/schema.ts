import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

export const githubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type WeeklyStat = typeof weeklyStats.$inferSelect;
export type InsertWeeklyStat = z.infer<typeof insertWeeklyStatsSchema>;
export type GithubUser = z.infer<typeof githubUserSchema>;
