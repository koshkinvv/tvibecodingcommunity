import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { User, Repository } from '@shared/schema';

export interface NotificationService {
  sendInactivityWarning(user: User, repositories: Repository[]): Promise<boolean>;
  sendInactivityAlert(user: User, repositories: Repository[]): Promise<boolean>;
}

// Email service using nodemailer
export class EmailService implements NotificationService {
  private transporter;
  
  constructor() {
    // For production, use environment variables
    const host = process.env.SMTP_HOST || 'smtp.example.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  }
  
  async sendInactivityWarning(user: User, repositories: Repository[]): Promise<boolean> {
    if (!user.email) return false;
    
    try {
      const warningRepos = repositories.filter(repo => repo.status === 'warning');
      if (warningRepos.length === 0) return true;
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Vibe Coding" <noreply@vibecoding.example.com>',
        to: user.email,
        subject: "Vibe Coding - Activity Warning",
        text: this.generateWarningText(user, warningRepos),
        html: this.generateWarningHtml(user, warningRepos)
      });
      
      console.log(`Warning email sent to ${user.email}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send warning email to ${user.email}:`, error);
      return false;
    }
  }
  
  async sendInactivityAlert(user: User, repositories: Repository[]): Promise<boolean> {
    if (!user.email) return false;
    
    try {
      const inactiveRepos = repositories.filter(repo => repo.status === 'inactive');
      if (inactiveRepos.length === 0) return true;
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Vibe Coding" <noreply@vibecoding.example.com>',
        to: user.email,
        subject: "Vibe Coding - Inactivity Alert",
        text: this.generateAlertText(user, inactiveRepos),
        html: this.generateAlertHtml(user, inactiveRepos)
      });
      
      console.log(`Alert email sent to ${user.email}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Failed to send alert email to ${user.email}:`, error);
      return false;
    }
  }
  
  private generateWarningText(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `- ${repo.fullName}: Last commit ${this.formatDate(repo.lastCommitDate)}`
    ).join('\n');
    
    return `
      Hello ${user.name || user.username},
      
      This is a friendly reminder that some of your repositories are getting close to the 14-day inactivity limit:
      
      ${repoList}
      
      Please commit some code to keep your active status in the Vibe Coding community.
      
      If you're going on vacation, you can set vacation mode in your profile to pause these reminders.
      
      Happy coding!
      The Vibe Coding Team
    `;
  }
  
  private generateWarningHtml(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `<li><strong>${repo.fullName}</strong>: Last commit ${this.formatDate(repo.lastCommitDate)}</li>`
    ).join('');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Activity Warning</h2>
        <p>Hello ${user.name || user.username},</p>
        <p>This is a friendly reminder that some of your repositories are getting close to the 14-day inactivity limit:</p>
        
        <ul>${repoList}</ul>
        
        <p>Please commit some code to keep your active status in the Vibe Coding community.</p>
        <p>If you're going on vacation, you can set vacation mode in your profile to pause these reminders.</p>
        
        <p>Happy coding!<br>The Vibe Coding Team</p>
      </div>
    `;
  }
  
  private generateAlertText(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `- ${repo.fullName}: Last commit ${this.formatDate(repo.lastCommitDate)}`
    ).join('\n');
    
    return `
      Hello ${user.name || user.username},
      
      ALERT: The following repositories have not had any activity for over 14 days:
      
      ${repoList}
      
      Your status in the Vibe Coding community has been changed to INACTIVE.
      
      Please commit some code to regain your active status. If you need more time, you can set vacation mode in your profile.
      
      The Vibe Coding Team
    `;
  }
  
  private generateAlertHtml(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `<li><strong>${repo.fullName}</strong>: Last commit ${this.formatDate(repo.lastCommitDate)}</li>`
    ).join('');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Inactivity Alert</h2>
        <p>Hello ${user.name || user.username},</p>
        <p><strong>ALERT:</strong> The following repositories have not had any activity for over 14 days:</p>
        
        <ul>${repoList}</ul>
        
        <p>Your status in the Vibe Coding community has been changed to <span style="color: #EF4444; font-weight: bold;">INACTIVE</span>.</p>
        <p>Please commit some code to regain your active status. If you need more time, you can set vacation mode in your profile.</p>
        
        <p>The Vibe Coding Team</p>
      </div>
    `;
  }
  
  private formatDate(date: Date | null): string {
    if (!date) return 'unknown';
    
    // Format as "X days ago" or specific date if longer
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
}

// Telegram notification service
export class TelegramService implements NotificationService {
  private token: string;
  
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.token) {
      console.warn('Telegram bot token not provided. Telegram notifications will not work.');
    }
  }
  
  async sendInactivityWarning(user: User, repositories: Repository[]): Promise<boolean> {
    if (!user.telegramId || !this.token) return false;
    
    try {
      const warningRepos = repositories.filter(repo => repo.status === 'warning');
      if (warningRepos.length === 0) return true;
      
      const message = this.generateWarningMessage(user, warningRepos);
      const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: user.telegramId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }
      
      console.log(`Warning telegram sent to ${user.username} (${user.telegramId})`);
      return true;
    } catch (error) {
      console.error(`Failed to send telegram to ${user.username}:`, error);
      return false;
    }
  }
  
  async sendInactivityAlert(user: User, repositories: Repository[]): Promise<boolean> {
    if (!user.telegramId || !this.token) return false;
    
    try {
      const inactiveRepos = repositories.filter(repo => repo.status === 'inactive');
      if (inactiveRepos.length === 0) return true;
      
      const message = this.generateAlertMessage(user, inactiveRepos);
      const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: user.telegramId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }
      
      console.log(`Alert telegram sent to ${user.username} (${user.telegramId})`);
      return true;
    } catch (error) {
      console.error(`Failed to send telegram to ${user.username}:`, error);
      return false;
    }
  }
  
  private generateWarningMessage(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `• *${repo.fullName}*: Last commit ${this.formatDate(repo.lastCommitDate)}`
    ).join('\n');
    
    return `
⚠️ *Activity Warning*

Hello ${user.name || user.username},

This is a friendly reminder that some of your repositories are getting close to the 14-day inactivity limit:

${repoList}

Please commit some code to keep your active status in the Vibe Coding community.

If you're going on vacation, you can set vacation mode in your profile to pause these reminders.

Happy coding!
The Vibe Coding Team
    `;
  }
  
  private generateAlertMessage(user: User, repositories: Repository[]): string {
    const repoList = repositories.map(repo => 
      `• *${repo.fullName}*: Last commit ${this.formatDate(repo.lastCommitDate)}`
    ).join('\n');
    
    return `
🚨 *INACTIVITY ALERT*

Hello ${user.name || user.username},

ALERT: The following repositories have not had any activity for over 14 days:

${repoList}

Your status in the Vibe Coding community has been changed to *INACTIVE*.

Please commit some code to regain your active status. If you need more time, you can set vacation mode in your profile.

The Vibe Coding Team
    `;
  }
  
  private formatDate(date: Date | null): string {
    if (!date) return 'unknown';
    
    // Format as "X days ago" or specific date if longer
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }
}

// Factory to get the appropriate notification service
export function getNotificationService(user: User): NotificationService {
  if (user.notificationPreference === 'telegram' && user.telegramId) {
    return new TelegramService();
  }
  
  // Default to email
  return new EmailService();
}
