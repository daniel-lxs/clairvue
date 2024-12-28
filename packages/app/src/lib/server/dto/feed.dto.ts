import { z } from 'zod';

export const createFeedDto = z.object({
  name: z.string().min(4).max(255),
  description: z.string().max(1000).optional(),
  link: z.string().url(),
  collectionId: z.string().refine((val) => !val.includes(' '), 'Slug cannot contain spaces')
});

export type CreateFeedDto = z.infer<typeof createFeedDto>;

export const createFeedsDto = z.array(createFeedDto);

export const updateFeedDto = z.object({
  id: z.string().length(8, { message: 'Invalid Feed ID' }),
  name: z.string().min(4).max(255),
  description: z.string().max(1000).optional(),
  link: z.string().url(),
  collectionId: z.string().refine((val) => !val.includes(' '), 'Slug cannot contain spaces')
});

export type UpdateFeedDto = z.infer<typeof updateFeedDto>;
