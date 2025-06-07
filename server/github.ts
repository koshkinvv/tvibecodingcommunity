import fetch from 'node-fetch';
import { Repository } from '@shared/schema';

// GitHub API client with rate limiting and error handling
export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private userAgent = 'VibeCoding-App/1.0.0';
  private requestCount = 0;
  private lastResetTime = Date.now();
  private maxRequestsPerHour = 5000; // GitHub API limit

  constructor(private token?: string) {}

  setToken(token: string) {
    this.token = token;
  }

  private checkRateLimit() {
    const now = Date.now();
    const hoursSinceReset = (now - this.lastResetTime) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 1) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.requestCount >= this.maxRequestsPerHour) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    
    this.requestCount++;
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
    
    this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token is invalid or expired. Please re-authenticate.');
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error.name === 'FetchError' && error.code === 'ETIMEDOUT') {
        throw new Error('GitHub API request timed out. Please try again.');
      }
      throw error;
    }
  }

  async getUserRepositories() {
    if (!this.token) {
      throw new Error('Authentication token required');
    }
    
    this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/user/repos?sort=updated&per_page=100`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token is invalid or expired. Please re-authenticate.');
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const repos = await response.json() as any[];
      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        updatedAt: repo.updated_at
      }));
    } catch (error) {
      if (error.name === 'FetchError' && error.code === 'ETIMEDOUT') {
        throw new Error('GitHub API request timed out. Please try again.');
      }
      throw error;
    }
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
    this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/repos/${fullName}/commits?per_page=1`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token is invalid or expired. Please re-authenticate.');
        }
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
        }
        if (response.status === 404) {
          throw new Error(`Repository ${fullName} not found or not accessible.`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const commits = await response.json() as any[];
      return commits.length > 0 ? commits[0] : null;
    } catch (error: any) {
      if (error.message.includes('GitHub')) {
        throw error; // Re-throw GitHub-specific errors
      }
      throw new Error(`Failed to fetch latest commit for ${fullName}: ${error.message}`);
    }
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
          const sinceCommit = await sinceCommitResponse.json() as any;
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

        const commits = await response.json() as any[];
        
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
          
          const pageCommits = await pageResponse.json() as any[];
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
        
        return allCommits as any[];
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

  async getRepositoryContents(fullName: string, path: string = ''): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${fullName}/contents/${path}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as any[];
    } catch (error) {
      console.error(`Error fetching contents for ${fullName}/${path}:`, error);
      throw error;
    }
  }

  async getFileContent(fullName: string, filePath: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${fullName}/contents/${filePath}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json() as any;
      if (data.type === 'file' && data.content) {
        // GitHub returns base64 encoded content
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching file content for ${fullName}/${filePath}:`, error);
      return null;
    }
  }

  async getRepositoryStructure(fullName: string): Promise<{
    readme: string | null;
    packageJson: any | null;
    mainFiles: { path: string; content: string; size: number }[];
    fileTypes: { [key: string]: number };
    totalFiles: number;
  }> {
    try {
      const structure = {
        readme: null as string | null,
        packageJson: null as any,
        mainFiles: [] as { path: string; content: string; size: number }[],
        fileTypes: {} as { [key: string]: number },
        totalFiles: 0
      };

      // Get repository root contents
      const rootContents = await this.getRepositoryContents(fullName);
      
      // Find and read important files
      const importantFiles = ['README.md', 'package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts'];
      
      for (const item of rootContents) {
        if (item.type === 'file') {
          structure.totalFiles++;
          
          // Count file types
          const extension = item.name.split('.').pop()?.toLowerCase() || 'no-ext';
          structure.fileTypes[extension] = (structure.fileTypes[extension] || 0) + 1;
          
          // Get content of important files
          if (importantFiles.includes(item.name)) {
            const content = await this.getFileContent(fullName, item.path);
            if (content) {
              if (item.name === 'README.md') {
                structure.readme = content;
              } else if (item.name === 'package.json') {
                try {
                  structure.packageJson = JSON.parse(content);
                } catch (e) {
                  console.log('Failed to parse package.json');
                }
              }
              
              structure.mainFiles.push({
                path: item.path,
                content: content.substring(0, 2000), // Limit content length
                size: item.size
              });
            }
          }
        }
      }

      // Scan subdirectories for more files
      await this.scanDirectory(fullName, rootContents, structure, 1);
      
      return structure;
    } catch (error) {
      console.error(`Error getting repository structure for ${fullName}:`, error);
      throw error;
    }
  }

  private async scanDirectory(fullName: string, contents: any[], structure: any, depth: number): Promise<void> {
    if (depth > 2) return; // Limit recursion depth

    for (const item of contents) {
      if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules') {
        try {
          const dirContents = await this.getRepositoryContents(fullName, item.path);
          
          for (const subItem of dirContents) {
            if (subItem.type === 'file') {
              structure.totalFiles++;
              
              const extension = subItem.name.split('.').pop()?.toLowerCase() || 'no-ext';
              structure.fileTypes[extension] = (structure.fileTypes[extension] || 0) + 1;
              
              // Get content of key source files
              if (['ts', 'tsx', 'js', 'jsx'].includes(extension) && structure.mainFiles.length < 10) {
                const content = await this.getFileContent(fullName, subItem.path);
                if (content && content.length > 100) { // Only non-trivial files
                  structure.mainFiles.push({
                    path: subItem.path,
                    content: content.substring(0, 1500),
                    size: subItem.size
                  });
                }
              }
            }
          }
          
          // Recurse into subdirectories
          await this.scanDirectory(fullName, dirContents, structure, depth + 1);
        } catch (error) {
          console.log(`Skipping directory ${item.path}: ${error}`);
        }
      }
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
