import { Feed } from './Feed';

/**
 * Input data for syncing articles from a feed
 */
export interface SyncFeedArticlesInput {
  feed: Feed;
}

/**
 * Input data for refreshing an article's content
 */
export interface RefreshArticleContentInput {
  slug: string;
  url: string;
}

/**
 * Input data for extracting article metadata
 */
export interface ExtractArticleMetadataInput {
  url: string;
}

/**
 * Input data for importing an article
 */
export interface ImportArticleInput {
  title: string;
  url: string;
  makeReadable: boolean;
}
