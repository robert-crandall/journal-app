import { db, journalSessions, journalMessages, journalTags, journalEntryTags, JournalSession, JournalMessage, JournalTag } from '../db'
import { eq, desc, and } from 'drizzle-orm'
import { gptService } from './gpt'

export class JournalService {
  static async createSession(userId: string): Promise<JournalSession> {
    const [session] = await db
      .insert(journalSessions)
      .values({
        userId,
      })
      .returning()

    return session
  }

  static async addMessage(sessionId: string, role: 'user' | 'gpt', content: string): Promise<JournalMessage> {
    const [message] = await db
      .insert(journalMessages)
      .values({
        sessionId,
        role,
        content,
      })
      .returning()

    return message
  }

  static async getSessionMessages(sessionId: string): Promise<JournalMessage[]> {
    return db
      .select()
      .from(journalMessages)
      .where(eq(journalMessages.sessionId, sessionId))
      .orderBy(journalMessages.createdAt)
  }

  static async getSession(sessionId: string): Promise<JournalSession | null> {
    const [session] = await db
      .select()
      .from(journalSessions)
      .where(eq(journalSessions.id, sessionId))
      .limit(1)

    return session || null
  }

  static async generateGPTResponse(sessionId: string): Promise<string> {
    const messages = await this.getSessionMessages(sessionId)
    
    // Convert messages to conversation format for GPT
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'gpt' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))

    return gptService.generateJournalResponse(conversationHistory)
  }

  static async compileJournal(sessionId: string): Promise<string> {
    const messages = await this.getSessionMessages(sessionId)
    
    // Convert messages to conversation format for GPT
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'gpt' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))

    return gptService.compileJournalEntry(conversationHistory)
  }

  static async extractMetadata(finalText: string) {
    // Get existing tags
    const existingTags = await db.select({ name: journalTags.name }).from(journalTags)
    const tagNames = existingTags.map(tag => tag.name)

    return gptService.extractMetadata(finalText, tagNames)
  }

  static async submitJournal(sessionId: string): Promise<JournalSession> {
    // Compile the journal entry
    const finalizedText = await this.compileJournal(sessionId)
    
    // Extract metadata
    const metadata = await this.extractMetadata(finalizedText)
    
    // Update the session with finalized data
    const [session] = await db
      .update(journalSessions)
      .set({
        submittedAt: new Date(),
        finalizedText,
        title: metadata.title,
        summary: metadata.condensedSummary,
        fullSummary: metadata.fullSummary,
      })
      .where(eq(journalSessions.id, sessionId))
      .returning()

    // Handle tags
    if (metadata.tagNames.length > 0) {
      await this.assignTags(sessionId, metadata.tagNames)
    }

    return session
  }

  static async assignTags(sessionId: string, tagNames: string[]): Promise<void> {
    // Create tags that don't exist yet
    for (const tagName of tagNames) {
      try {
        await db
          .insert(journalTags)
          .values({ name: tagName })
          .onConflictDoNothing()
      } catch (error) {
        // Tag might already exist, continue
      }
    }

    // Get all tag IDs
    const tags = await db
      .select()
      .from(journalTags)
      .where(eq(journalTags.name, tagNames[0])) // This is wrong, need to fix

    // Better approach: get all tags that match our names
    const allTags = await db.select().from(journalTags)
    const matchingTags = allTags.filter(tag => tagNames.includes(tag.name))

    // Create journal-tag relationships
    if (matchingTags.length > 0) {
      const tagRelations = matchingTags.map(tag => ({
        journalId: sessionId,
        tagId: tag.id,
      }))
      
      await db
        .insert(journalEntryTags)
        .values(tagRelations)
        .onConflictDoNothing()
    }
  }

  static async getUserJournals(userId: string): Promise<Array<{
    id: string
    title: string | null
    summary: string | null
    createdAt: Date | null
  }>> {
    const journals = await db
      .select({
        id: journalSessions.id,
        title: journalSessions.title,
        summary: journalSessions.summary,
        createdAt: journalSessions.submittedAt,
      })
      .from(journalSessions)
      .where(and(
        eq(journalSessions.userId, userId),
        eq(journalSessions.submittedAt, journalSessions.submittedAt) // Only submitted journals
      ))
      .orderBy(desc(journalSessions.submittedAt))

    return journals.filter(journal => journal.createdAt !== null)
  }

  static async getJournalWithDetails(journalId: string, userId: string) {
    // Get the journal session
    const [journal] = await db
      .select()
      .from(journalSessions)
      .where(and(
        eq(journalSessions.id, journalId),
        eq(journalSessions.userId, userId)
      ))
      .limit(1)

    if (!journal) {
      return null
    }

    // Get messages
    const messages = await this.getSessionMessages(journalId)

    // Get tags
    const tags = await db
      .select({
        id: journalTags.id,
        name: journalTags.name,
      })
      .from(journalTags)
      .innerJoin(journalEntryTags, eq(journalTags.id, journalEntryTags.tagId))
      .where(eq(journalEntryTags.journalId, journalId))

    return {
      ...journal,
      messages,
      tags,
    }
  }

  static async updateJournal(journalId: string, userId: string, updates: {
    title?: string
    summary?: string
    finalizedText?: string
  }): Promise<JournalSession | null> {
    const [journal] = await db
      .update(journalSessions)
      .set(updates)
      .where(and(
        eq(journalSessions.id, journalId),
        eq(journalSessions.userId, userId)
      ))
      .returning()

    return journal || null
  }
}
