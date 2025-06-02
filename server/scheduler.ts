import { githubClient } from './github';
import { storage } from './storage';
import { getNotificationService } from './notification';
import { geminiService } from './gemini';

// Class to handle scheduled tasks
export class Scheduler {
  private static instance: Scheduler;
  private dailyCheckInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }
  
  // Start the daily check scheduler
  public startDailyCheck() {
    // Run immediately once
    this.performDailyCheck();
    
    // Then schedule it to run every 24 hours
    // Using setInterval for simplicity; in a production app, consider a proper cron scheduler
    this.dailyCheckInterval = setInterval(() => {
      this.performDailyCheck();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    console.log('Daily repository check scheduler started');
  }
  
  // Stop the scheduler
  public stopDailyCheck() {
    if (this.dailyCheckInterval) {
      clearInterval(this.dailyCheckInterval);
      this.dailyCheckInterval = null;
      console.log('Daily repository check scheduler stopped');
    }
  }
  
  // Main function to check all repositories
  private async performDailyCheck() {
    console.log('Performing daily repository check...');
    
    try {
      // Get all users (except those on vacation)
      const users = await storage.getUsers();
      
      for (const user of users) {
        // Skip users on vacation
        if (user.onVacation) {
          if (user.vacationUntil && new Date() > new Date(user.vacationUntil)) {
            // Vacation period ended, reset the vacation mode
            await storage.updateUser(user.id, {
              onVacation: false,
              vacationUntil: null
            });
            console.log(`Vacation ended for user: ${user.username}`);
          } else {
            // User still on vacation, skip
            continue;
          }
        }
        
        // Get user's repositories
        const repositories = await storage.getRepositoriesByUser(user.id);
        if (repositories.length === 0) continue;
        
        // Initialize GitHub client with user's token
        if (user.githubToken) {
          githubClient.setToken(user.githubToken);
        } else {
          // Skip if we don't have a token
          console.log(`No GitHub token for user: ${user.username}, skipping`);
          continue;
        }
        
        // Track if user has any inactive or warning repositories
        let hasWarningRepos = false;
        let hasInactiveRepos = false;
        
        // Check each repository
        for (const repo of repositories) {
          try {
            // Get latest commit information
            const latestCommit = await githubClient.getLatestCommit(repo.fullName);
            
            if (!latestCommit) {
              console.log(`No commits found for repository ${repo.fullName}`);
              continue;
            }

            const lastCommitDate = new Date(latestCommit.commit.author.date);
            const newCommitSha = latestCommit.sha;
            
            // Calculate repository status
            const status = githubClient.calculateRepositoryStatus(lastCommitDate);
            
            // Check if there are new commits since last check
            let changesSummary = repo.changesSummary;
            let summaryGeneratedAt = repo.summaryGeneratedAt;
            
            if (repo.lastCommitSha !== newCommitSha) {
              console.log(`New commits detected in ${repo.fullName}`);
              
              try {
                // Get commits since last check
                const newCommits = await githubClient.getCommitsSince(repo.fullName, repo.lastCommitSha || undefined);
                
                if (newCommits.length > 0) {
                  // Generate AI summary of changes
                  changesSummary = await geminiService.generateChangesSummary(newCommits);
                  summaryGeneratedAt = new Date();
                  
                  console.log(`Generated summary for ${repo.fullName}: ${changesSummary}`);
                  
                  // Only create activity feed entry if this is a real update (not initial run)
                  if (repo.lastCommitSha) {
                    // Create a single activity feed entry for the batch of commits
                    const latestCommit = newCommits[0]; // Most recent commit
                    const totalFilesChanged = newCommits.reduce((sum, commit) => sum + (commit.files?.length || 0), 0);
                    const totalLinesAdded = newCommits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
                    const totalLinesDeleted = newCommits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);
                    
                    // Prepare commit details for storage
                    const commitDetails = newCommits.map(commit => ({
                      sha: commit.sha,
                      message: commit.commit.message,
                      author: commit.commit.author.name,
                      date: commit.commit.author.date,
                      filesChanged: commit.files?.length || 0,
                      linesAdded: commit.stats?.additions || 0,
                      linesDeleted: commit.stats?.deletions || 0,
                    }));
                    
                    await storage.createActivityFeedEntry({
                      userId: repo.userId,
                      repositoryId: repo.id,
                      commitSha: latestCommit.sha,
                      commitMessage: newCommits.length === 1 ? latestCommit.commit.message : `${newCommits.length} новых коммитов`,
                      commitCount: newCommits.length,
                      commits: commitDetails,
                      filesChanged: totalFilesChanged,
                      linesAdded: totalLinesAdded,
                      linesDeleted: totalLinesDeleted,
                      aiSummary: changesSummary,
                      commitDate: new Date(latestCommit.commit.author.date),
                    });
                    
                    console.log(`Created activity feed entry for ${repo.fullName} with ${newCommits.length} commits`);
                  } else {
                    console.log(`Skipping activity feed for initial check of ${repo.fullName}`);
                  }
                }
              } catch (error) {
                console.error(`Error generating summary for ${repo.fullName}:`, error);
                changesSummary = "Не удалось проанализировать изменения";
                summaryGeneratedAt = new Date();
              }
            }
            
            // Update repository with new information
            await storage.updateRepository(repo.id, {
              status,
              lastCommitDate,
              lastCommitSha: newCommitSha,
              changesSummary,
              summaryGeneratedAt
            });
            
            // Track warning/inactive status
            if (status === 'warning') hasWarningRepos = true;
            if (status === 'inactive') hasInactiveRepos = true;
            
            console.log(`Repository ${repo.fullName} status: ${status}`);
          } catch (error) {
            console.error(`Error checking repository ${repo.fullName}:`, error);
          }
        }
        
        // Get updated repositories for notifications
        const updatedRepos = await storage.getRepositoriesByUser(user.id);
        
        // Send notifications if necessary
        const notificationService = getNotificationService(user);
        
        if (hasInactiveRepos) {
          await notificationService.sendInactivityAlert(user, updatedRepos);
        } else if (hasWarningRepos) {
          await notificationService.sendInactivityWarning(user, updatedRepos);
        }
        
        // Update user's last active status based on repositories
        const activeRepos = updatedRepos.filter(r => r.status === 'active');
        if (activeRepos.length > 0) {
          // If user has any active repositories, consider them active
          await storage.updateUser(user.id, { lastActive: new Date() });
        }

        // Update user progress based on all their repositories
        await this.updateUserProgress(user.id);
      }
      
      // Calculate and set "Viber of the Week"
      await this.calculateViberOfTheWeek();
      
      console.log('Daily repository check completed');
    } catch (error) {
      console.error('Error during daily repository check:', error);
    }
  }
  
  // Calculate which user deserves "Viber of the Week" badge
  private async calculateViberOfTheWeek() {
    try {
      const users = await storage.getActiveUsers();
      if (users.length === 0) return;
      
      let bestUser = null;
      let bestScore = -1;
      
      for (const user of users) {
        const repos = await storage.getRepositoriesByUser(user.id);
        
        // Skip users with no repositories
        if (repos.length === 0) continue;
        
        // Calculate a simple score based on repository activity
        let score = 0;
        
        // Count active repos
        const activeRepos = repos.filter(r => r.status === 'active');
        score += activeRepos.length * 10;
        
        // Penalize for warning repos
        const warningRepos = repos.filter(r => r.status === 'warning');
        score -= warningRepos.length * 3;
        
        // Heavily penalize for inactive repos
        const inactiveRepos = repos.filter(r => r.status === 'inactive');
        score -= inactiveRepos.length * 7;
        
        // Consider user with the best score
        if (score > bestScore) {
          bestScore = score;
          bestUser = user;
        }
      }
      
      if (bestUser && bestScore > 0) {
        // Create or update weekly stats for the viber
        const currentWeek = this.getCurrentWeekIdentifier();
        
        // Reset viber status for all users for current week
        const allStats = await Promise.all(
          users.map(u => storage.getWeeklyStatsByUser(u.id))
        );
        
        for (const stats of allStats) {
          const currentWeekStat = stats.find(s => s.week === currentWeek);
          if (currentWeekStat && currentWeekStat.isViber) {
            await storage.updateWeeklyStats({
              ...currentWeekStat,
              isViber: false,
              stats: currentWeekStat.stats as any
            });
          }
        }
        
        // Set new viber
        const bestUserStats = await storage.getWeeklyStatsByUser(bestUser.id);
        const currentStats = bestUserStats.find(s => s.week === currentWeek);
        
        if (currentStats) {
          await storage.updateWeeklyStats({
            ...currentStats,
            isViber: true,
            stats: currentStats.stats as any
          });
        } else {
          await storage.updateWeeklyStats({
            userId: bestUser.id,
            week: currentWeek,
            commitCount: 0,
            streakDays: 0,
            isViber: true,
            stats: {}
          });
        }
        
        console.log(`Viber of the week set to: ${bestUser.username}`);
      }
    } catch (error) {
      console.error('Error calculating viber of the week:', error);
    }
  }
  
  // Helper to get week identifier in YYYY-WW format
  private getCurrentWeekIdentifier(): string {
    const now = new Date();
    const year = now.getFullYear();
    
    // Calculate week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-${weekNumber.toString().padStart(2, '0')}`;
  }

  // Update user progress based on their repositories
  private async updateUserProgress(userId: number) {
    try {
      const repositories = await storage.getRepositoriesByUser(userId);
      
      if (repositories.length === 0) {
        return;
      }

      let totalCommits = 0;
      const activeDaysSet = new Set<string>();
      let lastActivityDate: Date | null = null;

      // Calculate stats from all repositories
      for (const repo of repositories) {
        try {
          // Get all commits from this repository
          const commits = await githubClient.getCommitsSince(repo.fullName);
          
          if (commits && commits.length > 0) {
            totalCommits += commits.length;

            // Track unique active days
            commits.forEach(commit => {
              if (commit.commit?.author?.date) {
                const commitDate = new Date(commit.commit.author.date);
                const dayKey = commitDate.toISOString().split('T')[0]; // YYYY-MM-DD
                activeDaysSet.add(dayKey);

                // Track most recent activity
                if (!lastActivityDate || commitDate > lastActivityDate) {
                  lastActivityDate = commitDate;
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching commits for ${repo.fullName}:`, error);
        }
      }

      const activeDays = activeDaysSet.size;

      // Calculate current streak
      let currentStreak = 0;
      if (activeDaysSet.size > 0) {
        const sortedDays = Array.from(activeDaysSet).sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Check if user was active today or yesterday to continue streak
        if (sortedDays.includes(today) || sortedDays.includes(yesterday)) {
          currentStreak = 1;
          
          // Count consecutive days backwards
          for (let i = 1; i < sortedDays.length; i++) {
            const currentDay = new Date(sortedDays[i]);
            const previousDay = new Date(sortedDays[i - 1]);
            const dayDiff = Math.abs((previousDay.getTime() - currentDay.getTime()) / (24 * 60 * 60 * 1000));
            
            if (dayDiff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // Calculate experience (simple formula: commits * 10)
      const experience = totalCommits * 10;

      // Update user progress with absolute values
      await storage.updateUserProgressStats(userId, {
        commits: totalCommits,
        activeDays: activeDays,
        currentStreak: currentStreak,
        experience: experience
      });

      console.log(`Updated progress for user ${userId}: ${totalCommits} commits, ${activeDays} active days, ${currentStreak} streak`);
    } catch (error) {
      console.error(`Error updating progress for user ${userId}:`, error);
    }
  }
}

// Export singleton instance
export const scheduler = Scheduler.getInstance();
