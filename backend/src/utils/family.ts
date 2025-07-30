import { db } from '../db';
import { familyMembers } from '../db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';

/**
 * Convert family member names to family member IDs for a specific user
 * Performs case-insensitive matching
 * Returns a mapping of family member names (original case) to their IDs
 */
export async function convertFamilyNamesToIds(userId: string, familyNames: string[]): Promise<Record<string, string>> {
  if (!familyNames || familyNames.length === 0) {
    return {};
  }

  // Remove duplicates and filter out empty strings
  const uniqueFamilyNames = [...new Set(familyNames.filter((name) => name && name.trim()))];

  if (uniqueFamilyNames.length === 0) {
    return {};
  }

  // Query the database for family members matching the names (case-insensitive)
  const family = await db
    .select({ id: familyMembers.id, name: familyMembers.name })
    .from(familyMembers)
    .where(and(eq(familyMembers.userId, userId), or(...uniqueFamilyNames.map((name) => ilike(familyMembers.name, name)))));

  // Create a mapping from original family member names to their IDs
  const nameToIdMap: Record<string, string> = {};

  for (const originalName of uniqueFamilyNames) {
    const matchingMember = family.find((member) => member.name.toLowerCase() === originalName.toLowerCase());
    if (matchingMember) {
      nameToIdMap[originalName] = matchingMember.id;
    }
  }

  return nameToIdMap;
}
