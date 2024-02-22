import { z } from 'zod';

export const createBoardDto = z.object({
	slug: z.string().min(4).max(255),
	name: z.string().min(4).max(255),
	editCode: z.string().min(8).max(255)
});

export type CreateBoardDto = z.infer<typeof createBoardDto>;

export const updateBoardDto = z.object({
	id: z.string().length(8, { message: 'Invalid board ID' }),
	name: z.string().min(4).max(255)
});

export type UpdateBoardDto = z.infer<typeof updateBoardDto>;
