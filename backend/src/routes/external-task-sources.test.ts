import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import app from '../index'
import { db } from '../db/connection'
import { users, characters, characterStats, tasks, externalTaskSources, externalTaskIntegrations } from '../db/schema'
import { createTestUser } from '../utils/test-helpers'
import { eq } from 'drizzle-orm'

/**
 * Task 3.9: External Task Source Architecture Integration Tests
 * 
 * Tests the extensible task source architecture for future API integrations
 * such as calendar APIs, project management tools, fitness trackers, etc.
 */

describe('External Task Source Architecture - Task 3.9', () => {
  let testUserId: string
  let testCharacterId: string
  let cleanupTaskIds: string[] = []
  let cleanupSourceIds: string[] = []
  let cleanupIntegrationIds: string[] = []

  beforeAll(async () => {
    // Create test user
    const testUserData = await createTestUser({
      email: 'external-test@example.com',
      name: 'External Test User'
    })
    testUserId = testUserData.user.id

    // Create test character with stats
    const [character] = await db.insert(characters).values({
      userId: testUserId,
      name: 'Integration Tester',
      class: 'Productivity Wizard',
      backstory: 'A character focused on external tool integration'
    }).returning()
    testCharacterId = character.id

    // Create character stats
    const statCategories = ['Productivity', 'Health & Fitness', 'Project Management']
    for (const category of statCategories) {
      await db.insert(characterStats).values({
        characterId: testCharacterId,
        category,
        description: `${category} skill tracking`,
        currentXp: 100,
        totalXp: 100,
        currentLevel: 1
      })
    }
  })

  afterAll(async () => {
    // Cleanup in correct order
    if (cleanupTaskIds.length > 0) {
      await db.delete(tasks).where(eq(tasks.id, cleanupTaskIds[0]))
    }
    if (cleanupIntegrationIds.length > 0) {
      await db.delete(externalTaskIntegrations).where(eq(externalTaskIntegrations.id, cleanupIntegrationIds[0]))
    }
    if (cleanupSourceIds.length > 0) {
      await db.delete(externalTaskSources).where(eq(externalTaskSources.id, cleanupSourceIds[0]))
    }
    await db.delete(characterStats).where(eq(characterStats.characterId, testCharacterId))
    await db.delete(characters).where(eq(characters.id, testCharacterId))
    await db.delete(users).where(eq(users.id, testUserId))
  })

  beforeEach(() => {
    cleanupTaskIds = []
    cleanupSourceIds = []
    cleanupIntegrationIds = []
  })

  afterEach(async () => {
    // Cleanup after each test
    for (const taskId of cleanupTaskIds) {
      await db.delete(tasks).where(eq(tasks.id, taskId)).catch(() => {})
    }
    for (const integrationId of cleanupIntegrationIds) {
      await db.delete(externalTaskIntegrations).where(eq(externalTaskIntegrations.id, integrationId)).catch(() => {})
    }
    for (const sourceId of cleanupSourceIds) {
      await db.delete(externalTaskSources).where(eq(externalTaskSources.id, sourceId)).catch(() => {})
    }
  })

  describe('POST /api/external-sources - Register External Task Source', () => {
    it('should register a calendar API as external task source', async () => {
      const sourceData = {
        userId: testUserId,
        name: 'Google Calendar',
        type: 'calendar',
        apiEndpoint: 'https://www.googleapis.com/calendar/v3',
        authType: 'oauth2',
        config: {
          clientId: 'test-client-id',
          scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
          refreshToken: 'encrypted-refresh-token'
        },
        mappingRules: {
          titleField: 'summary',
          descriptionField: 'description',
          dueDateField: 'start.dateTime',
          defaultStats: ['Productivity'],
          estimatedXpFormula: 'duration * 2'
        },
        syncSchedule: '0 */6 * * *', // Every 6 hours
        isActive: true
      }

      const response = await app.request('/api/external-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.source.name).toBe('Google Calendar')
      expect(result.data.source.type).toBe('calendar')
      expect(result.data.source.isActive).toBe(true)
      expect(result.data.source.config.clientId).toBe('test-client-id')
      expect(result.data.source.mappingRules.titleField).toBe('summary')
      
      cleanupSourceIds.push(result.data.source.id)
    })

    it('should register a project management tool as external task source', async () => {
      const sourceData = {
        userId: testUserId,
        name: 'Asana',
        type: 'project_management',
        apiEndpoint: 'https://app.asana.com/api/1.0',
        authType: 'api_key',
        config: {
          apiKey: 'encrypted-api-key',
          workspaceId: 'test-workspace-123'
        },
        mappingRules: {
          titleField: 'name',
          descriptionField: 'notes',
          dueDateField: 'due_on',
          statusField: 'completed',
          defaultStats: ['Project Management'],
          estimatedXpFormula: 'priority === "high" ? 50 : 25',
          tags: ['work', 'projects']
        },
        syncSchedule: '0 */2 * * *', // Every 2 hours
        isActive: true
      }

      const response = await app.request('/api/external-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
      })

      expect(response.status).toBe(201)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.source.name).toBe('Asana')
      expect(result.data.source.type).toBe('project_management')
      expect(result.data.source.config.workspaceId).toBe('test-workspace-123')
      expect(result.data.source.mappingRules.estimatedXpFormula).toBeDefined()
      
      cleanupSourceIds.push(result.data.source.id)
    })

    it('should validate required fields for external source registration', async () => {
      const invalidData = {
        userId: testUserId,
        name: '', // Missing name
        type: 'invalid_type', // Invalid type
        apiEndpoint: 'not-a-url' // Invalid URL
      }

      const response = await app.request('/api/external-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.message || result.error).toBeDefined()
    })

    it('should reject registration for non-existent users', async () => {
      const sourceData = {
        userId: '123e4567-e89b-12d3-a456-426614174000', // Non-existent user
        name: 'Test Source',
        type: 'calendar',
        apiEndpoint: 'https://api.example.com',
        authType: 'oauth2',
        config: {},
        mappingRules: {},
        isActive: true
      }

      const response = await app.request('/api/external-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
      })

      expect(response.status).toBe(404)
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.message).toContain('User not found')
    })
  })

  describe('GET /api/external-sources - List External Task Sources', () => {
    let testSourceId: string

    beforeEach(async () => {
      // Create a test source
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Test Calendar',
        type: 'calendar',
        apiEndpoint: 'https://api.test.com',
        authType: 'oauth2',
        config: { clientId: 'test' },
        mappingRules: { titleField: 'summary' },
        isActive: true,
        syncSchedule: '0 */6 * * *'
      }).returning()
      testSourceId = source.id
      cleanupSourceIds.push(testSourceId)
    })

    it('should list all external task sources for user', async () => {
      const response = await app.request(`/api/external-sources?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.sources)).toBe(true)
      expect(result.data.sources.length).toBeGreaterThanOrEqual(1)
      
      const source = result.data.sources.find((s: any) => s.id === testSourceId)
      expect(source).toBeDefined()
      expect(source.name).toBe('Test Calendar')
      expect(source.type).toBe('calendar')
      expect(source.isActive).toBe(true)
    })

    it('should filter sources by type', async () => {
      const response = await app.request(`/api/external-sources?userId=${testUserId}&type=calendar`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.sources.every((s: any) => s.type === 'calendar')).toBe(true)
    })

    it('should filter sources by active status', async () => {
      const response = await app.request(`/api/external-sources?userId=${testUserId}&isActive=true`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.sources.every((s: any) => s.isActive === true)).toBe(true)
    })
  })

  describe('PUT /api/external-sources/:id - Update External Task Source', () => {
    let testSourceId: string

    beforeEach(async () => {
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Original Name',
        type: 'calendar',
        apiEndpoint: 'https://api.original.com',
        authType: 'oauth2',
        config: { clientId: 'original' },
        mappingRules: { titleField: 'summary' },
        isActive: true,
        syncSchedule: '0 */6 * * *'
      }).returning()
      testSourceId = source.id
      cleanupSourceIds.push(testSourceId)
    })

    it('should update external source configuration', async () => {
      const updateData = {
        userId: testUserId,
        name: 'Updated Calendar',
        config: { 
          clientId: 'updated-client-id',
          refreshToken: 'new-refresh-token'
        },
        mappingRules: {
          titleField: 'title',
          descriptionField: 'body',
          defaultStats: ['Productivity', 'Health & Fitness']
        },
        syncSchedule: '0 */4 * * *'
      }

      const response = await app.request(`/api/external-sources/${testSourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.source.name).toBe('Updated Calendar')
      expect(result.data.source.config.clientId).toBe('updated-client-id')
      expect(result.data.source.mappingRules.titleField).toBe('title')
      expect(result.data.source.syncSchedule).toBe('0 */4 * * *')
    })

    it('should toggle active status', async () => {
      const updateData = {
        userId: testUserId,
        isActive: false
      }

      const response = await app.request(`/api/external-sources/${testSourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.source.isActive).toBe(false)
    })
  })

  describe('POST /api/external-sources/:id/sync - Manual Sync External Source', () => {
    let testSourceId: string

    beforeEach(async () => {
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Sync Test Source',
        type: 'calendar',
        apiEndpoint: 'https://api.test.com',
        authType: 'oauth2',
        config: { clientId: 'test' },
        mappingRules: { 
          titleField: 'summary',
          dueDateField: 'start.dateTime',
          defaultStats: ['Productivity']
        },
        isActive: true,
        syncSchedule: '0 */6 * * *'
      }).returning()
      testSourceId = source.id
      cleanupSourceIds.push(testSourceId)
    })

    it('should trigger manual sync and create tasks from external source', async () => {
      // Mock external API response data
      const mockExternalTasks = [
        {
          id: 'ext-task-1',
          summary: 'Team Meeting',
          description: 'Weekly team sync',
          start: { dateTime: '2024-12-01T10:00:00Z' },
          status: 'confirmed'
        },
        {
          id: 'ext-task-2', 
          summary: 'Project Review',
          description: 'Review quarterly project status',
          start: { dateTime: '2024-12-02T14:00:00Z' },
          status: 'confirmed'
        }
      ]

      const syncData = {
        userId: testUserId,
        mockData: mockExternalTasks // For testing - in production would fetch from API
      }

      const response = await app.request(`/api/external-sources/${testSourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.syncResult.tasksCreated).toBe(2)
      expect(result.data.syncResult.tasksUpdated).toBe(0)
      expect(result.data.syncResult.errors).toBe(0)
      
      // Verify tasks were created in database
      expect(result.data.createdTasks.length).toBe(2)
      expect(result.data.createdTasks[0].title).toBe('Team Meeting')
      expect(result.data.createdTasks[0].source).toBe('external')
      expect(result.data.createdTasks[0].targetStats).toEqual(['Productivity'])
      
      cleanupTaskIds.push(...result.data.createdTasks.map((t: any) => t.id))
    })

    it('should handle duplicate external tasks correctly', async () => {
      // First sync
      const mockTasks = [
        {
          id: 'ext-task-duplicate',
          summary: 'Recurring Meeting',
          description: 'Daily standup',
          start: { dateTime: '2024-12-01T09:00:00Z' }
        }
      ]

      const firstSync = await app.request(`/api/external-sources/${testSourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, mockData: mockTasks })
      })

      expect(firstSync.status).toBe(200)
      const firstResult = await firstSync.json()
      expect(firstResult.data.syncResult.tasksCreated).toBe(1)
      
      cleanupTaskIds.push(firstResult.data.createdTasks[0].id)

      // Second sync with same task - should update, not duplicate
      const updatedMockTasks = [
        {
          id: 'ext-task-duplicate',
          summary: 'Recurring Meeting - Updated',
          description: 'Daily standup with new agenda',
          start: { dateTime: '2024-12-01T09:30:00Z' }
        }
      ]

      const secondSync = await app.request(`/api/external-sources/${testSourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, mockData: updatedMockTasks })
      })

      expect(secondSync.status).toBe(200)
      const secondResult = await secondSync.json()
      expect(secondResult.data.syncResult.tasksCreated).toBe(0)
      expect(secondResult.data.syncResult.tasksUpdated).toBe(1)
    })

    it('should apply mapping rules correctly', async () => {
      // Update source with custom mapping rules
      await db.update(externalTaskSources)
        .set({
          mappingRules: {
            titleField: 'title',
            descriptionField: 'notes',
            dueDateField: 'deadline',
            defaultStats: ['Project Management'],
            estimatedXpFormula: '30'
          }
        })
        .where(eq(externalTaskSources.id, testSourceId))

      const mockTasks = [
        {
          id: 'ext-task-mapping',
          title: 'Custom Title Field',
          notes: 'Custom description field',
          deadline: '2024-12-03T16:00:00Z',
          priority: 'high'
        }
      ]

      const response = await app.request(`/api/external-sources/${testSourceId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, mockData: mockTasks })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      
      const createdTask = result.data.createdTasks[0]
      expect(createdTask.title).toBe('Custom Title Field')
      expect(createdTask.description).toBe('Custom description field')
      expect(createdTask.targetStats).toEqual(['Project Management'])
      expect(createdTask.estimatedXp).toBe(30)
      
      cleanupTaskIds.push(createdTask.id)
    })
  })

  describe('GET /api/external-sources/:id/integrations - List Integrations', () => {
    let testSourceId: string
    let testIntegrationId: string

    beforeEach(async () => {
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Integration Test Source',
        type: 'project_management',
        apiEndpoint: 'https://api.test.com',
        authType: 'api_key',
        config: { apiKey: 'test' },
        mappingRules: { titleField: 'name' },
        isActive: true
      }).returning()
      testSourceId = source.id
      cleanupSourceIds.push(testSourceId)

      const [integration] = await db.insert(externalTaskIntegrations).values({
        sourceId: testSourceId,
        userId: testUserId,
        externalId: 'ext-123',
        taskId: null, // Will be set when task is created
        lastSyncAt: new Date(),
        status: 'active',
        metadata: { priority: 'high', tags: ['important'] }
      }).returning()
      testIntegrationId = integration.id
      cleanupIntegrationIds.push(testIntegrationId)
    })

    it('should list all integrations for external source', async () => {
      const response = await app.request(`/api/external-sources/${testSourceId}/integrations?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.integrations)).toBe(true)
      expect(result.data.integrations.length).toBeGreaterThanOrEqual(1)
      
      const integration = result.data.integrations[0]
      expect(integration.externalId).toBe('ext-123')
      expect(integration.status).toBe('active')
      expect(integration.metadata.priority).toBe('high')
    })

    it('should filter integrations by status', async () => {
      const response = await app.request(`/api/external-sources/${testSourceId}/integrations?userId=${testUserId}&status=active`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.integrations.every((i: any) => i.status === 'active')).toBe(true)
    })
  })

  describe('Dashboard Integration with External Tasks', () => {
    let testSourceId: string
    let externalTaskId: string

    beforeEach(async () => {
      // Create external source
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Dashboard Test Source',
        type: 'calendar',
        apiEndpoint: 'https://api.test.com',
        authType: 'oauth2',
        config: { clientId: 'test' },
        mappingRules: { 
          titleField: 'summary',
          defaultStats: ['Productivity']
        },
        isActive: true
      }).returning()
      testSourceId = source.id
      cleanupSourceIds.push(testSourceId)

      // Create external task
      const [task] = await db.insert(tasks).values({
        userId: testUserId,
        title: 'External Calendar Event',
        description: 'Synced from external calendar',
        source: 'external',
        sourceId: testSourceId,
        targetStats: ['Productivity'],
        estimatedXp: 25,
        status: 'pending',
        dueDate: new Date('2024-12-01T10:00:00Z')
      }).returning()
      externalTaskId = task.id
      cleanupTaskIds.push(externalTaskId)

      // Create integration record
      const [integration] = await db.insert(externalTaskIntegrations).values({
        sourceId: testSourceId,
        userId: testUserId,
        externalId: 'cal-event-123',
        taskId: externalTaskId,
        lastSyncAt: new Date(),
        status: 'active',
        metadata: { eventType: 'meeting' }
      }).returning()
      cleanupIntegrationIds.push(integration.id)
    })

    it('should include external tasks in dashboard aggregation', async () => {
      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      
      const externalTask = result.data.tasks.find((t: any) => t.source === 'external')
      expect(externalTask).toBeDefined()
      expect(externalTask.title).toBe('External Calendar Event')
      expect(externalTask.sourceMetadata).toBeDefined()
      expect(externalTask.sourceMetadata.type).toBe('external')
      expect(externalTask.sourceMetadata.sourceInfo.name).toBe('Dashboard Test Source')
      expect(externalTask.sourceMetadata.sourceInfo.type).toBe('calendar')
    })

    it('should differentiate external tasks from internal tasks', async () => {
      const response = await app.request(`/api/dashboard?userId=${testUserId}`, {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      
      const externalTask = result.data.tasks.find((t: any) => t.source === 'external')
      expect(externalTask.sourceMetadata.type).toBe('external')
      expect(externalTask.sourceMetadata.isExternal).toBe(true)
      expect(externalTask.sourceMetadata.canModify).toBe(false) // External tasks shouldn't be modifiable
    })
  })

  describe('External Source Type Support', () => {
    it('should support multiple external source types', async () => {
      const supportedTypes = ['calendar', 'project_management', 'fitness', 'notes', 'habits', 'time_tracking']
      
      for (const type of supportedTypes) {
        const sourceData = {
          userId: testUserId,
          name: `Test ${type} Source`,
          type,
          apiEndpoint: `https://api.${type}.com`,
          authType: 'api_key',
          config: { apiKey: 'test' },
          mappingRules: { titleField: 'name' },
          isActive: true
        }

        const response = await app.request('/api/external-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sourceData)
        })

        expect(response.status).toBe(201)
        const result = await response.json()
        expect(result.success).toBe(true)
        expect(result.data.source.type).toBe(type)
        
        cleanupSourceIds.push(result.data.source.id)
      }
    })

    it('should provide type-specific configuration templates', async () => {
      const response = await app.request('/api/external-sources/templates', {
        method: 'GET'
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.templates).toBeDefined()
      
      // Check that we have templates for common types
      const templates = result.data.templates
      expect(templates.calendar).toBeDefined()
      expect(templates.project_management).toBeDefined()
      expect(templates.fitness).toBeDefined()
      
      // Validate template structure
      expect(templates.calendar.authTypes).toContain('oauth2')
      expect(templates.calendar.mappingFields).toContain('titleField')
      expect(templates.calendar.defaultMappingRules).toBeDefined()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication failures gracefully', async () => {
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Auth Fail Source',
        type: 'calendar',
        apiEndpoint: 'https://api.test.com',
        authType: 'oauth2',
        config: { clientId: 'expired-token' },
        mappingRules: { titleField: 'summary' },
        isActive: true
      }).returning()
      cleanupSourceIds.push(source.id)

      const syncData = {
        userId: testUserId,
        simulateAuthFailure: true
      }

      const response = await app.request(`/api/external-sources/${source.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      })

      expect(response.status).toBe(200) // Should not fail, but report error
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.syncResult.errors).toBe(1)
      expect(result.data.syncResult.errorDetails).toContain('Authentication failed: Token expired')
    })

    it('should handle malformed external data gracefully', async () => {
      const [source] = await db.insert(externalTaskSources).values({
        userId: testUserId,
        name: 'Malformed Data Source',
        type: 'project_management',
        apiEndpoint: 'https://api.test.com',
        authType: 'api_key',
        config: { apiKey: 'test' },
        mappingRules: { titleField: 'name' },
        isActive: true
      }).returning()
      cleanupSourceIds.push(source.id)

      const malformedData = [
        { /* missing required fields */ },
        { name: null, description: undefined },
        { id: 'valid-task-id', name: 'Valid Task', unexpectedField: 'should be ignored' }
      ]

      const response = await app.request(`/api/external-sources/${source.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, mockData: malformedData })
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.syncResult.tasksCreated).toBe(1) // Only valid task created
      expect(result.data.syncResult.errors).toBe(2) // Two malformed items
      
      if (result.data.createdTasks.length > 0) {
        cleanupTaskIds.push(result.data.createdTasks[0].id)
      }
    })
  })
})
