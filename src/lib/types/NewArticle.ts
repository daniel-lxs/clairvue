import type { Article } from '@/server/data/schema';

export type NewArticle = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
