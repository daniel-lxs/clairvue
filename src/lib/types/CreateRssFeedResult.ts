import type { RssFeed } from '@/data/schema';

export type CreateRssFeedResult = {
	result: 'success' | 'error';
	reason: string | null;
	data: RssFeed | null;
};
