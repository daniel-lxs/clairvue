import type { Feed } from '@/server/data/schema';

export type CreateFeedResult = CreateFeedSuccess | CreateFeedError;

interface CreateFeedSuccess {
  result: 'success';
  data: Feed;
}

interface CreateFeedError {
  result: 'error';
  reason: string;
}
