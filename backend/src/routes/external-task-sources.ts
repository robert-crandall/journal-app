import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/connection'
import { externalTaskSources, externalTaskIntegrations, tasks, users } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Task 3.9: External Task Sources API
 * 
 * Extensible task source architecture for future API integrations
 * Supports calendar APIs, project management tools, fitness trackers, etc.
 */

const app = new Hono()

// Validation schemas
const externalSourceTypeSchema = z.enum([
  'calendar',
  'project_management', 
  'fitness',
  'notes',
  'habits',
  'time_tracking'
])

const authTypeSchema = z.enum([
  'oauth2',
  'api_key',
  'basic_auth'
])

const createExternalSourceSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: externalSourceTypeSchema,
  apiEndpoint: z.string().url(),
  authType: authTypeSchema,
  config: z.record(z.any()), // Flexible config object
  mappingRules: z.record(z.any()), // Flexible mapping rules object
  syncSchedule: z.string().optional(), // Cron expression
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
})

const updateExternalSourceSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.any()).optional(),
  mappingRules: z.record(z.any()).optional(),
  syncSchedule: z.string().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const syncExternalSourceSchema = z.object({
  userId: z.string().uuid(),
  mockData: z.array(z.record(z.any())).optional(), // For testing
  simulateAuthFailure: z.boolean().optional()
})

// POST /api/external-sources - Register external task source
app.post('/', zValidator('json', createExternalSourceSchema), async (c) => {
  const data = c.req.valid('json')

  try {
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, data.userId))
    if (!user) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }

    // Create external source
    const [source] = await db.insert(externalTaskSources).values({
      userId: data.userId,
      name: data.name,
      type: data.type,
      apiEndpoint: data.apiEndpoint,
      authType: data.authType,
      config: data.config,
      mappingRules: data.mappingRules,
      syncSchedule: data.syncSchedule,
      isActive: data.isActive,
      metadata: data.metadata || {}
    }).returning()

    return c.json({
      success: true,
      data: { source }
    }, 201)

  } catch (error) {
    console.error('Error creating external source:', error)
    return c.json({
      success: false,
      message: 'Failed to create external source'
    }, 500)
  }
})

// GET /api/external-sources - List external task sources
app.get('/', async (c) => {
  const userId = c.req.query('userId')
  const type = c.req.query('type')
  const isActive = c.req.query('isActive')

  if (!userId) {
    return c.json({
      success: false,
      message: 'userId query parameter is required'
    }, 400)
  }

  try {
    let query = db.select().from(externalTaskSources).where(eq(externalTaskSources.userId, userId))

    // Apply filters
    const conditions = [eq(externalTaskSources.userId, userId)]
    
    if (type) {
      conditions.push(eq(externalTaskSources.type, type))
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(externalTaskSources.isActive, isActive === 'true'))
    }

    const sources = await db.select()
      .from(externalTaskSources)
      .where(and(...conditions))
      .orderBy(desc(externalTaskSources.createdAt))

    return c.json({
      success: true,
      data: { sources }
    })

  } catch (error) {
    console.error('Error fetching external sources:', error)
    return c.json({
      success: false,
      message: 'Failed to fetch external sources'
    }, 500)
  }
})

// PUT /api/external-sources/:id - Update external task source
app.put('/:id', zValidator('json', updateExternalSourceSchema), async (c) => {
  const sourceId = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify source exists and belongs to user
    const [existingSource] = await db.select()
      .from(externalTaskSources)
      .where(and(
        eq(externalTaskSources.id, sourceId),
        eq(externalTaskSources.userId, data.userId)
      ))

    if (!existingSource) {
      return c.json({
        success: false,
        message: 'External source not found'
      }, 404)
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.config !== undefined) updateData.config = data.config
    if (data.mappingRules !== undefined) updateData.mappingRules = data.mappingRules
    if (data.syncSchedule !== undefined) updateData.syncSchedule = data.syncSchedule
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.metadata !== undefined) updateData.metadata = data.metadata
    
    updateData.updatedAt = new Date()

    const [updatedSource] = await db.update(externalTaskSources)
      .set(updateData)
      .where(eq(externalTaskSources.id, sourceId))
      .returning()

    return c.json({
      success: true,
      data: { source: updatedSource }
    })

  } catch (error) {
    console.error('Error updating external source:', error)
    return c.json({
      success: false,
      message: 'Failed to update external source'
    }, 500)
  }
})

// POST /api/external-sources/:id/sync - Manual sync external source
app.post('/:id/sync', zValidator('json', syncExternalSourceSchema), async (c) => {
  const sourceId = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify source exists and belongs to user
    const [source] = await db.select()
      .from(externalTaskSources)
      .where(and(
        eq(externalTaskSources.id, sourceId),
        eq(externalTaskSources.userId, data.userId)
      ))

    if (!source) {
      return c.json({
        success: false,
        message: 'External source not found'
      }, 404)
    }

    if (!source.isActive) {
      return c.json({
        success: false,
        message: 'External source is not active'
      }, 400)
    }

    // Simulate authentication failure for testing
    if (data.simulateAuthFailure) {
      await db.update(externalTaskSources)
        .set({
          lastError: 'Authentication failed: Token expired',
          errorCount: (source.errorCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(externalTaskSources.id, sourceId))

      return c.json({
        success: true,
        data: {
          syncResult: {
            tasksCreated: 0,
            tasksUpdated: 0,
            errors: 1,
            errorDetails: ['Authentication failed: Token expired']
          },
          createdTasks: []
        }
      })
    }

    // In a real implementation, this would fetch from the external API
    // For testing, we use mock data
    const externalTasks = data.mockData || []
    
    let tasksCreated = 0
    let tasksUpdated = 0
    let errors = 0
    const errorDetails: string[] = []
    const createdTasks: any[] = []

    for (const externalTask of externalTasks) {
      try {
        // Validate required fields based on mapping rules
        const mappingRules = source.mappingRules as Record<string, any> || {}
        const titleField = mappingRules.titleField || 'title'
        const title = externalTask[titleField]
        
        if (!title) {
          errors++
          errorDetails.push(`Missing title field: ${titleField}`)
          continue
        }

        // Check if this external task already exists
        const externalId = externalTask.id
        if (!externalId) {
          errors++
          errorDetails.push('Missing external ID')
          continue
        }

        const [existingIntegration] = await db.select()
          .from(externalTaskIntegrations)
          .where(and(
            eq(externalTaskIntegrations.sourceId, sourceId),
            eq(externalTaskIntegrations.externalId, externalId)
          ))

        if (existingIntegration && existingIntegration.taskId) {
          // Update existing task
          const descriptionField = mappingRules.descriptionField || 'description'
          const dueDateField = mappingRules.dueDateField || 'dueDate'
          
          const updateData: any = {
            title: title,
            updatedAt: new Date()
          }
          
          if (externalTask[descriptionField]) {
            updateData.description = externalTask[descriptionField]
          }
          
          if (externalTask[dueDateField]) {
            updateData.dueDate = new Date(externalTask[dueDateField])
          }

          await db.update(tasks)
            .set(updateData)
            .where(eq(tasks.id, existingIntegration.taskId))

          // Update integration record
          await db.update(externalTaskIntegrations)
            .set({
              lastSyncAt: new Date(),
              status: 'active',
              updatedAt: new Date()
            })
            .where(eq(externalTaskIntegrations.id, existingIntegration.id))

          tasksUpdated++
        } else {
          // Create new task
          const descriptionField = mappingRules.descriptionField || 'description'
          const dueDateField = mappingRules.dueDateField || 'dueDate'
          const defaultStats = mappingRules.defaultStats || ['Productivity']
          const estimatedXpFormula = mappingRules.estimatedXpFormula
          
          let estimatedXp = 25 // Default XP
          if (estimatedXpFormula) {
            try {
              // Simple formula evaluation - in production would use safer evaluator
              if (typeof estimatedXpFormula === 'string' && !isNaN(Number(estimatedXpFormula))) {
                estimatedXp = Number(estimatedXpFormula)
              }
            } catch (e) {
              // Use default if formula fails
            }
          }

          const [newTask] = await db.insert(tasks).values({
            userId: data.userId,
            title: title,
            description: externalTask[descriptionField] || '',
            source: 'external',
            sourceId: sourceId,
            targetStats: defaultStats,
            estimatedXp: estimatedXp,
            status: 'pending',
            dueDate: externalTask[dueDateField] ? new Date(externalTask[dueDateField]) : null
          }).returning()

          // Create integration record
          const [integration] = await db.insert(externalTaskIntegrations).values({
            sourceId: sourceId,
            userId: data.userId,
            externalId: externalId,
            taskId: newTask.id,
            lastSyncAt: new Date(),
            status: 'active',
            metadata: {
              originalData: externalTask
            }
          }).returning()

          createdTasks.push(newTask)
          tasksCreated++
        }
      } catch (error) {
        errors++
        errorDetails.push(`Error processing task: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update source sync status
    await db.update(externalTaskSources)
      .set({
        lastSyncAt: new Date(),
        errorCount: errors > 0 ? (source.errorCount || 0) + errors : 0,
        lastError: errors > 0 ? errorDetails.join('; ') : null,
        updatedAt: new Date()
      })
      .where(eq(externalTaskSources.id, sourceId))

    return c.json({
      success: true,
      data: {
        syncResult: {
          tasksCreated,
          tasksUpdated,
          errors,
          errorDetails
        },
        createdTasks
      }
    })

  } catch (error) {
    console.error('Error syncing external source:', error)
    return c.json({
      success: false,
      message: 'Failed to sync external source'
    }, 500)
  }
})

// GET /api/external-sources/:id/integrations - List integrations for source
app.get('/:id/integrations', async (c) => {
  const sourceId = c.req.param('id')
  const userId = c.req.query('userId')
  const status = c.req.query('status')

  if (!userId) {
    return c.json({
      success: false,
      message: 'userId query parameter is required'
    }, 400)
  }

  try {
    // Verify source exists and belongs to user
    const [source] = await db.select()
      .from(externalTaskSources)
      .where(and(
        eq(externalTaskSources.id, sourceId),
        eq(externalTaskSources.userId, userId)
      ))

    if (!source) {
      return c.json({
        success: false,
        message: 'External source not found'
      }, 404)
    }

    const conditions = [eq(externalTaskIntegrations.sourceId, sourceId)]
    
    if (status) {
      conditions.push(eq(externalTaskIntegrations.status, status))
    }

    const integrations = await db.select()
      .from(externalTaskIntegrations)
      .where(and(...conditions))
      .orderBy(desc(externalTaskIntegrations.lastSyncAt))

    return c.json({
      success: true,
      data: { integrations }
    })

  } catch (error) {
    console.error('Error fetching integrations:', error)
    return c.json({
      success: false,
      message: 'Failed to fetch integrations'
    }, 500)
  }
})

// GET /api/external-sources/templates - Get configuration templates for different source types
app.get('/templates', async (c) => {
  const templates = {
    calendar: {
      authTypes: ['oauth2'],
      mappingFields: ['titleField', 'descriptionField', 'dueDateField'],
      defaultMappingRules: {
        titleField: 'summary',
        descriptionField: 'description',
        dueDateField: 'start.dateTime',
        defaultStats: ['Productivity'],
        estimatedXpFormula: '25'
      },
      configFields: ['clientId', 'clientSecret', 'refreshToken'],
      supportedEndpoints: [
        'https://www.googleapis.com/calendar/v3',
        'https://outlook.office.com/api/v2.0',
        'https://api.calendly.com/v1'
      ]
    },
    project_management: {
      authTypes: ['oauth2', 'api_key'],
      mappingFields: ['titleField', 'descriptionField', 'dueDateField', 'statusField', 'priorityField'],
      defaultMappingRules: {
        titleField: 'name',
        descriptionField: 'notes',
        dueDateField: 'due_on',
        statusField: 'completed',
        defaultStats: ['Project Management'],
        estimatedXpFormula: '30'
      },
      configFields: ['apiKey', 'workspaceId', 'projectId'],
      supportedEndpoints: [
        'https://app.asana.com/api/1.0',
        'https://api.trello.com/1',
        'https://api.monday.com/v2'
      ]
    },
    fitness: {
      authTypes: ['oauth2', 'api_key'],
      mappingFields: ['titleField', 'descriptionField', 'dateField', 'metricsField'],
      defaultMappingRules: {
        titleField: 'activity_name',
        descriptionField: 'description',
        dueDateField: 'date',
        defaultStats: ['Health & Fitness'],
        estimatedXpFormula: 'duration * 2'
      },
      configFields: ['accessToken', 'userId'],
      supportedEndpoints: [
        'https://api.fitbit.com/1',
        'https://api.strava.com/v3',
        'https://api.myfitnesspal.com/v1'
      ]
    },
    notes: {
      authTypes: ['oauth2', 'api_key'],
      mappingFields: ['titleField', 'contentField', 'dateField', 'tagsField'],
      defaultMappingRules: {
        titleField: 'title',
        descriptionField: 'content',
        dueDateField: 'updated_at',
        defaultStats: ['Learning'],
        estimatedXpFormula: '15'
      },
      configFields: ['apiKey', 'notebookId'],
      supportedEndpoints: [
        'https://api.notion.com/v1',
        'https://api.evernote.com/v1',
        'https://api.obsidian.md/v1'
      ]
    },
    habits: {
      authTypes: ['api_key', 'basic_auth'],
      mappingFields: ['titleField', 'statusField', 'streakField', 'dateField'],
      defaultMappingRules: {
        titleField: 'name',
        descriptionField: 'description',
        dueDateField: 'date',
        defaultStats: ['Self Development'],
        estimatedXpFormula: 'streak_count * 5'
      },
      configFields: ['apiKey', 'userId'],
      supportedEndpoints: [
        'https://habitica.com/api/v3',
        'https://api.habitify.me/v1',
        'https://api.streaks.app/v1'
      ]
    },
    time_tracking: {
      authTypes: ['oauth2', 'api_key'],
      mappingFields: ['titleField', 'projectField', 'durationField', 'dateField'],
      defaultMappingRules: {
        titleField: 'description',
        descriptionField: 'project',
        dueDateField: 'date',
        defaultStats: ['Productivity'],
        estimatedXpFormula: 'Math.floor(duration / 60) * 3'
      },
      configFields: ['apiKey', 'workspaceId'],
      supportedEndpoints: [
        'https://api.toggl.com/api/v9',
        'https://api.clockify.me/api/v1',
        'https://api.rescuetime.com/anapi'
      ]
    }
  }

  return c.json({
    success: true,
    data: { templates }
  })
})

export default app
