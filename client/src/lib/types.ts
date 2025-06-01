// User types
export interface User {
  id: number;
  githubId: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  telegramId: string | null;
  notificationPreference: 'email' | 'telegram';
  onVacation: boolean;
  vacationUntil: string | null;
  isAdmin: boolean;
  lastActive: string;
  createdAt: string;
}

// Repository types
export type RepositoryStatus = 'active' | 'warning' | 'inactive' | 'pending';

export interface Repository {
  id: number;
  userId: number;
  name: string;
  fullName: string;
  lastCommitDate: string | null;
  status: RepositoryStatus;
  lastCommitSha: string | null;
  changesSummary: string | null;
  summaryGeneratedAt: string | null;
  description: string | null;
  descriptionGeneratedAt: string | null;
  isPublic: boolean;
  createdAt: string;
}

// Weekly stats types
export interface WeeklyStat {
  id: number;
  userId: number;
  week: string;
  commitCount: number;
  streakDays: number;
  isViber: boolean;
  stats: Record<string, any>;
}

// Combined types for UI
export interface MemberWithRepositories {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  status: RepositoryStatus;
  repositories: Repository[];
}

export interface ProfileData {
  user: User;
  repositories: Repository[];
}

export interface UserStats {
  totalMembers: number;
  activeMembers: number;
  totalRepositories: number;
  viberOfTheWeek: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface FeaturedMember {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  activeRepoCount: number;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: RepositoryStatus;
  repositoryCount: number;
  lastActivity: string | null;
  onVacation: boolean;
}
