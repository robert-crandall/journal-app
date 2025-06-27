import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/connection'
import { familyMembers, familyMemberInteractions, users } from '../db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

const familyMembersApp = new Hono()

// Validation schemas
const createFamilyMemberSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  age: z.number().int().min(0).max(150).optional(),
  interests: z.array(z.string()).optional(),
  interactionFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).default('weekly')
})

const updateFamilyMemberSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  age: z.number().int().min(0).max(150).optional(),
  interests: z.array(z.string()).optional(),
  interactionFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  lastInteraction: z.string().optional() // ISO date string
})

const familyMemberParamsSchema = z.object({
  id: z.string().uuid()
})

const userIdQuerySchema = z.object({
  userId: z.string().uuid()
})

// Helper function to validate user exists
async function validateUser(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  return user
}

// Helper function to validate family member ownership
async function validateFamilyMemberOwnership(familyMemberId: string, userId: string) {
  const [familyMember] = await db
    .select()
    .from(familyMembers)
    .where(and(
      eq(familyMembers.id, familyMemberId),
      eq(familyMembers.userId, userId)
    ))
    .limit(1)

  if (!familyMember) {
    throw new HTTPException(404, { message: 'Family member not found' })
  }
  return familyMember
}

// POST /api/family-members - Create Family Member
familyMembersApp.post('/', zValidator('json', createFamilyMemberSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    
    // Validate user exists
    await validateUser(data.userId)

    // Create family member
    const [familyMember] = await db
      .insert(familyMembers)
      .values({
        userId: data.userId,
        name: data.name,
        age: data.age,
        interests: data.interests || [],
        interactionFrequency: data.interactionFrequency
      })
      .returning()

    return c.json({
      success: true,
      data: familyMember
    }, 201)

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Error creating family member:', error)
    throw new HTTPException(500, { message: 'Failed to create family member' })
  }
})

// GET /api/family-members - List Family Members
familyMembersApp.get('/', zValidator('query', userIdQuerySchema), async (c) => {
  try {
    const { userId } = c.req.valid('query')
    
    // Validate user exists
    await validateUser(userId)

    // Get all family members for user
    const userFamilyMembers = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .orderBy(familyMembers.name)

    // Calculate interaction statistics for each family member
    const familyMembersWithStats = await Promise.all(
      userFamilyMembers.map(async (member) => {
        // Get recent interaction count
        const [{ interactionCount }] = await db
          .select({ interactionCount: count() })
          .from(familyMemberInteractions)
          .where(eq(familyMemberInteractions.familyMemberId, member.id))

        // Calculate days since last interaction
        let daysSinceLastInteraction: number | null = null
        if (member.lastInteraction) {
          const lastInteractionDate = new Date(member.lastInteraction)
          const today = new Date()
          daysSinceLastInteraction = Math.floor((today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Determine if interaction is overdue based on frequency
        let isOverdue = false
        if (daysSinceLastInteraction !== null) {
          const frequencyDays = {
            daily: 1,
            weekly: 7,
            biweekly: 14,
            monthly: 30
          }
          const maxDays = frequencyDays[member.interactionFrequency as keyof typeof frequencyDays]
          isOverdue = daysSinceLastInteraction > maxDays
        }

        return {
          ...member,
          recentInteractions: interactionCount,
          daysSinceLastInteraction,
          isOverdue
        }
      })
    )

    return c.json({
      success: true,
      data: {
        familyMembers: familyMembersWithStats,
        totalMembers: familyMembersWithStats.length,
        overdueInteractions: familyMembersWithStats.filter(m => m.isOverdue).length
      }
    })

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('Error fetching family members:', error)
    throw new HTTPException(500, { message: 'Failed to fetch family members' })
  }
})

// GET /api/family-members/interaction-alerts - Get Interaction Alerts
familyMembersApp.get('/interaction-alerts',
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('query')
      
      // Validate user exists
      await validateUser(userId)

      // Get all family members for user
      const userFamilyMembers = await db
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.userId, userId))

      // Calculate overdue interactions
      const today = new Date()
      const alerts = []

      for (const member of userFamilyMembers) {
        if (!member.lastInteraction) {
          // Never interacted - urgent
          alerts.push({
            familyMember: member,
            alertType: 'never_interacted',
            severity: 'high',
            message: `You haven't recorded any interactions with ${member.name} yet`
          })
          continue
        }

        const lastInteractionDate = new Date(member.lastInteraction)
        const daysSince = Math.floor((today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        const frequencyDays = {
          daily: 1,
          weekly: 7,
          biweekly: 14,
          monthly: 30
        }
        
        const expectedDays = frequencyDays[member.interactionFrequency as keyof typeof frequencyDays]
        
        if (daysSince > expectedDays) {
          const severity = daysSince > expectedDays * 2 ? 'high' : 'medium'
          alerts.push({
            familyMember: member,
            alertType: 'overdue',
            severity,
            daysSince,
            expectedFrequency: member.interactionFrequency,
            message: `It's been ${daysSince} days since your last interaction with ${member.name} (expected: every ${expectedDays} days)`
          })
        }
      }

      // Sort by severity (high first, then by days since)
      alerts.sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1
        if (b.severity === 'high' && a.severity !== 'high') return 1
        return (b.daysSince || 999) - (a.daysSince || 999)
      })

      return c.json({
        success: true,
        data: {
          alerts,
          totalAlerts: alerts.length,
          highPriorityAlerts: alerts.filter(a => a.severity === 'high').length
        }
      })

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Error fetching interaction alerts:', error)
      throw new HTTPException(500, { message: 'Failed to fetch interaction alerts' })
    }
  }
)

// GET /api/family-members/:id - Get Family Member Details
familyMembersApp.get('/:id', 
  zValidator('param', familyMemberParamsSchema),
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const { userId } = c.req.valid('query')
      
      // Validate ownership
      const familyMember = await validateFamilyMemberOwnership(id, userId)

      // Get recent interactions with details
      const recentInteractions = await db
        .select()
        .from(familyMemberInteractions)
        .where(eq(familyMemberInteractions.familyMemberId, id))
        .orderBy(desc(familyMemberInteractions.interactionDate))
        .limit(10)

      // Calculate interaction statistics
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
      
      const interactionStats = {
        total: recentInteractions.length,
        last30Days: recentInteractions.filter(i => new Date(i.interactionDate) >= thirtyDaysAgo).length,
        averageFrequency: recentInteractions.length > 1 ? 
          Math.round(30 / recentInteractions.length * 10) / 10 : 0 // days between interactions
      }

      return c.json({
        success: true,
        data: {
          familyMember,
          recentInteractions,
          interactionStats
        }
      })

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Error fetching family member details:', error)
      throw new HTTPException(500, { message: 'Failed to fetch family member details' })
    }
  }
)

// PUT /api/family-members/:id - Update Family Member
familyMembersApp.put('/:id',
  zValidator('param', familyMemberParamsSchema),
  zValidator('json', updateFamilyMemberSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const data = c.req.valid('json')
      
      // Validate ownership
      await validateFamilyMemberOwnership(id, data.userId)

      // Prepare update data
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.age !== undefined) updateData.age = data.age
      if (data.interests !== undefined) updateData.interests = data.interests
      if (data.interactionFrequency !== undefined) updateData.interactionFrequency = data.interactionFrequency
      if (data.lastInteraction !== undefined) updateData.lastInteraction = data.lastInteraction

      // Always update the timestamp
      updateData.updatedAt = new Date()

      // Update family member
      const [updatedFamilyMember] = await db
        .update(familyMembers)
        .set(updateData)
        .where(eq(familyMembers.id, id))
        .returning()

      return c.json({
        success: true,
        data: updatedFamilyMember
      })

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Error updating family member:', error)
      throw new HTTPException(500, { message: 'Failed to update family member' })
    }
  }
)

// DELETE /api/family-members/:id - Delete Family Member
familyMembersApp.delete('/:id',
  zValidator('param', familyMemberParamsSchema),
  zValidator('query', userIdQuerySchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const { userId } = c.req.valid('query')
      
      // Validate ownership
      await validateFamilyMemberOwnership(id, userId)

      // Delete family member (cascade will handle interactions)
      await db
        .delete(familyMembers)
        .where(eq(familyMembers.id, id))

      return c.json({
        success: true,
        message: 'Family member deleted successfully'
      })

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Error deleting family member:', error)
      throw new HTTPException(500, { message: 'Failed to delete family member' })
    }
  }
)


// POST /api/family-members/:id/interactions - Record Interaction
familyMembersApp.post('/:id/interactions',
  zValidator('param', familyMemberParamsSchema),
  zValidator('json', z.object({
    userId: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    feedback: z.string().optional(),
    interactionDate: z.string().optional() // ISO date string, defaults to today
  })),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const data = c.req.valid('json')
      
      // Validate ownership
      const familyMember = await validateFamilyMemberOwnership(id, data.userId)

      // Use provided date or today
      const interactionDate = data.interactionDate ? new Date(data.interactionDate) : new Date()
      
      // Create interaction record
      const [interaction] = await db
        .insert(familyMemberInteractions)
        .values({
          taskId: data.taskId || null, // Allow null for manual interactions
          familyMemberId: id,
          feedback: data.feedback,
          interactionDate: interactionDate.toISOString().split('T')[0] // Date only
        })
        .returning()

      // Update last interaction date on family member
      await db
        .update(familyMembers)
        .set({
          lastInteraction: interactionDate.toISOString().split('T')[0],
          updatedAt: new Date()
        })
        .where(eq(familyMembers.id, id))

      return c.json({
        success: true,
        data: interaction
      }, 201)

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      console.error('Error recording family interaction:', error)
      throw new HTTPException(500, { message: 'Failed to record family interaction' })
    }
  }
)

export default familyMembersApp
