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
      if (sinceCommitSha) {
        // Получаем коммиты с определенной даты
        const sinceCommitResponse = await fetch(`${this.baseUrl}/repos/${fullName}/commits/${sinceCommitSha}`, {
          headers: this.getHeaders()
        });
        
        let url = `${this.baseUrl}/repos/${fullName}/commits`;
        const params = new URLSearchParams();
        
        if (sinceCommitResponse.ok) {
          const sinceCommit = await sinceCommitResponse.json();
          params.append('since', sinceCommit.commit.author.date);
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
        const filteredCommits = commits.filter((commit: any) => commit.sha !== sinceCommitSha);
        return filteredCommits;
      } else {
        // Если нет предыдущего коммита, берем последние 2000 коммитов для полной статистики
        let allCommits = [];
        let page = 1;
        const maxPages = 20; // 20 страниц по 100 = 2000 коммитов максимум
        
        while (page <= maxPages) {
          const pageUrl = `${this.baseUrl}/repos/${fullName}/commits?per_page=100&page=${page}`;
          const pageResponse = await fetch(pageUrl, {
            headers: this.getHeaders()
          });
          
          if (!pageResponse.ok) {
            break;
          }
          
          const pageCommits = await pageResponse.json();
          if (!pageCommits || pageCommits.length === 0) {
            break;
          }
          
          allCommits.push(...pageCommits);
          
          // Если получили меньше 100 коммитов, значит это последняя страница
          if (pageCommits.length < 100) {
            break;
          }
          
          page++;
        }
        
        return allCommits;
      }
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
