import type { Feed } from '../server/data/schema';

export type NewFeed = Pick<Feed, 'id' | 'name' | 'description' | 'link' | 'type'>;
