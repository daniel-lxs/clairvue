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

export interface CollectionToFeeds {
  collectionId: string;
  feedId: string;
  userId: string;
}

export interface AddFeedsToCollectionResult {
  validationErrors: Error[];
  insertErrors: Error[];
}
