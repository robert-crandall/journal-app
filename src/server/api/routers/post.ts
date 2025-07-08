import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { PostSchema } from '@/lib/validations/post';

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });
    }),

  getUserPosts: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        authorId: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }),

  create: protectedProcedure
    .input(PostSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          published: input.published,
          authorId: ctx.session.user.id,
        },
      });

      return post;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: PostSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const post = await ctx.prisma.post.findUnique({
        where: {
          id,
        },
      });

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new Error('Not authorized');
      }

      const updatedPost = await ctx.prisma.post.update({
        where: {
          id,
        },
        data,
      });

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new Error('Not authorized');
      }

      await ctx.prisma.post.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
