import { z } from 'zod';

export const createCollectionDto = z.object({
  name: z.string().min(4).max(255)
});

export type CreateCollectionDto = z.infer<typeof createCollectionDto>;

export const updateCollectionDto = z.object({
  id: z.string().length(8, { message: 'Invalid collection ID' }),
  name: z.string().min(4).max(255)
});

export type UpdateCollectionDto = z.infer<typeof updateCollectionDto>;

export const deleteFeedFromCollectionDto = z.object({
  id: z.string().length(8, { message: 'Invalid Feed ID' }),
  feedId: z.string().length(8, { message: 'Invalid collection ID' })
});

export type DeleteFeedFromCollectionDto = z.infer<typeof deleteFeedFromCollectionDto>;

export const addFeedToCollectionDto = z.object({
  id: z.string().length(8, { message: 'Invalid collection ID' }),
  feedId: z.string().length(8, { message: 'Invalid Feed ID' })
});

export type AddFeedToCollectionDto = z.infer<typeof addFeedToCollectionDto>;
