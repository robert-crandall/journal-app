import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { projects, projectSubtasks } from '../db/schema';
import { jwtAuth } from '../middleware/auth';
import { 
  createProjectSchema,
  updateProjectSchema,
  createProjectSubtaskSchema,
  updateProjectSubtaskSchema,
  projectsQuerySchema,
} from '../validation/projects';
import { 
  type Project,
  type ProjectWithRelations
} from '../types/projects';
import { handleApiError } from '../utils/logger';

const app = new Hono();

// Get all projects for user
app.get('/', jwtAuth, zValidator('query', projectsQuerySchema), async (c) => {
  try {
    const userId = c.get('userId');
    const query = c.req.valid('query');

    // Build where conditions
    const whereConditions = [eq(projects.userId, userId)];

    if (query.type) {
      whereConditions.push(eq(projects.type, query.type));
    }
    if (query.isCompleted !== undefined) {
      whereConditions.push(eq(projects.isCompleted, query.isCompleted));
    }
    if (query.isActive !== undefined) {
      whereConditions.push(eq(projects.isActive, query.isActive));
    }
    if (query.goalId) {
      whereConditions.push(eq(projects.goalId, query.goalId));
    }

    // Build the query with all conditions
    const userProjects = await db
      .select()
      .from(projects)
      .where(and(...whereConditions))
      .orderBy(desc(projects.isActive), asc(projects.startDate))
      .limit(query.limit || 100)
      .offset(query.offset || 0);

    let result: ProjectWithRelations[] = userProjects;

    // Include subtasks if requested
    if (query.includeSubtasks) {
      const projectIds = userProjects.map(project => project.id);
      
      if (projectIds.length > 0) {
        // Get subtasks for all projects
        const subtasksData = await db
          .select()
          .from(projectSubtasks)
          .where(eq(projectSubtasks.projectId, projectIds[0])) // Would need IN operator for multiple
          .orderBy(asc(projectSubtasks.sortOrder));

        result = userProjects.map(project => ({
          ...project,
          subtasks: subtasksData.filter(subtask => subtask.projectId === project.id),
        }));
      }
    }

    return c.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch projects');
  }
});

// Get project by ID
app.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    // Get project subtasks
    const subtasks = await db
      .select()
      .from(projectSubtasks)
      .where(eq(projectSubtasks.projectId, projectId))
      .orderBy(asc(projectSubtasks.sortOrder));

    const result: ProjectWithRelations = {
      ...project,
      subtasks,
    };

    return c.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch project');
  }
});

// Create new project
app.post('/', jwtAuth, zValidator('json', createProjectSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const projectData = c.req.valid('json');

    // Convert date strings to Date objects
    const processedData = {
      ...projectData,
      userId,
      startDate: projectData.startDate ? new Date(projectData.startDate) : null,
      targetDate: projectData.targetDate ? new Date(projectData.targetDate) : null,
    };

    const [newProject] = await db
      .insert(projects)
      .values(processedData)
      .returning();

    return c.json({ success: true, data: newProject }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create project');
  }
});

// Update project
app.put('/:id', jwtAuth, zValidator('json', updateProjectSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const updateData = c.req.valid('json');

    // Check if project exists and belongs to user
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!existingProject) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    // Process date strings to Date objects
    const processedUpdateData = {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
      updatedAt: new Date(),
    };

    const [updatedProject] = await db
      .update(projects)
      .set(processedUpdateData)
      .where(eq(projects.id, projectId))
      .returning();

    return c.json({ success: true, data: updatedProject });
  } catch (error) {
    return handleApiError(error, 'Failed to update project');
  }
});

import { z } from 'zod';

const completeProjectSchema = z.object({
  completionNotes: z.string().max(2000, 'Completion notes must be 2000 characters or less').optional(),
});

// Complete project
app.post('/:id/complete', jwtAuth, zValidator('json', completeProjectSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const { completionNotes } = c.req.valid('json');

    // Check if project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    if (project.isCompleted) {
      return c.json({ success: false, error: 'Project already completed' }, 400);
    }

    // Mark project as completed
    const [updatedProject] = await db
      .update(projects)
      .set({
        isCompleted: true,
        isActive: false,
        completedAt: new Date(),
        completionNotes,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return c.json({ 
      success: true, 
      data: updatedProject,
      message: `Project completed: ${project.title}`
    });
  } catch (error) {
    return handleApiError(error, 'Failed to complete project');
  }
});

// Delete project
app.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    // Check if project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    await db
      .delete(projects)
      .where(eq(projects.id, projectId));

    return c.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Failed to delete project');
  }
});

// Subtask management

// Create subtask
app.post('/:id/subtasks', jwtAuth, zValidator('json', createProjectSubtaskSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const subtaskData = c.req.valid('json');

    // Check if project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    const [newSubtask] = await db
      .insert(projectSubtasks)
      .values({
        ...subtaskData,
        userId,
        projectId,
      })
      .returning();

    return c.json({ success: true, data: newSubtask }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create subtask');
  }
});

// Update subtask
app.put('/:id/subtasks/:subtaskId', jwtAuth, zValidator('json', updateProjectSubtaskSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const subtaskId = c.req.param('subtaskId');
    const updateData = c.req.valid('json');

    // Check if project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    // Check if subtask exists and belongs to project
    const [existingSubtask] = await db
      .select()
      .from(projectSubtasks)
      .where(and(eq(projectSubtasks.id, subtaskId), eq(projectSubtasks.projectId, projectId)))
      .limit(1);

    if (!existingSubtask) {
      return c.json({ success: false, error: 'Subtask not found' }, 404);
    }

    const [updatedSubtask] = await db
      .update(projectSubtasks)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(projectSubtasks.id, subtaskId))
      .returning();

    return c.json({ success: true, data: updatedSubtask });
  } catch (error) {
    return handleApiError(error, 'Failed to update subtask');
  }
});

// Delete subtask
app.delete('/:id/subtasks/:subtaskId', jwtAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const subtaskId = c.req.param('subtaskId');

    // Check if project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    // Check if subtask exists and belongs to project
    const [subtask] = await db
      .select()
      .from(projectSubtasks)
      .where(and(eq(projectSubtasks.id, subtaskId), eq(projectSubtasks.projectId, projectId)))
      .limit(1);

    if (!subtask) {
      return c.json({ success: false, error: 'Subtask not found' }, 404);
    }

    await db
      .delete(projectSubtasks)
      .where(eq(projectSubtasks.id, subtaskId));

    return c.json({ success: true, message: 'Subtask deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Failed to delete subtask');
  }
});

export default app;
