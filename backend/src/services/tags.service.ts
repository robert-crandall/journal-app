import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { contentTags, toneTags } from '../db/schema'
import { CreateContentTagInput, ContentTag, ToneTag } from '../types'

export class TagsService {
  static async createContentTag(userId: string, input: CreateContentTagInput): Promise<ContentTag | null> {
    try {
      // Check if tag already exists for this user
      const existingTag = await db.query.contentTags.findFirst({
        where: and(
          eq(contentTags.name, input.name),
          eq(contentTags.userId, userId)
        )
      })

      if (existingTag) {
        return existingTag
      }

      const [newTag] = await db.insert(contentTags).values({
        userId,
        name: input.name,
      }).returning()

      return newTag
    } catch (error) {
      console.error('Create content tag error:', error)
      return null
    }
  }

  static async getContentTagsByUserId(userId: string): Promise<ContentTag[]> {
    try {
      return await db.query.contentTags.findMany({
        where: eq(contentTags.userId, userId),
        orderBy: (tags, { asc }) => [asc(tags.name)]
      })
    } catch (error) {
      console.error('Get content tags error:', error)
      return []
    }
  }

  static async deleteContentTag(id: string, userId: string): Promise<boolean> {
    try {
      const result = await db.delete(contentTags)
        .where(and(
          eq(contentTags.id, id),
          eq(contentTags.userId, userId)
        ))

      return result.length > 0
    } catch (error) {
      console.error('Delete content tag error:', error)
      return false
    }
  }

  static async getAllToneTags(): Promise<ToneTag[]> {
    try {
      return await db.query.toneTags.findMany({
        orderBy: (tags, { asc }) => [asc(tags.name)]
      })
    } catch (error) {
      console.error('Get tone tags error:', error)
      return []
    }
  }
}
