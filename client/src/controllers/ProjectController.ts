import { apiRequest } from '@/lib/queryClient';
import { Repository, RepositoryComment } from '@shared/schema';

export class ProjectController {
  static async getPublicProjects(): Promise<Repository[]> {
    return await apiRequest('GET', '/api/projects');
  }

  static async addComment(repositoryId: number, content: string): Promise<RepositoryComment> {
    return await apiRequest('POST', `/api/repositories/${repositoryId}/comments`, { content });
  }

  static async deleteComment(commentId: number): Promise<void> {
    return await apiRequest('DELETE', `/api/comments/${commentId}`);
  }

  static async generateDescription(repositoryId: number): Promise<{ description: string }> {
    return await apiRequest('POST', `/api/repositories/${repositoryId}/generate-description`);
  }
}

export class UserController {
  static async getUserRepositories(): Promise<Repository[]> {
    return await apiRequest('GET', '/api/user/repositories');
  }

  static async addRepository(repository: { name: string; fullName: string }): Promise<Repository> {
    return await apiRequest('POST', '/api/repositories', repository);
  }

  static async deleteRepository(repositoryId: number): Promise<void> {
    return await apiRequest('DELETE', `/api/repositories/${repositoryId}`);
  }

  static async getUserProgress(): Promise<any> {
    return await apiRequest('GET', '/api/user/progress');
  }
}

export class CommunityController {
  static async getCommunityMembers(): Promise<any[]> {
    return await apiRequest('GET', '/api/community');
  }

  static async getActivityFeed(): Promise<any[]> {
    return await apiRequest('GET', '/api/activity');
  }

  static async getLeaderboard(): Promise<any[]> {
    return await apiRequest('GET', '/api/leaderboard');
  }
}

export class AdminController {
  static async getAdminUsers(): Promise<any[]> {
    return await apiRequest('GET', '/api/admin/users');
  }

  static async triggerRepositoryCheck(): Promise<any> {
    return await apiRequest('POST', '/api/admin/check-repositories');
  }

  static async updateUserVacation(userId: number, onVacation: boolean, vacationUntil?: string): Promise<any> {
    return await apiRequest('PUT', `/api/admin/users/${userId}/vacation`, { onVacation, vacationUntil });
  }

  static async deleteUser(userId: number): Promise<void> {
    return await apiRequest('DELETE', `/api/admin/users/${userId}`);
  }
}