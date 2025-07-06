import { db } from './db';
import { familyMembers, familyTaskFeedback, familyConnectionXp } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { FamilyMember, FamilyTaskFeedback, FamilyConnectionXp } from './db/schema';

export interface FamilyMemberInput {
  name: string;
  relationship: string;
  birthday?: Date;
  likes?: string[];
  dislikes?: string[];
  energyLevel?: string;
}

export interface FamilyTaskFeedbackInput {
  familyMemberId: string;
  taskId?: string;
  liked: boolean;
  notes?: string;
}

export interface FamilyConnectionXpInput {
  familyMemberId: string;
  source: 'task' | 'journal';
  xp: number;
  comment?: string;
}

/**
 * Get all family members for a user
 */
export async function getUserFamilyMembers(userId: string): Promise<FamilyMember[]> {
  return await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).orderBy(familyMembers.createdAt);
}

/**
 * Get a single family member by ID
 */
export async function getFamilyMemberById(familyMemberId: string, userId: string): Promise<FamilyMember | null> {
  const [familyMember] = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
    .limit(1);

  return familyMember || null;
}

/**
 * Create a new family member
 */
export async function createFamilyMember(userId: string, familyMemberData: FamilyMemberInput): Promise<FamilyMember> {
  const [newFamilyMember] = await db
    .insert(familyMembers)
    .values({
      userId,
      name: familyMemberData.name.trim(),
      relationship: familyMemberData.relationship.trim(),
      birthday: familyMemberData.birthday ? familyMemberData.birthday.toISOString().split('T')[0] : null,
      likes: familyMemberData.likes || [],
      dislikes: familyMemberData.dislikes || [],
      energyLevel: familyMemberData.energyLevel || null,
      lastInteraction: new Date(),
    })
    .returning();

  return newFamilyMember;
}

/**
 * Update a family member
 */
export async function updateFamilyMember(familyMemberId: string, userId: string, familyMemberData: Partial<FamilyMemberInput>): Promise<FamilyMember | null> {
  const [updatedFamilyMember] = await db
    .update(familyMembers)
    .set({
      ...(familyMemberData.name && { name: familyMemberData.name.trim() }),
      ...(familyMemberData.relationship && { relationship: familyMemberData.relationship.trim() }),
      ...(familyMemberData.birthday !== undefined && { birthday: familyMemberData.birthday ? familyMemberData.birthday.toISOString().split('T')[0] : null }),
      ...(familyMemberData.likes && { likes: familyMemberData.likes }),
      ...(familyMemberData.dislikes && { dislikes: familyMemberData.dislikes }),
      ...(familyMemberData.energyLevel !== undefined && { energyLevel: familyMemberData.energyLevel }),
      updatedAt: new Date(),
    })
    .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
    .returning();

  return updatedFamilyMember || null;
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(familyMemberId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Update last interaction date for a family member
 */
export async function updateLastInteraction(familyMemberId: string, userId: string, interactionDate?: Date): Promise<FamilyMember | null> {
  const [updatedFamilyMember] = await db
    .update(familyMembers)
    .set({
      lastInteraction: interactionDate || new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(familyMembers.id, familyMemberId), eq(familyMembers.userId, userId)))
    .returning();

  return updatedFamilyMember || null;
}

/**
 * Create task feedback for a family member
 */
export async function createFamilyTaskFeedback(feedbackData: FamilyTaskFeedbackInput): Promise<FamilyTaskFeedback> {
  const [newFeedback] = await db
    .insert(familyTaskFeedback)
    .values({
      familyMemberId: feedbackData.familyMemberId,
      taskId: feedbackData.taskId || null,
      liked: feedbackData.liked ? 1 : 0,
      notes: feedbackData.notes?.trim() || null,
    })
    .returning();

  return newFeedback;
}

/**
 * Get task feedback for a family member
 */
export async function getFamilyTaskFeedback(familyMemberId: string): Promise<FamilyTaskFeedback[]> {
  return await db.select().from(familyTaskFeedback).where(eq(familyTaskFeedback.familyMemberId, familyMemberId)).orderBy(desc(familyTaskFeedback.date));
}

/**
 * Create connection XP for a family member
 */
export async function createFamilyConnectionXp(xpData: FamilyConnectionXpInput): Promise<FamilyConnectionXp> {
  const [newXp] = await db
    .insert(familyConnectionXp)
    .values({
      familyMemberId: xpData.familyMemberId,
      source: xpData.source,
      xp: xpData.xp,
      comment: xpData.comment?.trim() || null,
    })
    .returning();

  return newXp;
}

/**
 * Get connection XP history for a family member
 */
export async function getFamilyConnectionXp(familyMemberId: string): Promise<FamilyConnectionXp[]> {
  return await db.select().from(familyConnectionXp).where(eq(familyConnectionXp.familyMemberId, familyMemberId)).orderBy(desc(familyConnectionXp.date));
}

/**
 * Get total connection XP for a family member
 */
export async function getTotalFamilyConnectionXp(familyMemberId: string): Promise<number> {
  const xpRecords = await getFamilyConnectionXp(familyMemberId);
  return xpRecords.reduce((total, record) => total + record.xp, 0);
}

/**
 * Get family members who haven't had interaction in X days
 */
export async function getFamilyMembersNeedingAttention(userId: string, daysSince: number): Promise<FamilyMember[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSince);

  return await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.userId, userId)))
    .orderBy(familyMembers.lastInteraction);
}
