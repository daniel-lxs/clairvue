import { z } from 'zod';

export const createFeedDto = z.object({
	name: z.string().min(4).max(255),
	description: z.string().min(4).max(1000),
	link: z.string().url(),
	type: z.enum(['rss', 'atom'])
});

export type CreateFeedDto = z.infer<typeof createFeedDto>;

export const updateFeedDto = z.object({
	id: z.string().length(8, { message: 'Invalid Feed ID' }),
	name: z.string().min(4).max(255),
	description: z.string().min(4).max(1000),
	link: z.string().url(),
	type: z.enum(['rss', 'atom'])
});

export type UpdateFeedDto = z.infer<typeof updateFeedDto>;
