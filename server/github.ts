import fetch from 'node-fetch';
import { Repository } from '@shared/schema';

// GitHub API client for getting repository information
export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private userAgent = 'VibeCoding-App/1.0.0';

  constructor(private token?: string) {}

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    
    return headers;
  }

  async getUserProfile() {
    if (!this.token) {
      throw new Error('Authentication token required');
    }
    
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getUserRepositories() {
    if (!this.token) {
      throw new Error('Authentication token required');
    }
    
    const response = await fetch(`${this.baseUrl}/user/repos?sort=updated&per_page=100`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const repos = await response.json();
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      updatedAt: repo.updated_at
    }));
  }

  async getRepository(owner: string, repo: string) {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getLatestCommit(fullName: string) {
    const response = await fetch(`${this.baseUrl}/repos/${fullName}/commits?per_page=1`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const commits = await response.json();
    return commits.length > 0 ? commits[0] : null;
  }

  async getCommitsSince(fullName: string, sinceCommitSha?: string): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/repos/${fullName}/commits`;
      const params = new URLSearchParams();
      
      if (sinceCommitSha) {
        // Получаем коммиты с определенной даты
        const sinceCommitResponse = await fetch(`${this.baseUrl}/repos/${fullName}/commits/${sinceCommitSha}`, {
          headers: this.getHeaders()
        });
        
        if (sinceCommitResponse.ok) {
          const sinceCommit = await sinceCommitResponse.json();
          params.append('since', sinceCommit.commit.author.date);
        }
      } else {
        // Если нет предыдущего коммита, берем последние 100 коммитов для полной статистики
        params.append('per_page', '100');
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.status}`);
      }

      const commits = await response.json();
      
      // Фильтруем коммиты, исключая sinceCommitSha если он есть
      const filteredCommits = sinceCommitSha 
        ? commits.filter((commit: any) => commit.sha !== sinceCommitSha)
        : commits;

      // Для активности берем только последние 5 коммитов с деталями
      const recentCommitsForActivity = filteredCommits.slice(0, 5);
      const detailedCommits = await Promise.all(
        recentCommitsForActivity.map(async (commit: any) => {
          try {
            const detailResponse = await fetch(`${this.baseUrl}/repos/${fullName}/commits/${commit.sha}`, {
              headers: this.getHeaders()
            });
            
            if (detailResponse.ok) {
              return await detailResponse.json();
            }
            return commit;
          } catch (error) {
            console.error(`Error fetching commit details for ${commit.sha}:`, error);
            return commit;
          }
        })
      );

      // Возвращаем все коммиты для правильного подсчета статистики
      return filteredCommits.map((commit, index) => {
        if (index < 5 && detailedCommits[index]) {
          return detailedCommits[index];
        }
        return commit;
      });
    } catch (error) {
      console.error(`Error fetching commits for ${fullName}:`, error);
      return [];
    }
  }

  async checkRepositoryExists(fullName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${fullName}`, {
        headers: this.getHeaders()
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Calculate repository status based on last commit date
  calculateRepositoryStatus(lastCommitDate: Date | null): 'active' | 'warning' | 'inactive' | 'pending' {
    if (!lastCommitDate) return 'pending';
    
    const now = new Date();
    const daysAgo = (now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysAgo <= 7) {
      return 'active';
    } else if (daysAgo <= 14) {
      return 'warning';
    } else {
      return 'inactive';
    }
  }

  // Fetch latest commit date for a repository
  async getLastCommitDate(repository: Repository): Promise<Date | null> {
    try {
      const commit = await this.getLatestCommit(repository.fullName);
      if (!commit) return null;
      
      // GitHub commit date format: "2023-04-15T12:34:56Z"
      return new Date(commit.commit.author.date);
    } catch (error) {
      console.error(`Error fetching last commit for ${repository.fullName}:`, error);
      return null;
    }
  }
}

export const githubClient = new GitHubClient();
