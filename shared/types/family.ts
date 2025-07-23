// Family types - shared between backend and frontend
// Extracted from backend database schema to remove Drizzle dependencies

// Family member types
export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthday: Date | null;
  likes: string | null;
  dislikes: string | null;
  notes: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewFamilyMember {
  id?: string;
  userId: string;
  name: string;
  relationship: string;
  birthday?: Date | null;
  likes?: string | null;
  dislikes?: string | null;
  notes?: string | null;
  avatar?: string | null;
  xp?: number;
  level?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateFamilyMember = Partial<Omit<NewFamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Family task feedback types
export interface FamilyTaskFeedback {
  id: string;
  userId: string;
  familyMemberId: string;
  taskDescription: string;
  feedback: string | null;
  enjoyedIt: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface NewFamilyTaskFeedback {
  id?: string;
  userId: string;
  familyMemberId: string;
  taskDescription: string;
  feedback?: string | null;
  enjoyedIt?: string | null;
  notes?: string | null;
  createdAt?: Date;
}

export type UpdateFamilyTaskFeedback = Partial<Omit<NewFamilyTaskFeedback, 'id' | 'userId' | 'createdAt'>>;

// API response types
export interface CreateFamilyMemberRequest {
  name: string;
  relationship: string;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  likes?: string;
  dislikes?: string;
  notes?: string;
  avatar?: string; // Base64 encoded image
}

export interface UpdateFamilyMemberRequest extends Partial<CreateFamilyMemberRequest> {}

export interface CreateFamilyTaskFeedbackRequest {
  familyMemberId: string;
  taskDescription: string;
  feedback?: string;
  enjoyedIt?: 'yes' | 'no';
  notes?: string;
}
