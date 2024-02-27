import type { Article } from '@/data/schema';

export type NewArticle = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
