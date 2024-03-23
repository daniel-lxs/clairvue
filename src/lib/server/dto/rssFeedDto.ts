import { z } from 'zod';

export const createRssFeedDto = z.object({
	name: z.string().min(4).max(255),
	description: z.string().min(4).max(1000),
	link: z.string().url()
});

export type CreateRssFeedDto = z.infer<typeof createRssFeedDto>;

export const updateRssFeedDto = z.object({
	id: z.string().length(8, { message: 'Invalid RSS Feed ID' }),
	name: z.string().min(4).max(255),
	description: z.string().min(4).max(1000),
	link: z.string().url()
});

export type UpdateRssFeedDto = z.infer<typeof updateRssFeedDto>;
