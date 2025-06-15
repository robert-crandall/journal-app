import { Context } from 'hono';
import { db } from '../db';
import { 
  journalEntries, journalEntryTags, tags, journalEntryFamilyMembers, familyMembers,
  journalEntryCharacterStats, characterStats
} from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { JournalEntryInput, JournalAnalysisInput, ApiResponse, JournalEntry, JournalAnalysisResult, Tag, FamilyMember, CharacterStat } from '../types/api';
import { generateChatCompletion } from '../utils/openaiUtils';

// Get all journal entries for the current user
export async function getJournalEntries(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    
    const results = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, currentUser.id))
      .orderBy(desc(journalEntries.date));
    
    const response: ApiResponse<{ entries: JournalEntry[] }> = {
      success: true,
      data: {
        entries: results.map((entry: any) => ({
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
      },
    };
    
    return c.json(response);
  } catch (error) {
    console.error('Get journal entries error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve journal entries' });
  }
}

// Get a specific journal entry by ID with related data
export async function getJournalEntryById(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const entryId = c.req.param('id');
    
    // Get the journal entry
    const entryResult = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (entryResult.length === 0) {
      throw new HTTPException(404, { message: 'Journal entry not found' });
    }

    // Get tags related to this entry
    const entryTags = await db
      .select({
        tag: tags,
      })
      .from(journalEntryTags)
      .innerJoin(tags, eq(journalEntryTags.tagId, tags.id))
      .where(eq(journalEntryTags.journalEntryId, entryId));

    // Get family members related to this entry
    const entryFamilyMembers = await db
      .select({
        familyMember: familyMembers,
      })
      .from(journalEntryFamilyMembers)
      .innerJoin(familyMembers, eq(journalEntryFamilyMembers.familyMemberId, familyMembers.id))
      .where(eq(journalEntryFamilyMembers.journalEntryId, entryId));

    // Get character stats related to this entry
    const entryCharacterStats = await db
      .select({
        characterStat: characterStats,
        xpAmount: journalEntryCharacterStats.xpAmount,
      })
      .from(journalEntryCharacterStats)
      .innerJoin(characterStats, eq(journalEntryCharacterStats.characterStatId, characterStats.id))
      .where(eq(journalEntryCharacterStats.journalEntryId, entryId));
    
    const entry = entryResult[0];
    
    const response: ApiResponse<{ entry: JournalEntry }> = {
      success: true,
      data: {
        entry: {
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          tags: entryTags.map((et: { tag: Tag & { createdAt: Date } }) => ({
            ...et.tag,
            createdAt: et.tag.createdAt.toISOString(),
          })),
          familyMembers: entryFamilyMembers.map((efm: { familyMember: FamilyMember & { createdAt: Date, updatedAt: Date } }) => ({
            ...efm.familyMember,
            createdAt: efm.familyMember.createdAt.toISOString(),
            updatedAt: efm.familyMember.updatedAt.toISOString(),
          })),
          characterStats: entryCharacterStats.map((ecs: { characterStat: CharacterStat & { createdAt: Date, updatedAt: Date }, xpAmount: number }) => ({
            characterStat: {
              ...ecs.characterStat,
              createdAt: ecs.characterStat.createdAt.toISOString(),
              updatedAt: ecs.characterStat.updatedAt.toISOString(),
            },
            xpAmount: ecs.xpAmount,
          })),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get journal entry by ID error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve journal entry' });
  }
}

// Create a new journal entry
export async function createJournalEntry(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as JournalEntryInput;
    
    // Insert journal entry
    const result = await db.insert(journalEntries).values({
      userId: currentUser.id,
      content: body.content,
      title: body.title || null,
      date: body.date,
    }).returning();
    
    const entry = result[0];
    
    // Add tags if provided
    if (body.tagIds && body.tagIds.length > 0) {
      // Verify all tags belong to the user
      const userTags = await db
        .select()
        .from(tags)
        .where(
          and(
            eq(tags.userId, currentUser.id),
            sql`${tags.id} IN (${body.tagIds.join(', ')})`
          )
        );
      
      // Add verified tags to the entry
      if (userTags.length > 0) {
        const tagValues = userTags.map(tag => ({
          journalEntryId: entry.id,
          tagId: tag.id,
        }));
        
        await db.insert(journalEntryTags).values(tagValues);
      }
    }
    
    // Add family members if provided
    if (body.familyMemberIds && body.familyMemberIds.length > 0) {
      // Verify all family members belong to the user
      const userFamilyMembers = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.userId, currentUser.id),
            sql`${familyMembers.id} IN (${body.familyMemberIds.join(', ')})`
          )
        );
      
      // Add verified family members to the entry
      if (userFamilyMembers.length > 0) {
        const familyMemberValues = userFamilyMembers.map(fm => ({
          journalEntryId: entry.id,
          familyMemberId: fm.id,
        }));
        
        await db.insert(journalEntryFamilyMembers).values(familyMemberValues);
      }
    }
    
    const response: ApiResponse<{ entry: JournalEntry }> = {
      success: true,
      data: {
        entry: {
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response, 201);
  } catch (error) {
    console.error('Create journal entry error:', error);
    throw new HTTPException(500, { message: 'Failed to create journal entry' });
  }
}

// Analyze a journal entry using AI
export async function analyzeJournalEntry(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json() as JournalAnalysisInput;
    
    // Get the journal entry
    const entryResult = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, body.journalEntryId),
          eq(journalEntries.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (entryResult.length === 0) {
      throw new HTTPException(404, { message: 'Journal entry not found' });
    }
    
    const entry = entryResult[0];
    
    // Get user's character stats
    const userStats = await db
      .select()
      .from(characterStats)
      .where(eq(characterStats.userId, currentUser.id));
    
    // Get user's existing tags
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, currentUser.id));
    
    // Get user's family members
    const userFamilyMembers = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, currentUser.id));
    
    // Format the prompt for AI analysis
    const aiPrompt = `
      Analyze the following journal entry and return:
      1. A concise title (1-5 words)
      2. A brief synopsis (1-2 sentences)
      3. A summary without the conversation elements (paragraph form)
      4. Relevant tags (use existing tags if applicable: ${userTags.map((t: any) => t.name).join(', ')})
      5. For each character stat, determine if there's evidence of it in the entry and suggest an XP amount (1-10):
         ${userStats.map((stat: any) => `- ${stat.name}: ${stat.description || ''}`).join('\n')}
      6. Family members mentioned: ${userFamilyMembers.map((fm: any) => fm.name).join(', ')}
      
      Journal entry:
      ${entry.content}
      
      Format your response as JSON with the following structure:
      {
        "title": "string",
        "synopsis": "string",
        "summary": "string",
        "tags": ["string", "string"],
        "characterStats": [{"id": "uuid", "name": "string", "xpAmount": number}],
        "familyMembers": ["string"]
      }
    `;
    
    // Call OpenAI for analysis
    const analysisResponse = await generateChatCompletion([
      { role: 'system', content: 'You are an AI assistant that analyzes journal entries.' },
      { role: 'user', content: aiPrompt }
    ], { temperature: 0.7 });
    
    // Parse the analysis (assuming it's JSON)
    let analysis: JournalAnalysisResult;
    try {
      analysis = JSON.parse(analysisResponse || '{}') as JournalAnalysisResult;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new HTTPException(500, { message: 'Failed to parse AI analysis' });
    }
    
    // Update the journal entry with AI analysis
    await db
      .update(journalEntries)
      .set({
        title: analysis.title,
        synopsis: analysis.synopsis,
        summary: analysis.summary,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, entry.id));
    
    // Process tags
    if (analysis.tags && analysis.tags.length > 0) {
      for (const tagName of analysis.tags) {
        // Check if tag exists
        let tagId: string;
        const existingTag = userTags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
        
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const newTagResult = await db.insert(tags).values({
            userId: currentUser.id,
            name: tagName,
          }).returning();
          
          tagId = newTagResult[0].id;
        }
        
        // Add tag to journal entry if not already added
        const existingEntryTag = await db
          .select()
          .from(journalEntryTags)
          .where(
            and(
              eq(journalEntryTags.journalEntryId, entry.id),
              eq(journalEntryTags.tagId, tagId)
            )
          )
          .limit(1);
        
        if (existingEntryTag.length === 0) {
          await db.insert(journalEntryTags).values({
            journalEntryId: entry.id,
            tagId,
          });
        }
      }
    }
    
    // Process character stats
    if (analysis.characterStats && analysis.characterStats.length > 0) {
      for (const statData of analysis.characterStats) {
        if (!statData.id || !statData.xpAmount) continue;
        
        // Verify the character stat belongs to the user
        const statExists = userStats.some((s: any) => s.id === statData.id);
        if (!statExists) continue;
        
        // Add XP to character stat
        await db
          .update(characterStats)
          .set({
            currentXP: sql`${characterStats.currentXP} + ${statData.xpAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(characterStats.id, statData.id));
        
        // Record XP gain in journal entry relationship
        await db.insert(journalEntryCharacterStats).values({
          journalEntryId: entry.id,
          characterStatId: statData.id,
          xpAmount: statData.xpAmount,
        });
      }
    }
    
    // Process family members
    if (analysis.familyMembers && analysis.familyMembers.length > 0) {
      for (const familyMemberName of analysis.familyMembers) {
        const familyMember = userFamilyMembers.find(
          (fm: any) => fm.name.toLowerCase() === familyMemberName.toLowerCase()
        );
        
        if (familyMember) {
          // Add family member to journal entry if not already added
          const existingEntryFamilyMember = await db
            .select()
            .from(journalEntryFamilyMembers)
            .where(
              and(
                eq(journalEntryFamilyMembers.journalEntryId, entry.id),
                eq(journalEntryFamilyMembers.familyMemberId, familyMember.id)
              )
            )
            .limit(1);
          
          if (existingEntryFamilyMember.length === 0) {
            await db.insert(journalEntryFamilyMembers).values({
              journalEntryId: entry.id,
              familyMemberId: familyMember.id,
            });
          }
        }
      }
    }
    
    const response: ApiResponse<{ analysis: JournalAnalysisResult }> = {
      success: true,
      data: {
        analysis,
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Analyze journal entry error:', error);
    throw new HTTPException(500, { message: 'Failed to analyze journal entry' });
  }
}

// Update a journal entry
export async function updateJournalEntry(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const entryId = c.req.param('id');
    const body = await c.req.json() as JournalEntryInput;
    
    // Check if entry exists and belongs to user
    const existingEntry = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingEntry.length === 0) {
      throw new HTTPException(404, { message: 'Journal entry not found' });
    }
    
    // Update entry
    const result = await db
      .update(journalEntries)
      .set({
        content: body.content,
        title: body.title || null,
        date: body.date,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, entryId))
      .returning();
    
    const entry = result[0];
    
    // Handle tags if provided (replace existing)
    if (body.tagIds !== undefined) {
      // Delete existing tags
      await db
        .delete(journalEntryTags)
        .where(eq(journalEntryTags.journalEntryId, entryId));
      
      // Add new tags if any
      if (body.tagIds && body.tagIds.length > 0) {
        // Verify all tags belong to the user
        const userTags = await db
          .select()
          .from(tags)
          .where(
            and(
              eq(tags.userId, currentUser.id),
              sql`${tags.id} IN (${body.tagIds.join(', ')})`
            )
          );
        
        // Add verified tags to the entry
        if (userTags.length > 0) {
          const tagValues = userTags.map((tag: any) => ({
            journalEntryId: entry.id,
            tagId: tag.id,
          }));
          
          await db.insert(journalEntryTags).values(tagValues);
        }
      }
    }
    
    // Handle family members if provided (replace existing)
    if (body.familyMemberIds !== undefined) {
      // Delete existing family members
      await db
        .delete(journalEntryFamilyMembers)
        .where(eq(journalEntryFamilyMembers.journalEntryId, entryId));
      
      // Add new family members if any
      if (body.familyMemberIds && body.familyMemberIds.length > 0) {
        // Verify all family members belong to the user
        const userFamilyMembers = await db
          .select()
          .from(familyMembers)
          .where(
            and(
              eq(familyMembers.userId, currentUser.id),
              sql`${familyMembers.id} IN (${body.familyMemberIds.join(', ')})`
            )
          );
        
        // Add verified family members to the entry
        if (userFamilyMembers.length > 0) {
          const familyMemberValues = userFamilyMembers.map((fm: any) => ({
            journalEntryId: entry.id,
            familyMemberId: fm.id,
          }));
          
          await db.insert(journalEntryFamilyMembers).values(familyMemberValues);
        }
      }
    }
    
    const response: ApiResponse<{ entry: JournalEntry }> = {
      success: true,
      data: {
        entry: {
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        },
      },
    };
    
    return c.json(response);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update journal entry error:', error);
    throw new HTTPException(500, { message: 'Failed to update journal entry' });
  }
}

// Delete a journal entry
export async function deleteJournalEntry(c: Context): Promise<Response> {
  try {
    const currentUser = c.get('user');
    const entryId = c.req.param('id');
    
    // Check if entry exists and belongs to user
    const existingEntry = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, currentUser.id)
        )
      )
      .limit(1);
    
    if (existingEntry.length === 0) {
      throw new HTTPException(404, { message: 'Journal entry not found' });
    }
    
    // Delete entry (cascades to related tables)
    await db
      .delete(journalEntries)
      .where(eq(journalEntries.id, entryId));
    
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete journal entry error:', error);
    throw new HTTPException(500, { message: 'Failed to delete journal entry' });
  }
}
