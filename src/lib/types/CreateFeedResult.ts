import type { Feed } from '@/server/data/schema';

export type CreateFeedResult = {
  result: 'success' | 'error';
  reason: string | null;
  data: Feed | null;
};
