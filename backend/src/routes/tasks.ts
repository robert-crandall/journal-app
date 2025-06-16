import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../lib/middleware';
import { TaskService } from '../services/task.service';
import { createTaskSchema, updateTaskSchema } from '../lib/validation';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Create a new task
app.post('/', zValidator('json', createTaskSchema), async (c) => {
  try {
    const user = c.get('user');
    const input = c.req.valid('json');

    const task = await TaskService.createTask(user.userId, input);

    return c.json({
      success: true,
      data: task,
    }, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({
      success: false,
      error: 'Failed to create task',
    }, 500);
  }
});

// Get all tasks for the current user
app.get('/', async (c) => {
  try {
    const user = c.get('user');
    const includeCompleted = c.req.query('includeCompleted') === 'true';
    const sortBy = c.req.query('sortBy') as 'dueDate' | 'createdAt' || 'createdAt';
    const sortOrder = c.req.query('sortOrder') as 'asc' | 'desc' || 'desc';

    const tasks = await TaskService.getUserTasks(user.userId, {
      includeCompleted,
      sortBy,
      sortOrder,
    });

    return c.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json({
      success: false,
      error: 'Failed to get tasks',
    }, 500);
  }
});

// Get task statistics
app.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    const stats = await TaskService.getTaskStats(user.userId);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to get task statistics',
    }, 500);
  }
});

// Get a specific task by ID
app.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    const task = await TaskService.getTaskById(taskId, user.userId);

    if (!task) {
      return c.json({
        success: false,
        error: 'Task not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return c.json({
      success: false,
      error: 'Failed to get task',
    }, 500);
  }
});

// Update a task
app.put('/:id', zValidator('json', updateTaskSchema), async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');
    const input = c.req.valid('json');

    const task = await TaskService.updateTask(taskId, user.userId, input);

    if (!task) {
      return c.json({
        success: false,
        error: 'Task not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({
      success: false,
      error: 'Failed to update task',
    }, 500);
  }
});

// Toggle task completion
app.patch('/:id/toggle', async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    const task = await TaskService.toggleTaskComplete(taskId, user.userId);

    if (!task) {
      return c.json({
        success: false,
        error: 'Task not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    return c.json({
      success: false,
      error: 'Failed to toggle task',
    }, 500);
  }
});

// Delete a task
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('id');

    const task = await TaskService.deleteTask(taskId, user.userId);

    if (!task) {
      return c.json({
        success: false,
        error: 'Task not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete task',
    }, 500);
  }
});

export default app;
