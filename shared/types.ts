import { z } from 'zod';

// Common API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
});

// User-related schemas
export const updateUserSettingsSchema = z.object({
  notificationPreference: z.enum(['email', 'telegram', 'both']).optional(),
  telegramId: z.string().optional(),
});

// Repository-related schemas
export const addRepositoryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  fullName: z.string().regex(/^[\w\-\.]+\/[\w\-\.]+$/),
});

export const updateRepositoryVisibilitySchema = z.object({
  isPublic: z.boolean(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// Admin-related schemas
export const setUserVacationSchema = z.object({
  onVacation: z.boolean(),
  vacationUntil: z.string().optional(),
});

// Analytics schemas
export const projectAnalysisRequestSchema = z.object({
  repositoryId: z.number().optional(),
});

// GitHub integration schemas
export const githubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
});

export const githubCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    message: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    }),
    committer: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    }),
  }),
  author: z.object({
    login: z.string(),
    avatar_url: z.string(),
  }).nullable(),
});

// Type exports
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type UpdateUserSettingsRequest = z.infer<typeof updateUserSettingsSchema>;
export type AddRepositoryRequest = z.infer<typeof addRepositoryRequestSchema>;
export type UpdateRepositoryVisibilityRequest = z.infer<typeof updateRepositoryVisibilitySchema>;
export type AddCommentRequest = z.infer<typeof addCommentSchema>;
export type SetUserVacationRequest = z.infer<typeof setUserVacationSchema>;
export type ProjectAnalysisRequest = z.infer<typeof projectAnalysisRequestSchema>;
export type GitHubRepository = z.infer<typeof githubRepositorySchema>;
export type GitHubCommit = z.infer<typeof githubCommitSchema>;

// Extended types for API responses
export interface UserProfileResponse {
  user: {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    isAdmin: boolean | null;
    onVacation: boolean | null;
    vacationUntil: Date | null;
    createdAt: Date | null;
  };
  repositories: Array<{
    id: number;
    name: string;
    fullName: string;
    status: string;
    isPublic: boolean;
    lastCommitDate: Date | null;
    description: string | null;
  }>;
  progress: {
    totalCommits: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    experience: number;
    badges: string[];
  } | null;
}

export interface LeaderboardEntry {
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  progress: {
    totalCommits: number;
    activeDays: number;
    currentStreak: number;
    level: number;
    experience: number;
  };
  rank: number;
}

export interface PlatformStats {
  totalMembers: number;
  activeMembers: number;
  totalRepositories: number;
  averageCommitsPerUser: number;
  topContributors: Array<{
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  }>;
}

export interface ActivityFeedItem {
  id: number;
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  repository: {
    id: number;
    name: string;
    fullName: string;
  };
  commitSha: string;
  commitMessage: string;
  aiSummary: string | null;
  commitDate: string;
  filesChanged: number | null;
  linesAdded: number | null;
  linesDeleted: number | null;
}

export interface ProjectWithComments {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  status: string;
  lastCommitDate: Date | null;
  isPublic: boolean;
  user: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  comments: Array<{
    id: number;
    content: string;
    createdAt: Date;
    user: {
      id: number;
      username: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
}

// Error types
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}