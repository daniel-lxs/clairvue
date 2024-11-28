import { Feed } from './Feed';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionWithFeeds extends Collection {
  feeds: Feed[];
}

export interface CollectionToFeed {
  collectionId: string;
  feedId: string;
  userId: string;
}
