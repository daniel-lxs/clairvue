import { z } from 'zod';

export const createBoardDto = z.object({
	name: z.string().min(4).max(255)
});

export type CreateBoardDto = z.infer<typeof createBoardDto>;

export const updateBoardDto = z.object({
	id: z.string().length(8, { message: 'Invalid board ID' }),
	name: z.string().min(4).max(255)
});

export type UpdateBoardDto = z.infer<typeof updateBoardDto>;

export const deleteFeedFromBoardDto = z.object({
	id: z.string().length(8, { message: 'Invalid RSS Feed ID' }),
	rssFeedId: z.string().length(8, { message: 'Invalid board ID' })
});

export type DeleteFeedFromBoardDto = z.infer<typeof deleteFeedFromBoardDto>;

export const addFeedToBoardDto = z.object({
	id: z.string().length(8, { message: 'Invalid board ID' }),
	rssFeedId: z.string().length(8, { message: 'Invalid RSS Feed ID' })
});

export type AddFeedToBoardDto = z.infer<typeof addFeedToBoardDto>;
