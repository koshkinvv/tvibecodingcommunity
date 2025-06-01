import { githubClient } from './github';
import { storage } from './storage';
import { getNotificationService } from './notification';
import { openaiService } from './openai';

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
            // Get last commit date
            const lastCommitDate = await githubClient.getLastCommitDate(repo);
            
            // Calculate repository status
            const status = githubClient.calculateRepositoryStatus(lastCommitDate);
            
            // Update repository with new status and last commit date
            await storage.updateRepository(repo.id, {
              status,
              lastCommitDate
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
              isViber: false
            });
          }
        }
        
        // Set new viber
        const bestUserStats = await storage.getWeeklyStatsByUser(bestUser.id);
        const currentStats = bestUserStats.find(s => s.week === currentWeek);
        
        if (currentStats) {
          await storage.updateWeeklyStats({
            ...currentStats,
            isViber: true
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
}

// Export singleton instance
export const scheduler = Scheduler.getInstance();
