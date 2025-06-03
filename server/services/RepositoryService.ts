import { storage } from '../storage';
import { githubClient } from '../github';
import { geminiService } from '../gemini';
import { Repository, InsertRepository, RepositoryComment, InsertRepositoryComment } from '@shared/schema';

export class RepositoryService {
  async getUserRepositories(userId: number): Promise<Repository[]> {
    return await storage.getRepositoriesByUser(userId);
  }

  async getPublicRepositories(): Promise<any[]> {
    return await storage.getPublicRepositories();
  }

  async addRepository(userId: number, repositoryData: { name: string; fullName: string }): Promise<Repository> {
    const insertData: InsertRepository = {
      userId,
      name: repositoryData.name,
      fullName: repositoryData.fullName,
      status: 'pending',
      isPublic: false
    };

    return await storage.createRepository(insertData);
  }

  async deleteRepository(repositoryId: number, userId: number): Promise<void> {
    const repository = await storage.getRepository(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    if (repository.userId !== userId) {
      throw new Error('Unauthorized to delete this repository');
    }

    const success = await storage.deleteRepository(repositoryId);
    if (!success) {
      throw new Error('Failed to delete repository');
    }
  }

  async updateRepositoryVisibility(repositoryId: number, userId: number, isPublic: boolean): Promise<Repository> {
    const repository = await storage.getRepository(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    if (repository.userId !== userId) {
      throw new Error('Unauthorized to update this repository');
    }

    const updatedRepo = await storage.updateRepository(repositoryId, { isPublic });
    if (!updatedRepo) {
      throw new Error('Failed to update repository');
    }

    return updatedRepo;
  }

  async generateDescription(repositoryId: number, userId: number): Promise<{ description: string }> {
    const repository = await storage.getRepository(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    if (repository.userId !== userId) {
      throw new Error('Unauthorized to generate description for this repository');
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const description = await geminiService.generateProjectDescription(repository, user);
      
      await storage.updateRepository(repositoryId, {
        description,
        descriptionGeneratedAt: new Date()
      });

      return { description };
    } catch (error) {
      throw new Error('Failed to generate AI description');
    }
  }

  async checkRepositoryStatus(repository: Repository): Promise<'active' | 'warning' | 'inactive' | 'pending'> {
    if (!repository.lastCommitDate) {
      return 'pending';
    }

    const daysSinceLastCommit = Math.floor(
      (Date.now() - new Date(repository.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCommit <= 7) return 'active';
    if (daysSinceLastCommit <= 14) return 'warning';
    return 'inactive';
  }

  async addComment(repositoryId: number, userId: number, content: string): Promise<RepositoryComment> {
    const repository = await storage.getRepository(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }

    if (!repository.isPublic) {
      throw new Error('Cannot comment on private repository');
    }

    const commentData: InsertRepositoryComment = {
      repositoryId,
      userId,
      content: content.trim()
    };

    return await storage.createRepositoryComment(commentData);
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const success = await storage.deleteRepositoryComment(commentId, userId);
    if (!success) {
      throw new Error('Failed to delete comment or unauthorized');
    }
  }

  async getRepositoryComments(repositoryId: number): Promise<any[]> {
    return await storage.getRepositoryComments(repositoryId);
  }

  async syncWithGitHub(repository: Repository, userToken?: string): Promise<Repository> {
    if (!userToken) {
      throw new Error('GitHub token required for synchronization');
    }

    try {
      githubClient.setToken(userToken);
      
      const latestCommit = await githubClient.getLatestCommit(repository.fullName);
      const newStatus = githubClient.calculateRepositoryStatus(
        latestCommit ? new Date(latestCommit.commit.committer.date) : null
      );

      const updateData: Partial<Repository> = {
        lastCommitDate: latestCommit ? new Date(latestCommit.commit.committer.date) : null,
        lastCommitSha: latestCommit?.sha || null,
        status: newStatus
      };

      const updatedRepo = await storage.updateRepository(repository.id, updateData);
      if (!updatedRepo) {
        throw new Error('Failed to update repository');
      }

      return updatedRepo;
    } catch (error) {
      console.error(`Error syncing repository ${repository.fullName}:`, error);
      throw error;
    }
  }
}