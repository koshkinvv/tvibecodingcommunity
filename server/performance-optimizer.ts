import { GoogleGenerativeAI } from "@google/generative-ai";
import { githubClient } from "./github";
import { storage } from "./storage";
import type { Repository, User } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export interface PerformanceOptimization {
  id: string;
  category: 'code' | 'architecture' | 'database' | 'frontend' | 'security' | 'deployment';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  implementation: {
    steps: string[];
    codeExample?: string;
    resources: string[];
  };
  metrics: {
    expectedImprovement: string;
    measurableKPIs: string[];
  };
}

export interface PerformanceAnalysisResult {
  repositoryId: number;
  repositoryName: string;
  overallScore: number; // 1-100
  optimizations: PerformanceOptimization[];
  summary: {
    criticalIssues: number;
    quickWins: number;
    estimatedImprovementTime: string;
  };
  generatedAt: Date;
}

export class PerformanceOptimizer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzeRepository(user: User, repository: Repository): Promise<PerformanceAnalysisResult> {
    try {
      // Set GitHub token for the user
      if (user.githubToken) {
        githubClient.setToken(user.githubToken);
      }

      // Get repository structure and recent commits
      const repoData = await githubClient.getRepository(
        repository.fullName.split('/')[0],
        repository.fullName.split('/')[1]
      );

      const commits = await githubClient.getCommitsSince(repository.fullName);
      const recentCommits = commits.slice(0, 10); // Last 10 commits

      // Analyze repository with AI
      const analysisPrompt = this.buildAnalysisPrompt(repository, repoData, recentCommits);
      const result = await this.model.generateContent(analysisPrompt);
      const analysisText = result.response.text();

      // Parse AI response into structured optimizations
      const optimizations = this.parseOptimizations(analysisText);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(optimizations);

      // Generate summary
      const summary = this.generateSummary(optimizations);

      return {
        repositoryId: repository.id,
        repositoryName: repository.fullName,
        overallScore,
        optimizations,
        summary,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error analyzing repository ${repository.fullName}:`, error);
      throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAnalysisPrompt(repository: Repository, repoData: any, commits: any[]): string {
    const repoInfo = {
      name: repository.fullName,
      language: repoData?.language || 'Unknown',
      size: repoData?.size || 0,
      stars: repoData?.stargazers_count || 0,
      forks: repoData?.forks_count || 0,
      openIssues: repoData?.open_issues_count || 0,
      lastUpdate: repository.lastCommitDate,
      commitActivity: commits.length
    };

    return `
You are a senior software engineer analyzing a repository for performance optimization opportunities.

Repository Information:
- Name: ${repoInfo.name}
- Primary Language: ${repoInfo.language}
- Size: ${repoInfo.size} KB
- Stars: ${repoInfo.stars}
- Forks: ${repoInfo.forks}
- Open Issues: ${repoInfo.openIssues}
- Last Update: ${repoInfo.lastUpdate}
- Recent Commit Activity: ${repoInfo.commitActivity} commits

Recent Commits:
${commits.map(commit => `- ${commit.commit?.message || 'No message'} (${commit.commit?.author?.date})`).join('\n')}

Analyze this repository and provide specific, actionable performance optimization suggestions.

Please provide your analysis in the following JSON format:
{
  "optimizations": [
    {
      "id": "unique-id",
      "category": "code|architecture|database|frontend|security|deployment",
      "title": "Brief optimization title",
      "description": "Detailed description of the issue and why it matters",
      "impact": "low|medium|high|critical",
      "effort": "low|medium|high",
      "priority": 1-10,
      "implementation": {
        "steps": ["Step 1", "Step 2", "Step 3"],
        "codeExample": "Optional code example",
        "resources": ["Resource 1", "Resource 2"]
      },
      "metrics": {
        "expectedImprovement": "Expected improvement description",
        "measurableKPIs": ["KPI 1", "KPI 2"]
      }
    }
  ]
}

Focus on:
1. Code quality and performance patterns
2. Architecture improvements
3. Security vulnerabilities
4. Database optimization (if applicable)
5. Frontend performance (if applicable)
6. Deployment and DevOps improvements

Provide 3-8 specific, actionable recommendations based on the repository's technology stack and activity patterns.
`;
  }

  private parseOptimizations(analysisText: string): PerformanceOptimization[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.optimizations || [];
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      
      // Fallback: create generic optimizations if parsing fails
      return this.createFallbackOptimizations();
    }
  }

  private createFallbackOptimizations(): PerformanceOptimization[] {
    return [
      {
        id: 'code-review',
        category: 'code',
        title: 'Code Quality Review',
        description: 'Review code for performance anti-patterns and optimization opportunities',
        impact: 'medium',
        effort: 'medium',
        priority: 7,
        implementation: {
          steps: [
            'Run static code analysis tools',
            'Identify performance bottlenecks',
            'Refactor critical code paths'
          ],
          resources: ['ESLint', 'SonarQube', 'Code review guidelines']
        },
        metrics: {
          expectedImprovement: '15-30% performance improvement',
          measurableKPIs: ['Code execution time', 'Memory usage', 'CPU utilization']
        }
      },
      {
        id: 'dependency-audit',
        category: 'security',
        title: 'Dependency Security Audit',
        description: 'Update dependencies and fix security vulnerabilities',
        impact: 'high',
        effort: 'low',
        priority: 9,
        implementation: {
          steps: [
            'Run npm audit or equivalent',
            'Update vulnerable packages',
            'Test for breaking changes'
          ],
          resources: ['npm audit', 'Snyk', 'OWASP guidelines']
        },
        metrics: {
          expectedImprovement: 'Reduced security risk',
          measurableKPIs: ['Vulnerability count', 'Security score']
        }
      }
    ];
  }

  private calculateOverallScore(optimizations: PerformanceOptimization[]): number {
    if (optimizations.length === 0) return 85;

    const totalPenalty = optimizations.reduce((sum, opt) => {
      const impactWeight = { low: 1, medium: 3, high: 7, critical: 15 };
      return sum + impactWeight[opt.impact];
    }, 0);

    // Start with 100 and subtract penalties
    const score = Math.max(20, 100 - totalPenalty);
    return Math.round(score);
  }

  private generateSummary(optimizations: PerformanceOptimization[]) {
    const criticalIssues = optimizations.filter(opt => opt.impact === 'critical').length;
    const quickWins = optimizations.filter(opt => opt.effort === 'low' && opt.impact !== 'low').length;
    
    const totalEffort = optimizations.reduce((sum, opt) => {
      const effortHours = { low: 2, medium: 8, high: 24 };
      return sum + effortHours[opt.effort];
    }, 0);

    const estimatedTime = totalEffort < 8 ? '1 day' : 
                         totalEffort < 24 ? '1-3 days' : 
                         totalEffort < 80 ? '1-2 weeks' : '2-4 weeks';

    return {
      criticalIssues,
      quickWins,
      estimatedImprovementTime: estimatedTime
    };
  }

  async getRepositoryOptimizations(userId: number, repositoryId: number): Promise<PerformanceAnalysisResult | null> {
    // This would typically fetch from a cache/database
    // For now, we'll generate on-demand
    const user = await storage.getUser(userId);
    const repository = await storage.getRepository(repositoryId);

    if (!user || !repository) {
      return null;
    }

    return await this.analyzeRepository(user, repository);
  }
}

export const performanceOptimizer = new PerformanceOptimizer();