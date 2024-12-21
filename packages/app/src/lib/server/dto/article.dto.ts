import { z } from 'zod';

export const createArticleDto = z.object({
  title: z.string(),
  description: z.string().optional(),
  readable: z.boolean(),
  readableContent: z
    .object({
      title: z.string(),
      content: z.string(),
      textContent: z.string(),
      length: z.number(),
      excerpt: z.string(),
      byline: z.string().nullable(),
      dir: z.string().nullable(),
      siteName: z.string().nullable(),
      lang: z.string().nullable(),
      contentHash: z.string(),
      createdAt: z.string(),
      publishedTime: z.string().nullable()
    })
    .optional(),
  image: z.string().optional(),
  author: z.string().optional(),
  link: z.string(),
  siteName: z.string(),
  publishedAt: z.date({ coerce: true })
});

export const createArticlesDto = z.array(createArticleDto);
