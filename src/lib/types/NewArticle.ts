import type { Article } from '@/server/data/schema';

export type NewArticle = Omit<Article, 'slug' | 'createdAt' | 'updatedAt'>;
