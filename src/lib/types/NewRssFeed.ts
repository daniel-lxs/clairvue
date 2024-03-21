import type { RssFeed } from '../server/data/schema';

export type NewRssFeed = Pick<RssFeed, 'id' | 'name' | 'description' | 'link'>;
