import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from './init'
import { db } from '@/lib/db'
import { users, characters, stats, familyMembers, todos } from '@/lib/db/schema'
import { 
  signUpSchema, 
  signInSchema, 
  characterSchema, 
  statSchema, 
  familyMemberSchema, 
  todoSchema, 
  updateTodoSchema 
} from '@/lib/schemas'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { TRPCError } from '@trpc/server'

export const appRouter = createTRPCRouter({
  // Auth procedures
  auth: createTRPCRouter({
    signUp: publicProcedure
      .input(signUpSchema)
      .mutation(async ({ input }) => {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1)

        if (existingUser[0]) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          })
        }

        const hashedPassword = await bcrypt.hash(input.password, 12)

        const newUser = await db
          .insert(users)
          .values({
            email: input.email,
            name: input.name,
            hashedPassword,
          })
          .returning()

        return { user: { id: newUser[0].id, email: newUser[0].email, name: newUser[0].name } }
      }),

    me: protectedProcedure.query(({ ctx }) => {
      return ctx.session.user
    }),
  }),

  // Character procedures
  character: createTRPCRouter({
    create: protectedProcedure
      .input(characterSchema)
      .mutation(async ({ ctx, input }) => {
        const newCharacter = await db
          .insert(characters)
          .values({
            userId: ctx.session.user.id,
            ...input,
          })
          .returning()

        return newCharacter[0]
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      const character = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.session.user.id))
        .limit(1)

      return character[0] || null
    }),

    update: protectedProcedure
      .input(characterSchema.partial().extend({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input
        const updatedCharacter = await db
          .update(characters)
          .set({ ...data, updatedAt: new Date() })
          .where(and(eq(characters.id, id), eq(characters.userId, ctx.session.user.id)))
          .returning()

        return updatedCharacter[0]
      }),
  }),

  // Stats procedures
  stats: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db
        .select()
        .from(stats)
        .where(eq(stats.userId, ctx.session.user.id))
    }),

    create: protectedProcedure
      .input(statSchema)
      .mutation(async ({ ctx, input }) => {
        const newStat = await db
          .insert(stats)
          .values({
            userId: ctx.session.user.id,
            ...input,
          })
          .returning()

        return newStat[0]
      }),

    addXp: protectedProcedure
      .input(z.object({ statId: z.string(), xp: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const stat = await db
          .select()
          .from(stats)
          .where(and(eq(stats.id, input.statId), eq(stats.userId, ctx.session.user.id)))
          .limit(1)

        if (!stat[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Stat not found' })
        }

        const newTotalXp = stat[0].totalXp + input.xp
        const newLevel = Math.floor(newTotalXp / 100) + 1

        const updatedStat = await db
          .update(stats)
          .set({
            totalXp: newTotalXp,
            level: newLevel,
            updatedAt: new Date(),
          })
          .where(eq(stats.id, input.statId))
          .returning()

        return updatedStat[0]
      }),
  }),

  // Family members procedures
  family: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.userId, ctx.session.user.id))
    }),

    create: protectedProcedure
      .input(familyMemberSchema)
      .mutation(async ({ ctx, input }) => {
        const newMember = await db
          .insert(familyMembers)
          .values({
            userId: ctx.session.user.id,
            ...input,
          })
          .returning()

        return newMember[0]
      }),
  }),

  // Todos procedures
  todos: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db
        .select()
        .from(todos)
        .where(eq(todos.userId, ctx.session.user.id))
    }),

    create: protectedProcedure
      .input(todoSchema)
      .mutation(async ({ ctx, input }) => {
        const newTodo = await db
          .insert(todos)
          .values({
            userId: ctx.session.user.id,
            ...input,
          })
          .returning()

        return newTodo[0]
      }),

    update: protectedProcedure
      .input(updateTodoSchema)
      .mutation(async ({ ctx, input }) => {
        const updatedTodo = await db
          .update(todos)
          .set({
            completed: input.completed,
            completedAt: input.completed ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.session.user.id)))
          .returning()

        return updatedTodo[0]
      }),
  }),
})

export type AppRouter = typeof appRouter
