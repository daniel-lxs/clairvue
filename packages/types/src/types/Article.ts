import { Feed } from './Feed';

export interface Article {
  id: string;
  slug: string;
  title: string;
  link: string;
  feedId: string;
  description?: string;
  siteName: string;
  image?: string;
  author?: string;
  readable: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleWithFeed extends Article {
  feed?: Feed;
}

export interface NewArticle extends Omit<Article, 'id' | 'slug' | 'createdAt' | 'updatedAt'> {}

export interface ArticleMetadata {
  title: string;
  description?: string;
  readable: boolean;
  image?: string;
  author?: string;
  link: string;
  siteName: string;
  publishedAt: Date;
}

export interface ReadableArticle {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
  publishedTime: string;
  contentHash: string;
  createdAt: string;
}

export interface ProcessArticlesOptions {
  chunkSize: number;
  parallelDelay: number;
}
