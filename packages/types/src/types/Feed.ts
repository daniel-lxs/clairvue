import { ArticleWithInteraction } from './Article';

export interface Feed {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  link: string;
  type: 'rss' | 'atom';
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date;
}

export interface FeedWithArticles extends Feed {
  articles: ArticleWithInteraction[];
}

export interface NewFeed extends Pick<Feed, 'id' | 'name' | 'description' | 'link' | 'type'> {}
export interface FeedInfo {
  title: string;
  description: string | undefined;
  url: string;
  type: 'rss' | 'atom';
}
