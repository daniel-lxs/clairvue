import { z } from 'zod';

export const createArticleDto = z.object({
  title: z.string(),
  description: z.string().optional(),
  readable: z.boolean(),
  image: z.string().optional(),
  author: z.string().optional(),
  link: z.string(),
  siteName: z.string(),
  publishedAt: z.date({ coerce: true })
});

export const createArticlesDto = z.object({
  articles: z.array(createArticleDto)
});
