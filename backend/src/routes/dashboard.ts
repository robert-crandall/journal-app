import { Hono } from 'hono';
import { authMiddleware } from '../lib/middleware';
import { DashboardService } from '../services/dashboard.service';
import { UserService } from '../services/user.service';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Get dashboard data
app.get('/', async (c) => {
  try {
    const user = c.get('user');

    // Get user profile for welcome message
    const userService = new UserService();
    const userProfile = await userService.getUserById(user.userId);
    
    // Get dashboard data
    const dashboardData = await DashboardService.getDashboardData(user.userId);
    
    // Get current date and welcome message
    const currentDate = DashboardService.getCurrentDate();
    const welcomeMessage = DashboardService.getWelcomeMessage(userProfile?.firstName || undefined);

    return c.json({
      success: true,
      data: {
        user: {
          id: userProfile?.id,
          firstName: userProfile?.firstName,
          lastName: userProfile?.lastName,
          email: userProfile?.email,
        },
        welcome: {
          message: welcomeMessage,
          date: currentDate,
        },
        ...dashboardData,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return c.json({
      success: false,
      error: 'Failed to get dashboard data',
    }, 500);
  }
});

export default app;
