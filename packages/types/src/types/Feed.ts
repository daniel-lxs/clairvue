import { Article } from './Article';

export interface Feed {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  link: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date;
}

export interface FeedWithArticles extends Feed {
  articleCount: number;
  articles: Article[];
}

export interface NewFeed extends Pick<Feed, 'id' | 'name' | 'description' | 'link'> {}

export interface CreateFeedResult {
  result: 'success' | 'error';
  data?: Feed;
  reason?: string;
}
