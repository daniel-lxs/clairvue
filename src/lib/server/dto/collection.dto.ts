import { z } from 'zod';

export const createCollectionDto = z.object({
  name: z.string().min(4).max(255)
});

export type CreateCollectionDto = z.infer<typeof createCollectionDto>;

export const updateCollectionDto = z.object({
  id: z.string(),
  name: z.string().min(4).max(255)
});

export type UpdateCollectionDto = z.infer<typeof updateCollectionDto>;

export const deleteFeedFromCollectionDto = z.object({
  id: z.string(),
  feedId: z.string()
});

export type DeleteFeedFromCollectionDto = z.infer<typeof deleteFeedFromCollectionDto>;

export const addFeedToCollectionDto = z.object({
  id: z.string(),
  feedId: z.string()
});

export type AddFeedToCollectionDto = z.infer<typeof addFeedToCollectionDto>;

export const addFeedsToCollectionDto = z.object({
  id: z.string(),
  feedIds: z.array(z.string())
});

export type AddFeedsToCollectionDto = z.infer<typeof addFeedsToCollectionDto>;
