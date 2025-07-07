import { z } from 'zod'

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Character schemas
export const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  class: z.string().min(1, 'Class is required'),
  backstory: z.string().optional(),
  goals: z.string().optional(),
})

// Stats schemas
export const statSchema = z.object({
  name: z.string().min(1, 'Stat name is required'),
  isCustom: z.boolean().default(false),
})

// Family member schemas
export const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

// Todo schemas
export const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  xpReward: z.number().min(1).default(10),
  statId: z.string().optional(),
})

export const updateTodoSchema = z.object({
  id: z.string(),
  completed: z.boolean(),
})

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CharacterInput = z.infer<typeof characterSchema>
export type StatInput = z.infer<typeof statSchema>
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>
export type TodoInput = z.infer<typeof todoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
