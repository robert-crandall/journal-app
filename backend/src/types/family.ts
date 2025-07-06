import { familyMembers, familyTaskFeedback } from '../db/schema/family';

// Family member types
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
export type UpdateFamilyMember = Partial<Omit<NewFamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Family task feedback types
export type FamilyTaskFeedback = typeof familyTaskFeedback.$inferSelect;
export type NewFamilyTaskFeedback = typeof familyTaskFeedback.$inferInsert;
export type UpdateFamilyTaskFeedback = Partial<Omit<NewFamilyTaskFeedback, 'id' | 'userId' | 'createdAt'>>;

// API response types
export interface CreateFamilyMemberRequest {
  name: string;
  relationship: string;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  likes?: string;
  dislikes?: string;
  energyLevel?: string;
}

export interface UpdateFamilyMemberRequest extends Partial<CreateFamilyMemberRequest> {}

export interface CreateFamilyTaskFeedbackRequest {
  familyMemberId: string;
  taskDescription: string;
  feedback?: string;
  enjoyedIt?: 'yes' | 'no';
  notes?: string;
}
