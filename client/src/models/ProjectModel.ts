import { Repository, User, RepositoryComment } from '@shared/schema';

export interface ProjectWithDetails extends Repository {
  user: User;
  comments: (RepositoryComment & { user: User })[];
}

export interface ProjectAnalysis {
  codeQuality: {
    suggestions: string[];
  };
  architecture: {
    suggestions: string[];
  };
  userExperience: {
    suggestions: string[];
  };
  performance: {
    suggestions: string[];
  };
  security: {
    suggestions: string[];
  };
  overallRecommendations: string[];
}

export interface UserProgress {
  id: number;
  userId: number;
  totalCommits: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  experience: number;
  badges: string[];
}

export interface ActivityFeedItem {
  id: number;
  userId: number;
  repositoryId: number;
  type: string;
  summary: string;
  createdAt: string;
  user: User;
  repository: Repository;
}

export interface CommunityMember {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  repositoryCount: number;
  activeRepositories: number;
  status: 'active' | 'warning' | 'inactive';
  progress: UserProgress;
}

export class ProjectModel {
  static getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  static getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Активный';
      case 'warning': return 'Предупреждение';
      case 'inactive': return 'Неактивный';
      default: return 'Неизвестно';
    }
  }

  static formatDate(date: string | null): string {
    if (!date) return 'Неизвестно';
    return new Date(date).toLocaleDateString('ru-RU');
  }

  static calculateLevel(experience: number): number {
    return Math.floor(experience / 100) + 1;
  }

  static getNextLevelExperience(level: number): number {
    return level * 100;
  }
}