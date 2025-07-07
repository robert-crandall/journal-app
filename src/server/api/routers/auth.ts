import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { hash, verify } from '@node-rs/argon2';
import { generateId } from 'lucia';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { lucia } from '@/lib/auth';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const authInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(authInput)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      const hashedPassword = await hash(input.password);
      const userId = generateId(15);

      await ctx.db.insert(users).values({
        id: userId,
        email: input.email,
        hashedPassword,
      });

      const session = await lucia.createSession(userId, {});
      return { sessionId: session.id };
    }),

  login: publicProcedure
    .input(authInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const validPassword = await verify(user.hashedPassword, input.password);
      if (!validPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const session = await lucia.createSession(user.id, {});
      return { sessionId: session.id };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      await lucia.invalidateSession(ctx.session.id);
      return { success: true };
    }),

  getUser: protectedProcedure
    .query(({ ctx }) => {
      return ctx.user;
    }),
});
