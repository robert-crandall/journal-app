import { TaskService } from './task.service';
import { JournalService } from './journal.service';

export class DashboardService {
  /**
   * Get dashboard data for a user
   */
  static async getDashboardData(userId: string) {
    // Get task statistics
    const taskStats = await TaskService.getTaskStats(userId);
    
    // Get upcoming/overdue tasks for dashboard
    const dashboardTasks = await TaskService.getDashboardTasks(userId);
    
    // Get recent journal entries
    const recentJournalEntries = await JournalService.getRecentJournalEntries(userId, 3);
    
    // Get journal statistics
    const journalStats = await JournalService.getJournalStats(userId);
    
    return {
      tasks: {
        stats: taskStats,
        upcoming: dashboardTasks.slice(0, 5), // Show only first 5 tasks
      },
      journal: {
        stats: journalStats,
        recent: recentJournalEntries,
      },
    };
  }

  /**
   * Get welcome message data
   */
  static getWelcomeMessage(firstName?: string) {
    const now = new Date();
    const hour = now.getHours();
    
    let greeting;
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    const name = firstName ? `, ${firstName}` : '';
    
    return `${greeting}${name}!`;
  }

  /**
   * Get current date formatted for display
   */
  static getCurrentDate() {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0], // YYYY-MM-DD
      formatted: now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      iso: now.toISOString(),
    };
  }
}
